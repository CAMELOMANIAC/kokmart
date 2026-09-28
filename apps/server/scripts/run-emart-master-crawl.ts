import 'dotenv/config';
import { ParsedProduct } from '@kokmart/shared';
import {
  downloadEmartFlyerImages,
  fetchLatestEmartFlyer,
} from '../src/services/emartFlyerCrawler.js';
import { parseMasterFlyerWithGemini } from '../src/services/geminiService.js';
import {
  deleteOtherMasterFlyers,
  getLatestFlyerFromSupabase,
  isSupabaseConfigured,
  saveFlyerToSupabase,
} from '../src/services/supabaseService.js';

function haveSameImageUrls(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((url, index) => url === right[index]);
}

async function main(): Promise<void> {
  if (!isSupabaseConfigured()) {
    throw new Error('SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
  }

  console.log('[Emart Crawl] 최신 공식 전단 HTML을 확인합니다.');
  const source = await fetchLatestEmartFlyer();
  const existing = await getLatestFlyerFromSupabase(source.martName, source.branchName || '공통');
  if (existing && haveSameImageUrls(existing.flyer.imageUrls, source.imageUrls)) {
    console.log(`[Emart Crawl] 동일 전단입니다. AI 파싱을 건너뜁니다: ${source.imageUrls.length} pages`);
    return;
  }

  console.log(`[Emart Crawl] 새 전단 감지: ${source.imageUrls.length} pages`);
  const pageBuffers = await downloadEmartFlyerImages(source.imageUrls);
  const parsedProducts = await parseMasterFlyerWithGemini(pageBuffers, source.martName);
  if (parsedProducts.length === 0) {
    throw new Error('이마트 전단에서 상품을 한 건도 추출하지 못해 기존 전단을 유지합니다.');
  }

  const queuedProducts: ParsedProduct[] = parsedProducts.map((product) => ({
    ...product,
    smartTip: undefined,
    tipStatus: 'pending',
    tipSource: undefined,
    tipProcessor: 'gemini_batch',
  }));
  const saved = await saveFlyerToSupabase({
    martName: source.martName,
    branchName: source.branchName || '공통',
    isMaster: true,
    title: source.flyerTitle,
    validStartDate: source.validPeriod.startDate,
    validEndDate: source.validPeriod.endDate,
    imageUrls: source.imageUrls,
    products: queuedProducts,
    tipProcessor: 'gemini_batch',
  });
  if (!saved) throw new Error('새 이마트 전단을 Supabase에 저장하지 못했습니다.');

  try {
    const deletedCount = await deleteOtherMasterFlyers(
      source.martName,
      source.branchName || '공통',
      saved.flyer.id
    );
    console.log(`[Emart Crawl] 이전 마스터 전단 정리: ${deletedCount}건`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[Emart Crawl] 새 전단 저장은 완료됐지만 이전 전단 정리에 실패했습니다: ${message}`);
  }

  console.log(`[Emart Crawl] 완료: flyer=${saved.flyer.id}, products=${queuedProducts.length}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
