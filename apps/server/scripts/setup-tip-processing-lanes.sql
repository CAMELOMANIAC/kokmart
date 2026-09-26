-- Supabase SQL Editor에서 1회 실행하세요.
-- 마스터 전단(Gemini/GitHub Actions)과 지점 전단(Groq/Vercel)의 큐를 분리합니다.

ALTER TABLE flyer_products
ADD COLUMN IF NOT EXISTS tip_processor VARCHAR(30) NOT NULL DEFAULT 'groq_realtime';

UPDATE flyer_products AS fp
SET tip_processor = CASE WHEN f.is_master THEN 'gemini_batch' ELSE 'groq_realtime' END
FROM flyers AS f
WHERE fp.flyer_id = f.id
  AND fp.tip_processor IS DISTINCT FROM CASE WHEN f.is_master THEN 'gemini_batch' ELSE 'groq_realtime' END;

CREATE INDEX IF NOT EXISTS idx_flyer_products_tip_processor_queue
ON flyer_products(tip_processor, tip_status, tip_next_attempt_at, created_at);

-- Vercel/Groq worker는 지점·실시간 큐만 선점합니다.
CREATE OR REPLACE FUNCTION claim_pending_tip_products(p_limit INTEGER DEFAULT 4)
RETURNS SETOF flyer_products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext('claim_pending_tip_products')) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT fp.id
    FROM flyer_products AS fp
    WHERE fp.tip_processor = 'groq_realtime'
      AND (
        (
          fp.tip_status IN ('pending', 'retry')
          AND fp.tip_next_attempt_at <= timezone('utc'::text, now())
        ) OR (
          fp.tip_status = 'processing'
          AND fp.tip_locked_at < timezone('utc'::text, now()) - interval '15 minutes'
        )
      )
      AND NOT EXISTS (
        SELECT 1
        FROM flyer_products AS active
        WHERE active.tip_status = 'processing'
          AND active.tip_processor = 'groq_realtime'
          AND active.tip_locked_at >= timezone('utc'::text, now()) - interval '15 minutes'
      )
    ORDER BY fp.created_at DESC
    FOR UPDATE SKIP LOCKED
    LIMIT GREATEST(1, LEAST(p_limit, 8))
  )
  UPDATE flyer_products AS fp
  SET
    tip_status = 'processing',
    tip_attempts = fp.tip_attempts + 1,
    tip_locked_at = timezone('utc'::text, now()),
    tip_last_error = NULL
  FROM candidates
  WHERE fp.id = candidates.id
  RETURNING fp.*;
END;
$$;

REVOKE ALL ON FUNCTION claim_pending_tip_products(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_pending_tip_products(INTEGER) TO service_role;

-- GitHub Actions는 가장 최근 마스터 전단의 한 페이지를 최대 p_limit개씩 선점합니다.
CREATE OR REPLACE FUNCTION claim_pending_gemini_tip_batch(p_limit INTEGER DEFAULT 12)
RETURNS SETOF flyer_products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtext('claim_pending_gemini_tip_batch')) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH target_page AS (
    SELECT fp.flyer_id, fp.page_index
    FROM flyer_products AS fp
    JOIN flyers AS f ON f.id = fp.flyer_id
    WHERE fp.tip_processor = 'gemini_batch'
      AND f.is_master = true
      AND NOT EXISTS (
        SELECT 1
        FROM flyers AS newer
        WHERE newer.is_master = true
          AND newer.mart_name = f.mart_name
          AND newer.created_at > f.created_at
      )
      AND (
        (
          fp.tip_status IN ('pending', 'retry')
          AND fp.tip_next_attempt_at <= timezone('utc'::text, now())
        ) OR (
          fp.tip_status = 'processing'
          AND fp.tip_locked_at < timezone('utc'::text, now()) - interval '30 minutes'
        )
      )
    ORDER BY f.created_at DESC, fp.page_index ASC, fp.created_at ASC
    LIMIT 1
  ),
  candidates AS (
    SELECT fp.id
    FROM flyer_products AS fp
    JOIN target_page AS target
      ON target.flyer_id = fp.flyer_id
     AND target.page_index = fp.page_index
    WHERE fp.tip_processor = 'gemini_batch'
      AND (
        (
          fp.tip_status IN ('pending', 'retry')
          AND fp.tip_next_attempt_at <= timezone('utc'::text, now())
        ) OR (
          fp.tip_status = 'processing'
          AND fp.tip_locked_at < timezone('utc'::text, now()) - interval '30 minutes'
        )
      )
    ORDER BY fp.created_at ASC
    FOR UPDATE SKIP LOCKED
    LIMIT GREATEST(1, LEAST(p_limit, 15))
  )
  UPDATE flyer_products AS fp
  SET
    tip_status = 'processing',
    tip_attempts = fp.tip_attempts + 1,
    tip_locked_at = timezone('utc'::text, now()),
    tip_last_error = NULL
  FROM candidates
  WHERE fp.id = candidates.id
  RETURNING fp.*;
END;
$$;

REVOKE ALL ON FUNCTION claim_pending_gemini_tip_batch(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_pending_gemini_tip_batch(INTEGER) TO service_role;
