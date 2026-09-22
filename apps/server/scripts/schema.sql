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
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. 고속 조회 및 캐시 조회를 위한 인덱스
CREATE INDEX IF NOT EXISTS idx_flyers_mart_branch ON flyers(mart_name, branch_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flyers_is_master ON flyers(is_master, mart_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flyer_products_flyer_id ON flyer_products(flyer_id, page_index);
CREATE INDEX IF NOT EXISTS idx_flyer_products_tip_type ON flyer_products(tip_type);

-- 5. RLS (Row Level Security) 설정: 익명 사용자(anon)는 조회만 허용
ALTER TABLE flyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE flyer_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on flyers"
ON flyers FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow public read access on flyer_products"
ON flyer_products FOR SELECT TO anon, authenticated USING (true);

-- 서버/배치(service_role) 전체 권한
CREATE POLICY "Allow full access for service_role on flyers"
ON flyers FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow full access for service_role on flyer_products"
ON flyer_products FOR ALL TO service_role USING (true) WITH CHECK (true);
