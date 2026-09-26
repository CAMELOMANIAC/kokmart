-- URL 직접 출력 검증을 제거하고 단건 처리로 전환한 서버를 배포한 뒤 실행하세요.
-- 이전 검증 방식 때문에 retry/failed가 된 행만 다시 대기열로 돌립니다.

UPDATE public.flyer_products
SET
  tip_status = 'pending',
  tip_attempts = 0,
  tip_locked_at = NULL,
  tip_next_attempt_at = timezone('utc'::text, now()),
  tip_last_error = NULL,
  tip_model = NULL,
  tip_updated_at = timezone('utc'::text, now())
WHERE tip_status IN ('retry', 'failed')
  AND (
    tip_last_error LIKE '%검증 가능한 검색 근거 URL이 없습니다%'
    OR tip_last_error LIKE '%팁이 누락되었습니다%'
    OR tip_last_error LIKE '%온라인 가격을 마트 행사가와 동일하게 복사했습니다%'
  )
RETURNING id, product_name, tip_status, tip_attempts;
