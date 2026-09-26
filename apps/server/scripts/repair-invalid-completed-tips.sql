-- 잘못 complete 처리된 fallback 팁만 다시 worker 대기열로 돌립니다.
-- Supabase SQL Editor에서 먼저 SELECT 결과를 확인한 뒤 UPDATE를 실행하세요.

-- 1. 복구 대상 미리보기
SELECT
  id,
  product_name,
  tip_status,
  tip_source,
  tip_message,
  tip_model,
  tip_updated_at
FROM public.flyer_products
WHERE tip_status = 'complete'
  AND (
    tip_source = 'fallback'
    OR tip_message LIKE '%신선도가 중요한 상품이에요%'
    OR tip_message LIKE '%직접 보고 골라 담는 마트 구매를 추천합니다%'
    OR tip_message LIKE '%쿠팡 가격과 비교해 보세요%'
    OR tip_message LIKE '%쿠팡 대용량 묶음이 단가 기준 더 저렴할 수 있어요%'
    OR tip_message LIKE '%온라인 최저가와 비교해 보세요%'
    OR substring(tip_message FROM '마트 가격 ([0-9,]+)원') =
       substring(tip_message FROM '온라인 최저가\\(([0-9,]+)원\\)')
  )
ORDER BY tip_updated_at DESC NULLS LAST;

-- 2. 위에서 확인한 행을 pending으로 복구
UPDATE public.flyer_products
SET
  tip_type = NULL,
  badge_text = NULL,
  tip_message = NULL,
  coupang_keyword = NULL,
  tip_reference_url = NULL,
  tip_status = 'pending',
  tip_source = NULL,
  tip_attempts = 0,
  tip_locked_at = NULL,
  tip_next_attempt_at = timezone('utc'::text, now()),
  tip_last_error = '잘못 완료된 fallback 팁을 재처리 대기열로 복구함',
  tip_model = NULL,
  tip_updated_at = timezone('utc'::text, now())
WHERE tip_status = 'complete'
  AND (
    tip_source = 'fallback'
    OR tip_message LIKE '%신선도가 중요한 상품이에요%'
    OR tip_message LIKE '%직접 보고 골라 담는 마트 구매를 추천합니다%'
    OR tip_message LIKE '%쿠팡 가격과 비교해 보세요%'
    OR tip_message LIKE '%쿠팡 대용량 묶음이 단가 기준 더 저렴할 수 있어요%'
    OR tip_message LIKE '%온라인 최저가와 비교해 보세요%'
    OR substring(tip_message FROM '마트 가격 ([0-9,]+)원') =
       substring(tip_message FROM '온라인 최저가\\(([0-9,]+)원\\)')
  )
RETURNING id, product_name, tip_status, tip_last_error;
