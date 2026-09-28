# 마트콕 (Martkok) 🛒

> **"마트를 콕 집어 비교, 띵한 특가, 바로 띱, 함께 뿜"**  
> AI 기반 대형마트 3사(이마트·홈플러스·롯데마트) 전단 비교 & 스마트 장보기 최적화 플랫폼

---

## 📌 서비스 소개

**마트콕(Martkok)**는 대형마트 3사의 종이 전단지를 AI(Gemini Multimodal Vision API) 기반으로 분석하여 단위당 최저가를 비교하고, 마트 필구 특가 및 쿠팡 대용량 알뜰 팁을 제공하는 스마트 장보기 최적화 앱입니다.

## 🧭 AI 전단 처리 아키텍처

마트콕의 목표 운영 구조는 **공통 전단은 주간 배치로 미리 만들고**, 사용자가 실제로 선택한 지점만 필요할 때 생성·캐시하는 2-Tier 구조입니다. 비용이 큰 Vision·검색 호출을 사용하지 않는 지점에는 발생시키지 않는 것이 핵심입니다.

```mermaid
flowchart TB
  subgraph Weekly["① 주간 공통 마스터 전단 갱신"]
    Cron["GitHub Actions<br/>매주 목요일 03:17 KST"]
    Crawl["마트별 공식 전단 크롤링<br/>공통 전단 이미지 URL 수집"]
    Same{"기존 image_urls와 동일한가?"}
    Skip["AI 호출 생략"]
    Vision["Gemini 3.5 Flash-Lite<br/>전단 이미지 → 상품·규격·가격"]
    MasterDB[("Supabase<br/>공통 마스터 전단")]
    TipBatch["Gemini 3.8 Flash + Google Search<br/>구매 팁 배치 생성"]
    MasterCache[("상품·구매 팁 캐시")]

    Cron --> Crawl --> Same
    Same -->|"같음"| Skip --> MasterCache
    Same -->|"새 전단"| Vision --> MasterDB --> TipBatch --> MasterCache
  end

  subgraph OnDemand["② 사용자 요청 기반 지점 전단 처리"]
    User["사용자<br/>마트·지점 선택"]
    BranchCache{"이번 주 지점 캐시가 있는가?"}
    Return["전단·구매 팁 즉시 반환"]
    Resolve["공식 지점 전단 소스 확인<br/>점포 ID·쿠키·API 요청 해석"]
    Diff["Sharp 페이지 차분<br/>공통 마스터와 비교"]
    Reuse["동일 페이지는<br/>공통 상품·팁 재사용"]
    BranchVision["변경 페이지만<br/>Gemini Vision 재파싱"]
    Realtime["변경 상품만<br/>Groq 실시간 팁 생성"]
    BranchDB[("지점 전단 캐시<br/>행사 기간 동안 재사용")]

    User --> BranchCache
    BranchCache -->|"있음"| Return
    BranchCache -->|"없음"| Resolve --> Diff
    MasterCache -. "공통 기준 전단" .-> Diff
    Diff --> Reuse --> BranchDB
    Diff --> BranchVision --> Realtime --> BranchDB
    BranchDB --> Return
  end

  classDef batch fill:#e3f2fd,stroke:#1565c0,color:#0d47a1;
  classDef ondemand fill:#fff3e0,stroke:#ef6c00,color:#e65100;
  classDef storage fill:#e8f5e9,stroke:#2e7d32,color:#1b5e20;
  class Cron,Crawl,Same,Skip,Vision,TipBatch batch;
  class User,BranchCache,Return,Resolve,Diff,Reuse,BranchVision,Realtime ondemand;
  class MasterDB,MasterCache,BranchDB storage;
```

| 처리 경로 | 호출 시점 | AI 비용 제어 방식 |
| --- | --- | --- |
| 공통 마스터 전단 | 매주 목요일 배치 | 전단 이미지 URL이 같으면 Vision 호출 생략 |
| 개별 지점 전단 | 사용자가 해당 지점을 처음 요청할 때 | 공통 전단과 같은 페이지·상품·팁은 재사용 |
| 구매 팁 | 공통은 GitHub Actions, 지점 변경 상품은 실시간 Worker | 상품별 큐·캐시·재시도로 중복 호출 방지 |

### 📱 4-Tab 핵심 기능
* **[ 🎯 콕 ] 홈 & 최저가 비교**: 주변 마트 3사 ON/OFF 토글 및 100g/개당 단위 환산 최저가 큐레이션
* **[ ⚡ 띵 ] 전단 핫딜**: 목요일 전단 발행 알림 및 1+1, 타임세일 기획전 피드
* **[ 🏷️ 띱 ] 장바구니 & 분할 쇼핑 계산기**: 위시리스트 보관 및 **"단일 마트 몰아담기 vs 최적 분할 구매"** 절약액 비교
* **[ 🍕 뿜 ] 대용량 반반 나눔**: 1+1, 대용량 상품을 동네 이웃과 1/N 소분 매칭하는 직거래 커뮤니티

