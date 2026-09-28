import { FlyerSourceInfo } from '@kokmart/shared';

const EMART_FLYER_VIEWER_URL = 'https://eapp.emart.com/leaflet/leafletView_EL.do';
const EMART_IMAGE_HOST = 'stimg.emart.com';
const EMART_IMAGE_PATH_PREFIX = '/upload/news_leaflet/';
const SUPPORTED_IMAGE_EXTENSIONS = /\.(?:jpe?g|png|webp)$/i;
const MAX_IMAGE_BYTES = 30 * 1024 * 1024;

interface FlyerImageCandidate {
  url: string;
  pageIndex: number | null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function extractAttribute(tag: string, name: string): string | null {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`\\b${escapedName}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match?.[2] ? decodeHtmlEntities(match[2].trim()) : null;
}

function validateEmartImageUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl, EMART_FLYER_VIEWER_URL);
    if (parsed.protocol !== 'https:') return null;
    if (parsed.hostname !== EMART_IMAGE_HOST) return null;
    if (!parsed.pathname.startsWith(EMART_IMAGE_PATH_PREFIX)) return null;
    if (!SUPPORTED_IMAGE_EXTENSIONS.test(parsed.pathname)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function extractPageIndex(alt: string | null): number | null {
  if (!alt) return null;
  const match = alt.match(/(?:중\s*)?(\d+)면/);
  if (!match?.[1]) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function extractEmartFlyerImageUrls(html: string): string[] {
  const candidates: FlyerImageCandidate[] = [];
  const imageTags = html.match(/<img\b[^>]*>/gi) || [];

  for (const tag of imageTags) {
    const rawUrl = extractAttribute(tag, 'data-src') || extractAttribute(tag, 'src');
    if (!rawUrl) continue;

    const url = validateEmartImageUrl(rawUrl);
    if (!url) continue;

    candidates.push({
      url,
      pageIndex: extractPageIndex(extractAttribute(tag, 'alt')),
    });
  }

  const uniqueByUrl = new Map<string, FlyerImageCandidate>();
  for (const candidate of candidates) {
    if (!uniqueByUrl.has(candidate.url)) uniqueByUrl.set(candidate.url, candidate);
  }

  return [...uniqueByUrl.values()]
    .sort((left, right) => {
      if (left.pageIndex !== null && right.pageIndex !== null) {
        return left.pageIndex - right.pageIndex;
      }
      if (left.pageIndex !== null) return -1;
      if (right.pageIndex !== null) return 1;
      return left.url.localeCompare(right.url);
    })
    .map((candidate) => candidate.url);
}

function toKoreanDateParts(date: Date): { year: number; month: number; day: number; weekday: number } {
  const koreanDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return {
    year: koreanDate.getUTCFullYear(),
    month: koreanDate.getUTCMonth() + 1,
    day: koreanDate.getUTCDate(),
    weekday: koreanDate.getUTCDay(),
  };
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function calculateWeeklyPeriod(now: Date): { startDate: string; endDate: string } {
  const parts = toKoreanDateParts(now);
  const base = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  const diffToThursday = parts.weekday >= 4 ? parts.weekday - 4 : parts.weekday + 3;
  const start = new Date(base);
  start.setUTCDate(base.getUTCDate() - diffToThursday);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 6);
  return {
    startDate: formatDate(start.getUTCFullYear(), start.getUTCMonth() + 1, start.getUTCDate()),
    endDate: formatDate(end.getUTCFullYear(), end.getUTCMonth() + 1, end.getUTCDate()),
  };
}

function extractPeriodFromHtml(
  html: string,
  imageUrls: string[],
  now: Date
): { startDate: string; endDate: string } {
  const visibleText = decodeHtmlEntities(html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '));
  const periodMatch = visibleText.match(
    /행사기간\s*:\s*(\d{1,2})\.(\d{1,2})[^-]{0,12}-\s*(\d{1,2})\.(\d{1,2})/
  );
  if (!periodMatch) return calculateWeeklyPeriod(now);

  const uploadYear = imageUrls[0]?.match(/\/((?:20)\d{2})\d{4}_/)?.[1];
  const year = uploadYear ? Number.parseInt(uploadYear, 10) : toKoreanDateParts(now).year;
  const startMonth = Number.parseInt(periodMatch[1] || '', 10);
  const startDay = Number.parseInt(periodMatch[2] || '', 10);
  const endMonth = Number.parseInt(periodMatch[3] || '', 10);
  const endDay = Number.parseInt(periodMatch[4] || '', 10);
  if (![startMonth, startDay, endMonth, endDay].every(Number.isFinite)) {
    return calculateWeeklyPeriod(now);
  }

  return {
    startDate: formatDate(year, startMonth, startDay),
    endDate: formatDate(endMonth < startMonth ? year + 1 : year, endMonth, endDay),
  };
}

export async function fetchLatestEmartFlyer(now = new Date()): Promise<FlyerSourceInfo> {
  const response = await fetch(EMART_FLYER_VIEWER_URL, {
    headers: {
      'user-agent': 'KokmartFlyerBot/1.0 (+https://kokmart-client.vercel.app)',
      accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
  });
  if (!response.ok) {
    throw new Error(`이마트 전단 뷰어 요청 실패: ${response.status} ${response.statusText}`);
  }

  const html = await response.text();
  const imageUrls = extractEmartFlyerImageUrls(html);
  if (imageUrls.length === 0) {
    throw new Error('이마트 전단 HTML에서 공식 전단 이미지 URL을 찾지 못했습니다.');
  }

  const validPeriod = extractPeriodFromHtml(html, imageUrls, now);
  return {
    martId: 'emart-master',
    martName: '이마트',
    branchName: '공통',
    flyerTitle: `이마트 ${validPeriod.startDate} 주간 전단`,
    validPeriod,
    imageUrls,
    sourceUrl: EMART_FLYER_VIEWER_URL,
    fetchedAt: now.toISOString(),
  };
}

export async function downloadEmartFlyerImages(imageUrls: string[]): Promise<Buffer[]> {
  return Promise.all(imageUrls.map(async (imageUrl, index) => {
    const validatedUrl = validateEmartImageUrl(imageUrl);
    if (!validatedUrl) throw new Error(`허용되지 않은 이마트 전단 이미지 URL입니다: ${imageUrl}`);

    const response = await fetch(validatedUrl, {
      headers: {
        'user-agent': 'KokmartFlyerBot/1.0 (+https://kokmart-client.vercel.app)',
        accept: 'image/avif,image/webp,image/png,image/jpeg',
      },
      redirect: 'follow',
    });
    if (!response.ok) {
      throw new Error(`이마트 전단 ${index + 1}면 다운로드 실패: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      throw new Error(`이마트 전단 ${index + 1}면 응답이 이미지가 아닙니다: ${contentType || 'unknown'}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) {
      throw new Error(`이마트 전단 ${index + 1}면 파일 크기가 허용 범위를 벗어났습니다.`);
    }
    return buffer;
  }));
}

