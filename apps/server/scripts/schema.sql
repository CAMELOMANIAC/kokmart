-- 마트콕 (Kokmart) Supabase 데이터베이스 스키마
-- 주간 마스터 전단 및 지점 전단, 상품 데이터 영구 저장 및 고속 인덱싱

-- 1. UUID 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. flyers 테이블 (전단지 메타데이터)
CREATE TABLE IF NOT EXISTS flyers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mart_name VARCHAR(50) NOT NULL,                    -- '이마트', '홈플러스', '롯데마트'
    branch_name VARCHAR(100) NOT NULL DEFAULT '공통',  -- '공통'(마스터) 또는 '청주점', '역삼점'
    is_master BOOLEAN NOT NULL DEFAULT true,           -- 마스터 전단 여부
    title VARCHAR(255) NOT NULL,                       -- 전단 제목 (예: "홈플러스 3월 3주차 물가안정 프로젝트")
    valid_start_date DATE,                             -- 행사 시작일
    valid_end_date DATE,                               -- 행사 종료일
    image_urls TEXT[] NOT NULL DEFAULT '{}',           -- 전단 각 페이지 고화질 이미지 URL 목록
    page_count INTEGER NOT NULL DEFAULT 1,             -- 총 전단 페이지 수
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. flyer_products 테이블 (파싱된 상품 및 4대 스마트 팁)
CREATE TABLE IF NOT EXISTS flyer_products (
    id VARCHAR(100) PRIMARY KEY,                       -- 고유 상품 ID (예: 'master-p1-1711111111-0')
    flyer_id UUID NOT NULL REFERENCES flyers(id) ON DELETE CASCADE,
    page_index INTEGER NOT NULL DEFAULT 1,             -- 전단지 페이지 번호 (1부터 시작)
    product_name VARCHAR(255) NOT NULL,                -- 상품명 (용량/규격 포함)
    sale_price INTEGER NOT NULL,                       -- 행사가격 (원)
    effective_unit_price INTEGER NOT NULL,             -- 단위당 단가 (원)
    unit_measure VARCHAR(50) NOT NULL,                 -- 기준 단위 ('100g', '100ml', '1개' 등)
    is_perishable BOOLEAN NOT NULL DEFAULT false,      -- 신선식품 여부
    mart_name VARCHAR(50),                             -- 마트 브랜드명
    tip_type VARCHAR(50),                              -- 'MART_BEST', 'MART_RECOMMEND', 'COUPANG_TIP', 'COUPANG_BULK'
    badge_text VARCHAR(100),                           -- 뱃지 문구 ('마트 필구 특가', '쿠팡 신선 알뜰' 등)
    tip_message TEXT,                                  -- 실시간 가격 비교 팁 메시지
    coupang_keyword VARCHAR(255),                      -- 쿠팡 최저가 검색어 (null 가능)
    tip_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending/processing/complete/retry/failed
    tip_source VARCHAR(30),                            -- fallback/groq_grounded/gemini_grounded
    tip_processor VARCHAR(30) NOT NULL DEFAULT 'groq_realtime', -- groq_realtime/gemini_batch
    tip_attempts INTEGER NOT NULL DEFAULT 0,
    tip_locked_at TIMESTAMPTZ,
    tip_next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    tip_last_error TEXT,
    tip_model VARCHAR(100),
    tip_updated_at TIMESTAMPTZ,
    box_ymin INTEGER,                                  -- 상품 이미지 Bounding Box (0~1000 정규화 좌표)
    box_xmin INTEGER,
    box_ymax INTEGER,
    box_xmax INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 기존 테이블 대상 컬럼 추가 (마이그레이션 호환)
ALTER TABLE flyer_products ADD COLUMN IF NOT EXISTS box_ymin INTEGER;
ALTER TABLE flyer_products ADD COLUMN IF NOT EXISTS box_xmin INTEGER;
ALTER TABLE flyer_products ADD COLUMN IF NOT EXISTS box_ymax INTEGER;
ALTER TABLE flyer_products ADD COLUMN IF NOT EXISTS box_xmax INTEGER;
ALTER TABLE flyer_products ADD COLUMN IF NOT EXISTS tip_status VARCHAR(20) NOT NULL DEFAULT 'pending';
ALTER TABLE flyer_products ADD COLUMN IF NOT EXISTS tip_source VARCHAR(30);
ALTER TABLE flyer_products ADD COLUMN IF NOT EXISTS tip_processor VARCHAR(30) NOT NULL DEFAULT 'groq_realtime';
ALTER TABLE flyer_products ADD COLUMN IF NOT EXISTS tip_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE flyer_products ADD COLUMN IF NOT EXISTS tip_locked_at TIMESTAMPTZ;
ALTER TABLE flyer_products ADD COLUMN IF NOT EXISTS tip_next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());
ALTER TABLE flyer_products ADD COLUMN IF NOT EXISTS tip_last_error TEXT;
ALTER TABLE flyer_products ADD COLUMN IF NOT EXISTS tip_model VARCHAR(100);
ALTER TABLE flyer_products ADD COLUMN IF NOT EXISTS tip_updated_at TIMESTAMPTZ;