---

## 🛠️ 기술 스택 (Tech Stack)

### Monorepo & Packaging
* **Monorepo Manager**: `pnpm Workspaces`
* **Cross-Platform Packaging**: `Tauri v2` (iOS, Android, macOS, Windows)

### Client (Frontend)
* **Framework**: React 18 (TypeScript) + Vite
* **Styling**: Vanilla Extract (`@vanilla-extract/css`) - Zero-Runtime 타입 안전 CSS-in-JS (TypeScript Linter 통합)
* **Animation**: Framer Motion (`motion/react`)
* **State Management**: Zustand (장바구니 & 마트 토글 스토어)
* **Server Caching**: TanStack Query (React Query v5)
* **Routing**: TanStack Router (HashHistory 모드)

### Code Quality & Linting
* **Linter**: ESLint 8 + TypeScript ESLint + React Hooks Linter (`pnpm lint`)

### Server (Backend & AI Engine)
* **Backend Framework**: Express.js (TypeScript) - **Vercel Serverless Functions Ready**
* **AI Vision Engine**: Google Gemini 3.5 Flash-Lite (`@google/genai`)
* **Image Processing**: Sharp (전단지 4~6분할 타일 크롭 파이프라인)
* **Database & Queue**: Supabase (PostgreSQL + Realtime)

---

## ⚠️ 필수 개발 및 코딩 컨벤션 (Strict Coding Rules)

1. **`any` 타입 사용 절대 금지 (Strict TypeScript)**
   * 코드 작성 시 `any` 타입의 사용을 엄격히 금지합니다.
   * 타입을 명확하게 명시(Interface / Type Alias / Generics)하거나, 동적이거나 불확실한 데이터는 반드시 **`unknown` 타입을 사용**하고 타입 가드(Type Narrowing)를 거쳐 안전하게 사용해야 합니다.
2. **인라인 스타일(`style={{ ... }}`) 절대 금지 (vanilla-extract 준수)**
   * JSX 컴포넌트 내부의 인라인 스타일(`style={{ ... }}`) 작성을 일체 금지합니다.
   * 모든 스타일링은 Zero-Runtime CSS-in-JS인 **vanilla-extract 전용 파일(`*.css.ts`)**에 분리하여 작성해야 합니다.
   * 색상, 간격, 폰트 크기, 반경 등은 하드코딩하지 않고 [theme.css.ts](apps/client/src/styles/theme.css.ts)의 디자인 시스템 토큰(`vars.*`)을 반드시 활용해야 합니다.

---

## 📁 프로젝트 구조 (Monorepo Architecture)

```
kokmart/
├── pnpm-workspace.yaml          # pnpm 모노레포 설정
├── package.json                 # 루트 스크립트 설정 (pnpm dev 한 번으로 동시 실행)
├── .eslintrc.json               # 모노레포 통합 ESLint / TypeScript 린터 설정
├── vercel.json                  # Vercel Serverless Functions 자동 배포 설정
├── PROJECT_SPEC.md              # 콕마트 기획 명세서
├── packages/
│   └── shared/                  # Gemini JSON DTO 및 스마트 팁 공통 타입 (@kokmart/shared)
└── apps/
    ├── server/                  # Node.js/Express + Sharp + Gemini Vision API (@kokmart/server)
    │   ├── api/index.ts         # Vercel Serverless Function 라우터 엔트리포인트
    │   └── src/services/geminiService.ts # 전단 4~6분할 이미지 크롭 & OCR 파이프라인
    └── client/                  # Tauri v2 + React + Vanilla Extract 앱 (@kokmart/client)
        ├── src/components/      # Framer Motion 4-Tab 네비게이션
        ├── src/store/           # Zustand 상태 관리
        ├── src/pages/           # 🎯콕, ⚡띵, 🏷️띱, 🍕뿜 핵심 뷰
        └── src-tauri/           # Tauri v2 크로스플랫폼 패키징 설정
```

---

## 🚀 로컬 개발 및 실행 방법

### 1. 의존성 설치 및 타입 빌드
```bash
pnpm install
pnpm build:shared
```

### 2. 코드 린팅 검사
```bash
pnpm lint
```

### 3. 프론트엔드 + 백엔드 통합 개발 서버 한 번에 띄우기 ⚡
```bash
pnpm dev
```
*(내부적으로 `pnpm --filter "./apps/*" --parallel dev` 명령이 작동하여 백엔드: 4000포트, 프론트엔드: 3000포트를 동시에 병렬 구동합니다.)*

---

## 📦 전체 모노레포 통합 빌드

```bash
pnpm build
```

---

## 🌐 배포 가이드 (Deployment Guide)

