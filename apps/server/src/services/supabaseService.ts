import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  FlyerRecord,
  ParsedProduct,
  SmartTip,
  TipProcessor,
  TipProcessingStatus,
  TipSource,
  TipType,
} from '@kokmart/shared';

let supabaseInstance: SupabaseClient | null = null;

/**
 * Supabase URL에서 불필요한 /rest/v1 또는 trailing slash 제거
 */
function sanitizeSupabaseUrl(rawUrl: string): string {
  return rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
}

/**
 * Supabase 환경 변수가 유효하게 설정되어 있는지 확인
 */
export function isSupabaseConfigured(): boolean {
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return Boolean(url.trim() && key.trim());
}

/**
 * Supabase 클라이언트 싱글톤 인스턴스 반환
 */
export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    const rawUrl = process.env.SUPABASE_URL || '';
    const url = sanitizeSupabaseUrl(rawUrl);
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
    supabaseInstance = createClient(url, key, {
      auth: { persistSession: false },
    });
  }

  return supabaseInstance;
}

export interface SaveFlyerParams {
  martName: string;
  branchName?: string;
  isMaster?: boolean;
  title?: string;
  imageUrls: string[];
  products: ParsedProduct[];
  validStartDate?: string;
  validEndDate?: string;
  tipProcessor?: TipProcessor;
}

export interface ClaimedTipProduct {
  product: ParsedProduct;
  attempts: number;
}

function mapProductRow(row: Record<string, unknown>, fallbackMartName = '마트'): ParsedProduct {
  let smartTip: SmartTip | undefined;
  if (row.tip_type && row.badge_text && row.tip_message) {
    smartTip = {
      tipType: row.tip_type as TipType,
      badgeText: row.badge_text as string,
      tipMessage: row.tip_message as string,
      coupangKeyword: (row.coupang_keyword as string | null) || null,
    };
  }

  let boundingBox: ParsedProduct['boundingBox'];
  if (
    row.box_ymin !== null &&
    row.box_xmin !== null &&
    row.box_ymax !== null &&
    row.box_xmax !== null &&
    row.box_ymin !== undefined &&
    row.box_xmin !== undefined &&
    row.box_ymax !== undefined &&
    row.box_xmax !== undefined
  ) {
    boundingBox = {
      id: `box-${String(row.id)}`,
      ymin: Number(row.box_ymin),
      xmin: Number(row.box_xmin),
      ymax: Number(row.box_ymax),
      xmax: Number(row.box_xmax),
      labelHint: (row.product_name as string) || undefined,
    };
  }

  return {
    id: row.id as string,
    pageIndex: Number(row.page_index) || 1,
    productName: row.product_name as string,
    salePrice: Number(row.sale_price) || 0,
    effectiveUnitPrice: Number(row.effective_unit_price) || 0,
    unitMeasure: row.unit_measure as string,
    isPerishable: Boolean(row.is_perishable),
    martName: (row.mart_name as string) || fallbackMartName,
    smartTip,
    tipStatus: (row.tip_status as TipProcessingStatus | undefined) || undefined,
    tipSource: (row.tip_source as TipSource | undefined) || undefined,
    tipProcessor: (row.tip_processor as TipProcessor | undefined) || undefined,
    boundingBox,
  };
}

/**
 * 마스터 또는 지점 전단지 및 상품 목록을 Supabase DB에 일괄 저장
 */
