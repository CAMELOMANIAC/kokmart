-- Supabase SQL Editor에서 schema.sql 적용 후 실행하세요. 설정 변경 시 다시 실행해도 됩니다.
-- 아래 두 값은 예시이므로 실제 production URL과 TIP_WORKER_SECRET으로 교체해야 합니다.

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;

-- 같은 이름의 secret이 이미 있으면 Dashboard > Vault에서 값을 갱신하세요.
SELECT vault.create_secret(
  'https://YOUR_PRODUCTION_DOMAIN/api/internal/tip-worker',
  'tip_worker_url'
)
WHERE NOT EXISTS (
  SELECT 1 FROM vault.decrypted_secrets WHERE name = 'tip_worker_url'
);
SELECT vault.create_secret('REPLACE_WITH_A_LONG_RANDOM_SECRET', 'tip_worker_secret')
WHERE NOT EXISTS (
  SELECT 1 FROM vault.decrypted_secrets WHERE name = 'tip_worker_secret'
);

-- 재실행 시 기존 스케줄을 제거합니다.
SELECT cron.unschedule(jobid)
FROM cron.job
WHERE jobname IN (
  'process-pending-smart-tips',
  'cleanup-tip-worker-cron-history'
);

SELECT cron.schedule(
  'process-pending-smart-tips',
  '* * * * *',
  $$
  -- Cron 자체는 매분 실행하되, 지금 처리할 작업이 있을 때만 Vercel을 호출합니다.
  SELECT net.http_post(
    url := (
      SELECT decrypted_secret
      FROM vault.decrypted_secrets
      WHERE name = 'tip_worker_url'
      LIMIT 1
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'tip_worker_secret'
        LIMIT 1
      )
    ),
    body := jsonb_build_object('source', 'supabase-cron'),
    -- Vercel 함수 최대 실행시간(300초)보다 조금 길게 기다립니다.
    timeout_milliseconds := 305000
  )
  WHERE EXISTS (
    SELECT 1
    FROM public.flyer_products
    WHERE tip_processor = 'groq_realtime'
      AND (
        (
          tip_status IN ('pending', 'retry')
          AND tip_next_attempt_at <= timezone('utc'::text, now())
        ) OR (
          tip_status = 'processing'
          AND tip_locked_at < timezone('utc'::text, now()) - interval '15 minutes'
        )
      )
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.flyer_products
    WHERE tip_status = 'processing'
      AND tip_processor = 'groq_realtime'
      AND tip_locked_at >= timezone('utc'::text, now()) - interval '15 minutes'
  );
  $$
);

-- 매일 한국시간 03:00(UTC 18:00)에 7일이 지난 Cron 실행 기록을 정리합니다.
SELECT cron.schedule(
  'cleanup-tip-worker-cron-history',
  '0 18 * * *',
  $$
  DELETE FROM cron.job_run_details
  WHERE end_time < timezone('utc'::text, now()) - interval '7 days';
  $$
);