-- 기존 데이터는 전단 종류에 따라 처리 주체를 1회 보정합니다.
UPDATE flyer_products AS fp
SET tip_processor = CASE WHEN f.is_master THEN 'gemini_batch' ELSE 'groq_realtime' END
FROM flyers AS f
WHERE fp.flyer_id = f.id
  AND fp.tip_processor IS DISTINCT FROM CASE WHEN f.is_master THEN 'gemini_batch' ELSE 'groq_realtime' END;

-- 기존 팁 필드가 있다는 이유만으로 완료 처리하지 않습니다.
-- complete 상태는 Groq 또는 Gemini 검색 근거 검증과 저장을 모두 통과한 worker만 설정합니다.

-- 4. 고속 조회 및 캐시 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_flyers_mart_branch ON flyers(mart_name, branch_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flyers_is_master ON flyers(is_master, mart_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flyer_products_flyer_id ON flyer_products(flyer_id, page_index);
CREATE INDEX IF NOT EXISTS idx_flyer_products_tip_type ON flyer_products(tip_type);
CREATE INDEX IF NOT EXISTS idx_flyer_products_tip_queue
ON flyer_products(tip_status, tip_next_attempt_at, created_at);
CREATE INDEX IF NOT EXISTS idx_flyer_products_tip_processor_queue
ON flyer_products(tip_processor, tip_status, tip_next_attempt_at, created_at);

-- Worker가 동시에 실행되어도 같은 상품을 중복 처리하지 않도록 원자적으로 선점합니다.
CREATE OR REPLACE FUNCTION claim_pending_tip_products(p_limit INTEGER DEFAULT 4)
RETURNS SETOF flyer_products
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 동시에 여러 worker 요청이 들어와도 선점 트랜잭션은 하나만 통과시킵니다.
  IF NOT pg_try_advisory_xact_lock(hashtext('claim_pending_tip_products')) THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH candidates AS (
    SELECT fp.id
    FROM flyer_products AS fp
    WHERE (
      (
        fp.tip_status IN ('pending', 'retry')
        AND fp.tip_next_attempt_at <= timezone('utc'::text, now())
      ) OR (
        fp.tip_status = 'processing'
        AND fp.tip_locked_at < timezone('utc'::text, now()) - interval '15 minutes'
      )
    )
    AND fp.tip_processor = 'groq_realtime'
    AND NOT EXISTS (
      SELECT 1
      FROM flyer_products AS active
      WHERE active.tip_status = 'processing'
        AND active.tip_processor = 'groq_realtime'
        AND active.tip_locked_at >= timezone('utc'::text, now()) - interval '15 minutes'
    )
    -- 새 전단의 사용자 경험을 우선하고 오래된 작업은 뒤에서 천천히 처리합니다.
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

-- GitHub Actions가 가장 최근 마스터 전단의 한 페이지를 묶음으로 선점합니다.
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

-- 5. RLS (Row Level Security) 설정: 익명 사용자(anon)는 조회만 허용
ALTER TABLE flyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flyer_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on flyers" ON flyers;
CREATE POLICY "Allow public read access on flyers"
ON flyers FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow public read access on flyer_products" ON flyer_products;
CREATE POLICY "Allow public read access on flyer_products"
ON flyer_products FOR SELECT TO anon, authenticated USING (true);

-- 서버/배치(service_role) 전체 권한
DROP POLICY IF EXISTS "Allow full access for service_role on flyers" ON flyers;
CREATE POLICY "Allow full access for service_role on flyers"
ON flyers FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow full access for service_role on flyer_products" ON flyer_products;
CREATE POLICY "Allow full access for service_role on flyer_products"
ON flyer_products FOR ALL TO service_role USING (true) WITH CHECK (true);