export async function saveFlyerToSupabase(params: SaveFlyerParams): Promise<{
  flyer: FlyerRecord;
  products: ParsedProduct[];
} | null> {
  const client = getSupabaseClient();
  if (!client) {
    console.warn('[Supabase] SUPABASE_URL 또는 KEY가 미설정되어 DB 저장을 건너뜁니다.');
    return null;
  }

  const {
    martName,
    branchName = '공통',
    isMaster = true,
    title = `${martName} 주간 전단`,
    imageUrls,
    products,
    validStartDate,
    validEndDate,
    tipProcessor = isMaster ? 'gemini_batch' : 'groq_realtime',
  } = params;

  console.log(`[Supabase] 💾 Saving flyer to DB (${martName} ${branchName}, ${products.length} products)...`);

  // 1. flyers 테이블 메타데이터 생성
  const { data: flyerData, error: flyerError } = await client
    .from('flyers')
    .insert({
      mart_name: martName,
      branch_name: branchName,
      is_master: isMaster,
      title,
      valid_start_date: validStartDate,
      valid_end_date: validEndDate,
      image_urls: imageUrls,
      page_count: imageUrls.length,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (flyerError || !flyerData) {
    console.error('[Supabase Error] flyers 테이블 insert 실패:', flyerError);
    throw new Error(`Supabase 전단 메타데이터 저장 실패: ${flyerError?.message}`);
  }

  const flyerId = flyerData.id as string;

  // 2. flyer_products 테이블 상품 일괄(Bulk) 적재
  if (products.length > 0) {
    const productRows = products.map((prod, index) => {
      const productId = prod.id || `prod-${flyerId}-${prod.pageIndex || 1}-${index}`;
      const tipStatus = prod.tipStatus || (prod.smartTip ? 'complete' : 'pending');
      return {
        id: productId,
        flyer_id: flyerId,
        page_index: prod.pageIndex || 1,
        product_name: prod.productName,
        sale_price: Math.round(Number(prod.salePrice) || 0),
        effective_unit_price: Math.round(Number(prod.effectiveUnitPrice) || 0),
        unit_measure: prod.unitMeasure,
        is_perishable: prod.isPerishable,
        mart_name: prod.martName || martName,
        tip_type: prod.smartTip?.tipType || null,
        badge_text: prod.smartTip?.badgeText || null,
        tip_message: prod.smartTip?.tipMessage || null,
        coupang_keyword: prod.smartTip?.coupangKeyword || null,
        tip_status: tipStatus,
        tip_source: prod.tipSource || (prod.smartTip ? 'fallback' : null),
        // 전단 단위로 처리 주체를 고정해 마스터 상품이 지점 전단에 복사될 때 큐가 섞이지 않게 합니다.
        tip_processor: tipProcessor,
        tip_attempts: 0,
        tip_next_attempt_at: new Date().toISOString(),
        tip_updated_at: tipStatus === 'complete' ? new Date().toISOString() : null,
        box_ymin: prod.boundingBox?.ymin ?? null,
        box_xmin: prod.boundingBox?.xmin ?? null,
        box_ymax: prod.boundingBox?.ymax ?? null,
        box_xmax: prod.boundingBox?.xmax ?? null,
        created_at: new Date().toISOString(),
      };
    });

    const { error: productsError } = await client.from('flyer_products').insert(productRows);

    if (productsError) {
      console.error('[Supabase Error] flyer_products insert 실패:', productsError);
      throw new Error(`Supabase 상품 목록 저장 실패: ${productsError.message}`);
    }
  }

  console.log(`[Supabase] ✅ Successfully saved flyer (ID: ${flyerId}) and ${products.length} products to DB.`);

  const flyerRecord: FlyerRecord = {
    id: flyerId,
    martName: flyerData.mart_name as string,
    branchName: flyerData.branch_name as string,
    isMaster: Boolean(flyerData.is_master),
    title: flyerData.title as string,
    validStartDate: flyerData.valid_start_date as string | undefined,
    validEndDate: flyerData.valid_end_date as string | undefined,
    imageUrls: (flyerData.image_urls as string[]) || [],
    pageCount: Number(flyerData.page_count) || 1,
    createdAt: flyerData.created_at as string,
    updatedAt: flyerData.updated_at as string,
  };

  return { flyer: flyerRecord, products };
}

/**
 * 특정 마트의 최신 전단 및 상품 목록 조회 (지점 전단 우선, 없으면 마스터 전단으로 fallback)
 */
export async function getLatestFlyerFromSupabase(
  martName: string,
  branchName = '공통'
): Promise<{ flyer: FlyerRecord; products: ParsedProduct[] } | null> {
  const client = getSupabaseClient();
  if (!client) {
    return null;
  }

  // 1. 요청된 지점 전단 조회
  let { data: flyerData, error: flyerError } = await client
    .from('flyers')
    .select('*')
    .eq('mart_name', martName)
    .eq('branch_name', branchName)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // 지점 전단이 없고 '공통'이 아니었다면 마스터 전단으로 Fallback 조회
  if (!flyerData && branchName !== '공통') {
    const fallbackRes = await client
      .from('flyers')
      .select('*')
      .eq('mart_name', martName)
      .eq('branch_name', '공통')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    flyerData = fallbackRes.data;
    flyerError = fallbackRes.error;
  }

  if (flyerError || !flyerData) {
    return null;
  }

  const flyerId = flyerData.id as string;

  // 2. 해당 전단의 상품 목록 조회
  const { data: productsData, error: productsError } = await client
    .from('flyer_products')
    .select('*')
    .eq('flyer_id', flyerId)
    .order('page_index', { ascending: true })
    .order('created_at', { ascending: true });

  if (productsError || !productsData) {
    console.error('[Supabase Error] 상품 조회 실패:', productsError);
    return null;
  }

  const products: ParsedProduct[] = productsData.map((row) => mapProductRow(row, martName));

  const flyerRecord: FlyerRecord = {
    id: flyerId,
    martName: flyerData.mart_name as string,
    branchName: flyerData.branch_name as string,
    isMaster: Boolean(flyerData.is_master),
    title: flyerData.title as string,
    validStartDate: flyerData.valid_start_date as string | undefined,
    validEndDate: flyerData.valid_end_date as string | undefined,
    imageUrls: (flyerData.image_urls as string[]) || [],
    pageCount: Number(flyerData.page_count) || 1,
    createdAt: flyerData.created_at as string,
    updatedAt: flyerData.updated_at as string,
  };

  return { flyer: flyerRecord, products };
}

/**
 * pending/retry 상품을 DB RPC에서 원자적으로 선점합니다.
 */
export async function claimPendingTipProducts(limit = 4): Promise<ClaimedTipProduct[]> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase가 설정되지 않아 팁 작업을 선점할 수 없습니다.');
  }

  const safeLimit = Math.max(1, Math.min(limit, 8));
  const { data, error } = await client.rpc('claim_pending_tip_products', { p_limit: safeLimit });

  if (error) {
    throw new Error(`팁 작업 선점 실패: ${error.message}`);
  }

  return ((data || []) as Array<Record<string, unknown>>).map((row) => ({
    product: mapProductRow(row),
    attempts: Number(row.tip_attempts) || 1,
  }));
}

