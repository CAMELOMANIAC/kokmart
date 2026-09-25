import React, { useEffect, useRef, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { BoundingBox } from '@kokmart/shared';
import * as s from './FlyerCropThumbnail.css';

interface FlyerCropThumbnailProps {
  imageUrl?: string;
  boundingBox?: BoundingBox;
  productName: string;
}

// 전단지 이미지 브라우저 메모리 캐시 (페이지당 1회만 로드 후 모든 카드가 공유)
const imageElementCache = new Map<string, Promise<HTMLImageElement>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  const cached = imageElementCache.get(src);
  if (cached) {
    return cached;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      imageElementCache.delete(src);
      reject(err);
    };
    img.src = src;
  });

  imageElementCache.set(src, promise);
  return promise;
}

export const FlyerCropThumbnail: React.FC<FlyerCropThumbnailProps> = ({
  imageUrl,
  boundingBox,
  productName,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'fallback'>('loading');

  useEffect(() => {
    if (!imageUrl || !boundingBox) {
      setStatus('fallback');
      return;
    }

    let isMounted = true;
    setStatus('loading');

    loadImage(imageUrl)
      .then((img) => {
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Retina 고해상도 지원을 위한 2배수 캔버스 해상도
        const outputWidth = 168;
        const outputHeight = 168;
        canvas.width = outputWidth;
        canvas.height = outputHeight;

        // Bounding Box (0~1000 정규화 좌표)를 이미지 픽셀 좌표로 변환
        const sx = Math.max(0, (boundingBox.xmin / 1000) * img.naturalWidth);
        const sy = Math.max(0, (boundingBox.ymin / 1000) * img.naturalHeight);
        const sw = Math.min(img.naturalWidth - sx, ((boundingBox.xmax - boundingBox.xmin) / 1000) * img.naturalWidth);
        const sh = Math.min(img.naturalHeight - sy, ((boundingBox.ymax - boundingBox.ymin) / 1000) * img.naturalHeight);

        if (sw <= 0 || sh <= 0) {
          setStatus('fallback');
          return;
        }

        ctx.clearRect(0, 0, outputWidth, outputHeight);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // 캔버스 중앙에 이미지 비율을 유지하며 크롭 채우기
        const aspectSource = sw / sh;
        const aspectTarget = outputWidth / outputHeight;

        let renderWidth = outputWidth;
        let renderHeight = outputHeight;
        let dx = 0;
        let dy = 0;

        if (aspectSource > aspectTarget) {
          renderHeight = outputHeight;
          renderWidth = outputHeight * aspectSource;
          dx = (outputWidth - renderWidth) / 2;
        } else {
          renderWidth = outputWidth;
          renderHeight = outputWidth / aspectSource;
          dy = (outputHeight - renderHeight) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, dx, dy, renderWidth, renderHeight);
        setStatus('loaded');
      })
      .catch(() => {
        if (isMounted) {
          setStatus('fallback');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [imageUrl, boundingBox]);

  if (status === 'fallback') {
    return (
      <div className={s.container} aria-label={productName}>
        <div className={s.placeholder}>
          <ShoppingBag size={24} className={s.placeholderIcon} />
          <span>전단 특가</span>
        </div>
      </div>
    );
  }

  return (
    <div className={s.container} aria-label={productName}>
      {status === 'loading' && <div className={s.skeleton} />}
      <canvas ref={canvasRef} className={s.canvas} />
    </div>
  );
};
