import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Sparkles, ShoppingBag, ExternalLink, Check, AlertCircle, Loader2 } from 'lucide-react';
import { FloatingTopBar } from '../components/FloatingTopBar';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { useCartStore } from '../store/useCartStore';
import { ParsedProduct, TipType, FlyerDetailResponse } from '@kokmart/shared';
import * as s from './DdingFlyers.css';

type BrandType = '이마트' | '홈플러스' | '롯데마트';
type FilterType = 'ALL' | 'MART_ONLY' | 'COUPANG_ONLY';

const SAMPLE_FLYER_IMAGE = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80';

export const DdingFlyers: React.FC = () => {
  useScrollDirection();

  const addToCart = useCartStore((state) => state.addToCart);

  const [selectedBrand, setSelectedBrand] = useState<BrandType>('이마트');
  const [imageUrlInput, setImageUrlInput] = useState(SAMPLE_FLYER_IMAGE);
  const [isParsing, setIsParsing] = useState(false);
  const [status, setStatus] = useState<{
    type: 'idle' | 'loading' | 'success' | 'error';
    message: string;
  }>({
    type: 'idle',
    message: '',
  });
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [products, setProducts] = useState<ParsedProduct[]>([]);
  const [addedItemIds, setAddedItemIds] = useState<Set<string>>(new Set());

  // 선택된 브랜드의 최신 캐시 전단지 즉시 조회 (0.05초 로드)
  useEffect(() => {
    let isCancelled = false;

    async function loadLatestFlyer() {
      try {
        const res = await fetch(`/api/flyers/latest?martName=${encodeURIComponent(selectedBrand)}`);
        if (!res.ok) {
          if (!isCancelled) {
            setProducts([]);
            setStatus({ type: 'idle', message: '' });
          }
          return;
        }

        const data: FlyerDetailResponse = await res.json();
        if (!isCancelled && data.success && data.products && data.products.length > 0) {
          setProducts(data.products);
          setStatus({
            type: 'success',
            message: `⚡ 캐시된 ${selectedBrand} 전단지 데이터를 즉시 불러왔습니다 (${data.products.length}개 상품).`,
          });
        }
      } catch {
        // 캐시 조회 실패 시 조용히 무시 (신규 분석 대기)
      }
    }

    loadLatestFlyer();

    return () => {
      isCancelled = true;
    };
  }, [selectedBrand]);

  const handleApplySampleUrl = () => {
    setImageUrlInput(SAMPLE_FLYER_IMAGE);
    setStatus({
      type: 'idle',
      message: '샘플 전단지 이미지 링크가 입력되었습니다.',
    });
  };

  const handleParseMasterFlyer = async () => {
    if (!imageUrlInput.trim()) {
      setStatus({
        type: 'error',
        message: '분석할 전단지 이미지 URL을 입력해 주세요.',
      });
      return;
    }

    setIsParsing(true);
    setStatus({
      type: 'loading',
      message: 'Gemini 3.5 Flash-Lite 비전 파싱 및 Groq GPT-OSS-20B 실시간 가격 그라운딩 분석 중...',
    });

    try {
      const response = await fetch('/api/flyers/parse-master', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          martName: selectedBrand,
          imageUrls: [imageUrlInput.trim()],
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || '전단지 파싱 중 오류가 발생했습니다.');
      }

      const receivedProducts: ParsedProduct[] = data.products || [];
      setProducts(receivedProducts);

      if (data.isCached) {
        setStatus({
          type: 'success',
          message: `⚡ 기존 전단지와 동일하여 0초 만에 캐시 데이터를 반환했습니다! (${receivedProducts.length}개 상품)`,
        });
      } else {
        setStatus({
          type: 'success',
          message: `✅ ${selectedBrand} 전단지 분석 완료! 총 ${receivedProducts.length}개 상품의 실시간 스마트 팁이 생성되었습니다.`,
        });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '파싱 요청 실패';
      setProducts([]);
      setStatus({
        type: 'error',
        message: `❌ ${errorMsg}`,
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleAddToCart = (product: ParsedProduct) => {
    addToCart(product);
    const id = product.id || product.productName;
    setAddedItemIds((prev) => new Set(prev).add(id));

    setTimeout(() => {
      setAddedItemIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1500);
  };

  const handleOpenCoupangSearch = (keyword: string) => {
    const coupangUrl = `https://www.coupang.com/np/search?component=&q=${encodeURIComponent(keyword)}`;
    window.open(coupangUrl, '_blank', 'noopener,noreferrer');
  };

  const filteredProducts = products.filter((p) => {
    const tipType: TipType = p.smartTip?.tipType || 'MART_RECOMMEND';
    if (filter === 'MART_ONLY') {
      return tipType === 'MART_BEST' || tipType === 'MART_RECOMMEND';
    }
    if (filter === 'COUPANG_ONLY') {
      return tipType === 'COUPANG_TIP' || tipType === 'COUPANG_BULK';
    }
    return true;
  });

  const getBrandBadgeClass = (brand?: string) => {
    if (brand === '이마트') return s.brandBadge.emart;
    if (brand === '홈플러스') return s.brandBadge.homeplus;
    if (brand === '롯데마트') return s.brandBadge.lotte;
    return s.brandBadge.default;
  };

  const getBrandChipClass = (brand: BrandType) => {
    if (brand !== selectedBrand) return s.brandChip.unselected;
    if (brand === '이마트') return s.brandChip.selectedEmart;
    if (brand === '홈플러스') return s.brandChip.selectedHomeplus;
    return s.brandChip.selectedLotte;
  };

  const getTipBadgeClass = (tipType?: TipType) => {
    switch (tipType) {
      case 'MART_BEST':
        return s.tipBadge.MART_BEST;
      case 'MART_RECOMMEND':
        return s.tipBadge.MART_RECOMMEND;
      case 'COUPANG_TIP':
        return s.tipBadge.COUPANG_TIP;
      case 'COUPANG_BULK':
        return s.tipBadge.COUPANG_BULK;
      default:
        return s.tipBadge.MART_RECOMMEND;
    }
  };

  const getSmartTipBoxClass = (tipType?: TipType) => {
    switch (tipType) {
      case 'MART_BEST':
        return s.smartTipBox.MART_BEST;
      case 'MART_RECOMMEND':
        return s.smartTipBox.MART_RECOMMEND;
      case 'COUPANG_TIP':
        return s.smartTipBox.COUPANG_TIP;
      case 'COUPANG_BULK':
        return s.smartTipBox.COUPANG_BULK;
      default:
        return s.smartTipBox.MART_RECOMMEND;
    }
  };

  return (
    <div className={s.container}>
      <FloatingTopBar
        title="띵! 한 핫딜"
        icon={<Zap size={18} color="#FF5E00" />}
      />

      <div className={s.noticeCard}>
        <div className={s.noticeTitle}>
          <Sparkles size={16} />
          매주 목요일 전단 발행 & AI 스마트 비교
        </div>
        <div className={s.noticeDesc}>
          Gemini 3.5 Flash-Lite와 Groq GPT-OSS-20B의 실시간 웹 검색 그라운딩으로 무늬만 전단 특가에 속지 않는 객관적 최저가 팁을 제공합니다.
        </div>
      </div>

      <div className={s.controlCard}>
        <div className={s.controlTitle}>
          <span>AI 전단지 실시간 파싱 & 스마트 팁</span>
          <span className={s.modelBadge}>Gemini 3.5 + Groq</span>
        </div>

        <div className={s.brandSelectorRow}>
          {(['이마트', '홈플러스', '롯데마트'] as BrandType[]).map((brand) => (
            <motion.button
              key={brand}
              whileTap={{ scale: 0.96 }}
              onClick={() => setSelectedBrand(brand)}
              className={getBrandChipClass(brand)}
            >
              {brand}
            </motion.button>
          ))}
        </div>

        <input
          type="text"
          className={s.inputField}
          value={imageUrlInput}
          onChange={(e) => setImageUrlInput(e.target.value)}
          placeholder="전단지 이미지 고해상도 웹 URL을 입력하세요"
          disabled={isParsing}
        />

        <div className={s.sampleButtonRow}>
          <button
            type="button"
            className={s.sampleTextButton}
            onClick={handleApplySampleUrl}
            disabled={isParsing}
          >
            샘플 전단지 이미지 링크 자동 채우기
          </button>
        </div>

        <div className={s.actionButtonGroup}>
          <motion.button
            whileTap={{ scale: 0.98 }}
            whileHover={{ scale: 1.01 }}
            className={s.submitButton}
            onClick={handleParseMasterFlyer}
            disabled={isParsing}
          >
            {isParsing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>AI 비전 분석 및 팁 큐레이션 중...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>{selectedBrand} 전단 AI 실시간 분석 실행</span>
              </>
            )}
          </motion.button>
        </div>

        {status.message && (
          <div
            className={
              status.type === 'loading'
                ? s.statusBannerLoading
                : status.type === 'success'
                ? s.statusBannerSuccess
                : s.statusBannerError
            }
          >
            {status.type === 'loading' && <Loader2 size={16} />}
            {status.type === 'success' && <Check size={16} />}
            {status.type === 'error' && <AlertCircle size={16} />}
            <span>{status.message}</span>
          </div>
        )}
      </div>

      <div className={s.filterRow}>
        <button
          className={filter === 'ALL' ? s.filterChip.active : s.filterChip.inactive}
          onClick={() => setFilter('ALL')}
        >
          전체 상품 ({products.length})
        </button>
        <button
          className={filter === 'MART_ONLY' ? s.filterChip.active : s.filterChip.inactive}
          onClick={() => setFilter('MART_ONLY')}
        >
          마트 필구/추천
        </button>
        <button
          className={filter === 'COUPANG_ONLY' ? s.filterChip.active : s.filterChip.inactive}
          onClick={() => setFilter('COUPANG_ONLY')}
        >
          쿠팡 알뜰팁
        </button>
      </div>

      <div className={s.productList}>
        <AnimatePresence mode="popLayout">
          {products.length === 0 ? (
            <div className={s.emptyState}>
              <div className={s.emptyTitle}>분석된 전단지 상품이 없습니다</div>
              <div className={s.emptyDesc}>상단 전단지 이미지 링크를 확인하신 후 [전단 AI 실시간 분석 실행] 버튼을 눌러주세요.</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className={s.emptyState}>
              <div className={s.emptyTitle}>선택한 조건의 상품이 없습니다</div>
              <div className={s.emptyDesc}>다른 필터를 선택하거나 새 전단지를 분석해 보세요.</div>
            </div>
          ) : (
            filteredProducts.map((item) => {
              const itemId = item.id || item.productName;
              const isAdded = addedItemIds.has(itemId);
              const tipType: TipType = item.smartTip?.tipType || 'MART_RECOMMEND';

              return (
                <motion.div
                  key={itemId}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className={s.productCard}
                >
                  <div className={s.cardTopRow}>
                    <div className={s.badgeGroup}>
                      <span className={getBrandBadgeClass(item.martName || selectedBrand)}>
                        {item.martName || selectedBrand}
                      </span>
                      {item.pageIndex && (
                        <span className={s.pageNumberBadge}>{item.pageIndex}면 전단</span>
                      )}
                    </div>

                    <span className={getTipBadgeClass(tipType)}>
                      {item.smartTip?.badgeText || '마트 추천'}
                    </span>
                  </div>

                  <div className={s.productTitleRow}>
                    <div className={s.productName}>{item.productName}</div>
                    <div className={s.priceContainer}>
                      <div className={s.unitPriceText}>
                        {item.unitMeasure}당 {item.effectiveUnitPrice.toLocaleString()}원
                      </div>
                      <div className={s.salePriceText}>
                        {item.salePrice.toLocaleString()}원
                      </div>
                    </div>
                  </div>

                  {item.smartTip && (
                    <div className={getSmartTipBoxClass(tipType)}>
                      {item.smartTip.tipMessage}
                    </div>
                  )}

                  <div className={s.cardActionRow}>
                    {item.smartTip?.coupangKeyword ? (
                      <button
                        type="button"
                        className={s.coupangSearchButton}
                        onClick={() => handleOpenCoupangSearch(item.smartTip?.coupangKeyword || item.productName)}
                      >
                        <ExternalLink size={13} />
                        <span>쿠팡 최저가 검색</span>
                      </button>
                    ) : (
                      <div />
                    )}

                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      className={s.cartAddButton}
                      onClick={() => handleAddToCart(item)}
                    >
                      {isAdded ? (
                        <>
                          <Check size={14} />
                          <span>담김!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={14} />
                          <span>담기</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