/** GitHub Actions가 마스터 전단 한 페이지(또는 그 일부)를 원자적으로 선점합니다. */
export async function claimPendingGeminiTipBatch(limit = 12): Promise<ClaimedTipProduct[]> {
  const client = getSupabaseClient();
  if (!client) {
    throw new Error('Supabase가 설정되지 않아 Gemini 팁 작업을 선점할 수 없습니다.');
  }

  const safeLimit = Math.max(1, Math.min(limit, 15));
  const { data, error } = await client.rpc('claim_pending_gemini_tip_batch', { p_limit: safeLimit });

  if (error) {
    throw new Error(`Gemini 팁 작업 선점 실패: ${error.message}`);
  }

  return ((data || []) as Array<Record<string, unknown>>).map((row) => ({
    product: mapProductRow(row),
    attempts: Number(row.tip_attempts) || 1,
  }));
}

/** Groq 팁 생성에 성공한 상품을 완료 상태로 갱신합니다. */
export async function completeTipProducts(products: ParsedProduct[], model: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase가 설정되지 않았습니다.');

  const now = new Date().toISOString();
  const results = await Promise.all(
    products.map((product) => {
      if (!product.id || !product.smartTip) {
        throw new Error('완료할 상품 ID 또는 smartTip이 없습니다.');
      }
      if (product.tipSource !== 'groq_grounded') {
        throw new Error(`Groq 검증을 통과하지 않은 상품은 완료할 수 없습니다: ${product.id}`);
      }

      return client
        .from('flyer_products')
        .update({
          tip_type: product.smartTip.tipType,
          badge_text: product.smartTip.badgeText,
          tip_message: product.smartTip.tipMessage,
          coupang_keyword: product.smartTip.coupangKeyword,
          tip_status: 'complete',
          tip_source: 'groq_grounded',
          tip_model: model,
          tip_locked_at: null,
          tip_last_error: null,
          tip_updated_at: now,
        })
        .eq('id', product.id)
        .eq('tip_status', 'processing')
        .eq('tip_processor', 'groq_realtime');
    })
  );

  const failure = results.find((result) => result.error);
  if (failure?.error) {
    throw new Error(`팁 완료 상태 저장 실패: ${failure.error.message}`);
  }
}

