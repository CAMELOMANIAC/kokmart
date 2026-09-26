-- 포장 규격과 환산단가를 분리합니다.
-- Supabase SQL Editor에서 애플리케이션 배포 전에 한 번 실행하십시오.

ALTER TABLE public.flyer_products
  ADD COLUMN IF NOT EXISTS package_spec VARCHAR(100);

ALTER TABLE public.flyer_products
  ALTER COLUMN effective_unit_price DROP NOT NULL;

ALTER TABLE public.flyer_products
  ALTER COLUMN unit_measure DROP NOT NULL;

COMMENT ON COLUMN public.flyer_products.package_spec IS
  '전단 이미지에 표시된 포장 규격 원문(예: 1280g, 500ml×2, 8입)';
COMMENT ON COLUMN public.flyer_products.effective_unit_price IS
  '100g, 100ml 또는 1개 기준 환산단가. 환산할 수 없으면 NULL';
COMMENT ON COLUMN public.flyer_products.unit_measure IS
  '환산단가 기준. 100g, 100ml, 1개 중 하나이며 환산할 수 없으면 NULL';

-- 기존의 포장 단위 값은 환산단가가 아니므로 잘못된 비교에 사용되지 않게 비웁니다.
UPDATE public.flyer_products
SET
  effective_unit_price = NULL,
  unit_measure = NULL
WHERE unit_measure IS NULL
   OR unit_measure NOT IN ('100g', '100ml', '1개');