### 1. 백엔드 배포 (Vercel Serverless Functions)
1. GitHub 저장소에 코드를 push 합니다.
2. Vercel 대시보드에서 저장소를 임포트합니다.
3. `vercel.json` 설정으로 `apps/server/api/index.ts` 가 **Vercel Serverless Function**으로 자동 내보내기 배포됩니다.
4. Vercel 대시보드에 다음 환경 변수를 등록합니다.

   - `GEMINI_VISION_API_KEY`: 결제가 연결되지 않은 별도 Google Cloud 프로젝트의 이미지 파싱용 키
   - `GEMINI_VISION_MODEL`: 선택값, 기본 `gemini-3.5-flash-lite`
   - `GROQ_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `TIP_WORKER_SECRET`: 충분히 긴 임의 문자열
   - `TIP_WORKER_BATCH_SIZE`: 선택값, 검색 결과를 상품별로 검증하기 위해 현재 `1`로 제한
   - `TIP_WORKER_MAX_ATTEMPTS`: 선택값, 기본 `5`

### 2. Supabase 비동기 스마트 팁 Worker

전단 파싱 요청은 상품을 `tip_status=pending`으로 DB에 먼저 저장한 뒤 즉시 반환합니다. 마스터 전단은 `tip_processor=gemini_batch`, 지점 전단은 `tip_processor=groq_realtime`로 분리됩니다.

1. Supabase SQL Editor에서 [`apps/server/scripts/schema.sql`](apps/server/scripts/schema.sql)을 실행합니다.
   - 기존 DB라면 전체 스키마 대신 [`apps/server/scripts/setup-tip-processing-lanes.sql`](apps/server/scripts/setup-tip-processing-lanes.sql)을 먼저 실행할 수 있습니다.
2. [`apps/server/scripts/setup-tip-worker-cron.sql`](apps/server/scripts/setup-tip-worker-cron.sql)의 production URL과 secret 예시를 실제 값으로 바꿔 실행합니다.
3. SQL의 `tip_worker_secret`과 Vercel의 `TIP_WORKER_SECRET`은 반드시 같은 값을 사용합니다.

Cron은 매분 `groq_realtime` 큐만 확인하며, 처리할 지점 상품이 있을 때만 Vercel worker를 호출합니다. 마스터 전단의 `gemini_batch` 행은 Vercel/Groq worker가 가져가지 않습니다. 429 응답이 오면 함수 안에서 기다리지 않고 `tip_next_attempt_at` 이후로 작업을 연기합니다. 클라이언트는 처리 중인 상품이 있을 때 15초마다 최신 DB 값을 조회합니다.

로컬에서 worker를 수동 실행하려면 다음과 같이 호출할 수 있습니다.

```bash
curl -X POST http://localhost:4000/api/internal/tip-worker \
  -H "Authorization: Bearer YOUR_TIP_WORKER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"source":"manual"}'
```

### 3. GitHub Actions 공통 마스터 전단·팁 배치

[`gemini-master-tip-batch.yml`](.github/workflows/gemini-master-tip-batch.yml)은 매주 목요일 03:17(KST)에 실행되며, 수동 실행도 지원합니다. 현재는 이마트 공식 전단 뷰어 HTML에서 이미지 URL을 수집하고, 새 전단일 때만 Gemini 3.5 Flash-Lite로 상품을 파싱해 Supabase에 저장합니다. 이어서 Gemini 3.8 Flash + Google Search가 구매 팁을 생성합니다. 두 단계 모두 GitHub Actions에서 직접 실행되므로 Vercel 함수는 거치지 않습니다.

GitHub 저장소의 Actions secrets에 다음 값을 등록합니다.

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_TIP_API_KEY`: Tier 1 결제 프로젝트에서 발급한 검색 팁 전용 키
- `GEMINI_VISION_API_KEY`: Vercel에도 등록한 무료 프로젝트의 이미지 파싱 키

기본값은 요청당 최대 6개 상품, 실행당 최대 16회 호출이며 검색 모델은 `gemini-3.8-flash`, thinking level은 `medium`입니다. 검색 근거가 없는 상품은 원본 페이지를 무료 `gemini-3.5-flash-lite`로 한 번 재검증합니다. 교정 후 온라인 비교가 가능한 상품만 3.8 Flash로 한 번 더 검색하고, 마트 자체 구성·즉석조리·신선식품처럼 동일 온라인 상품이 없는 경우에는 가격을 만들지 않는 비가격 팁으로 완료합니다.

로컬에서 이마트 공통 마스터 전단을 수집·파싱하려면 다음을 실행합니다.

```bash
pnpm flyers:master-crawl
```

수집된 마스터 전단의 팁만 다시 생성하려면 다음을 실행합니다.

```bash
pnpm tips:master-batch
```

### 4. 클라이언트 앱 배포 (Tauri v2 Cross-Platform)
```bash
cd apps/client

# macOS / Windows 데스크톱 앱 바이너리 빌드
pnpm tauri build

# iOS / Android 모바일 앱 번들 빌드
pnpm tauri android build
pnpm tauri ios build
```
