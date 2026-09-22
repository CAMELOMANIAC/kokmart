import { ParsedProduct } from '@kokmart/shared';
import { compareFlyerPages } from './pageDiffService.js';

interface CachedFlyerEntry {
  martName: string;
  branchName: string;
  imageBuffers: Buffer[];
  imageUrls: string[];
  products: ParsedProduct[];
  parsedAt: string;
  flyerId?: string;
}

// 브랜드별/지점별 인메모리 캐시 맵 ('이마트:공통', '홈플러스:청주점' 등)
const memoryCache = new Map<string, CachedFlyerEntry>();

function getCacheKey(martName: string, branchName = '공통'): string {
  return `${martName.trim()}:${branchName.trim()}`;
}

/**
 * 인입된 전단지 이미지 버퍼 목록이 기존 캐시된 전단지와 픽셀 단위로 동일한지 고속 검사 (sharp 비용 0원)
 */
export async function checkIdenticalFlyer(
  martName: string,
  branchName = '공통',
  incomingBuffers: Buffer[]
): Promise<{ isIdentical: boolean; products: ParsedProduct[]; parsedAt: string; flyerId?: string } | null> {
  if (!incomingBuffers || incomingBuffers.length === 0) {
    return null;
  }

  const key = getCacheKey(martName, branchName);
  const cached = memoryCache.get(key) || (branchName !== '공통' ? memoryCache.get(getCacheKey(martName, '공통')) : null);

  if (!cached || !cached.imageBuffers || cached.imageBuffers.length === 0) {
    return null;
  }

  // 페이지 수가 다르면 즉시 불일치 판정
  if (cached.imageBuffers.length !== incomingBuffers.length) {
    return null;
  }

  const diffStartTime = Date.now();
  console.log(`[Flyer Cache] 🔍 Checking pixel diff for ${martName} (${incomingBuffers.length} pages)...`);

  // 모든 페이지에 대해 1:1 픽셀 차분 병렬 비교
  try {
    const diffResults = await Promise.all(
      incomingBuffers.map((incomingBuf, idx) => {
        const cachedBuf = cached.imageBuffers[idx];
        if (!cachedBuf) return Promise.resolve({ isIdentical: false, similarityScore: 0 });
        return compareFlyerPages(cachedBuf, incomingBuf, { similarityThreshold: 0.98 });
      })
    );

    const allIdentical = diffResults.every((res) => res.isIdentical);
    const diffElapsedSec = ((Date.now() - diffStartTime) / 1000).toFixed(3);

    if (allIdentical) {
      console.log(
        `[Flyer Cache] 🎯 Identical flyer detected via sharp in ${diffElapsedSec}s (Similarity >= 98%)! Returning ${cached.products.length} cached products with 0 AI tokens.`
      );
      return {
        isIdentical: true,
        products: cached.products,
        parsedAt: cached.parsedAt,
        flyerId: cached.flyerId,
      };
    }

    console.log(
      `[Flyer Cache] 🔄 Different flyer detected in ${diffElapsedSec}s (Requires AI Vision & Tip parsing).`
    );
    return null;
  } catch (err: unknown) {
    console.warn('[Flyer Cache Warning] Pixel diff comparison failed, proceeding with fresh parse:', err);
    return null;
  }
}

/**
 * 인메모리 전단 캐시 저장/갱신
 */
export function setCachedFlyer(
  martName: string,
  branchName = '공통',
  imageBuffers: Buffer[],
  imageUrls: string[],
  products: ParsedProduct[],
  flyerId?: string
): void {
  const key = getCacheKey(martName, branchName);
  memoryCache.set(key, {
    martName,
    branchName,
    imageBuffers,
    imageUrls,
    products,
    parsedAt: new Date().toISOString(),
    flyerId,
  });
  console.log(`[Flyer Cache] 💾 In-memory cache updated for ${key} (${products.length} products).`);
}

/**
 * 단순 메모리 캐시 조회 (버퍼 없이 최신 상품 목록만 필요할 때)
 */
export function getMemoryCachedFlyer(
  martName: string,
  branchName = '공통'
): { products: ParsedProduct[]; parsedAt: string; flyerId?: string } | null {
  const key = getCacheKey(martName, branchName);
  const cached = memoryCache.get(key) || (branchName !== '공통' ? memoryCache.get(getCacheKey(martName, '공통')) : null);
  if (!cached) return null;
  return {
    products: cached.products,
    parsedAt: cached.parsedAt,
    flyerId: cached.flyerId,
  };
}