/** Gemini 검색 근거 검증을 통과한 마스터 팁을 저장합니다. */
export async function completeGeminiTipProducts(products: ParsedProduct[], model: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase가 설정되지 않았습니다.');

  const now = new Date().toISOString();
  const results = await Promise.all(
    products.map((product) => {
      if (!product.id || !product.smartTip) {
        throw new Error('완료할 상품 ID 또는 smartTip이 없습니다.');
      }
      if (product.tipSource !== 'gemini_grounded') {
        throw new Error(`Gemini 검증을 통과하지 않은 상품은 완료할 수 없습니다: ${product.id}`);
      }

      return client
        .from('flyer_products')
        .update({
          tip_type: product.smartTip.tipType,
          badge_text: product.smartTip.badgeText,
          tip_message: product.smartTip.tipMessage,
          coupang_keyword: product.smartTip.coupangKeyword,
          tip_status: 'complete',
          tip_source: 'gemini_grounded',
          tip_model: model,
          tip_locked_at: null,
          tip_last_error: null,
          tip_updated_at: now,
        })
        .eq('id', product.id)
        .eq('tip_status', 'processing')
        .eq('tip_processor', 'gemini_batch');
    })
  );

  const failure = results.find((result) => result.error);
  if (failure?.error) {
    throw new Error(`Gemini 팁 완료 상태 저장 실패: ${failure.error.message}`);
  }
}

/** 실패한 상품을 다음 실행에서 재시도하도록 되돌립니다. */
export async function retryTipProducts(
  claimed: ClaimedTipProduct[],
  errorMessage: string,
  retryAfterMs: number,
  maxAttempts: number
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase가 설정되지 않았습니다.');

  const nextAttemptAt = new Date(Date.now() + Math.max(1_000, retryAfterMs)).toISOString();
  const results = await Promise.all(
    claimed.map(({ product, attempts }) => {
      if (!product.id) throw new Error('재시도할 상품 ID가 없습니다.');
      const exhausted = attempts >= maxAttempts;
      return client
        .from('flyer_products')
        .update({
          tip_status: exhausted ? 'failed' : 'retry',
          tip_locked_at: null,
          tip_next_attempt_at: nextAttemptAt,
          tip_last_error: errorMessage.slice(0, 2000),
          tip_updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)
        .eq('tip_status', 'processing')
        .eq('tip_processor', 'groq_realtime');
    })
  );

  const failure = results.find((result) => result.error);
  if (failure?.error) {
    throw new Error(`팁 재시도 상태 저장 실패: ${failure.error.message}`);
  }
}

/** 실패한 Gemini 배치를 다음 Actions 실행에서 재시도하도록 되돌립니다. */
export async function retryGeminiTipProducts(
  claimed: ClaimedTipProduct[],
  errorMessage: string,
  retryAfterMs: number,
  maxAttempts: number
): Promise<void> {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase가 설정되지 않았습니다.');

  const nextAttemptAt = new Date(Date.now() + Math.max(1_000, retryAfterMs)).toISOString();
  const results = await Promise.all(
    claimed.map(({ product, attempts }) => {
      if (!product.id) throw new Error('재시도할 상품 ID가 없습니다.');
      const exhausted = attempts >= maxAttempts;
      return client
        .from('flyer_products')
        .update({
          tip_status: exhausted ? 'failed' : 'retry',
          tip_locked_at: null,
          tip_next_attempt_at: nextAttemptAt,
          tip_last_error: errorMessage.slice(0, 2000),
          tip_updated_at: new Date().toISOString(),
        })
        .eq('id', product.id)
        .eq('tip_status', 'processing')
        .eq('tip_processor', 'gemini_batch');
    })
  );

  const failure = results.find((result) => result.error);
  if (failure?.error) {
    throw new Error(`Gemini 팁 재시도 상태 저장 실패: ${failure.error.message}`);
  }
}
