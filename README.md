# 마트콕 (Martkok) 🛒

> **"마트를 콕 집어 비교, 띵한 특가, 바로 띱, 함께 뿜"**  
> AI 기반 대형마트 3사(이마트·홈플러스·롯데마트) 전단 비교 & 스마트 장보기 최적화 플랫폼

---

## 📌 서비스 소개

**마트콕(Martkok)**는 대형마트 3사의 종이 전단지를 AI(Gemini Multimodal Vision API) 기반으로 분석하여 단위당 최저가를 비교하고, 마트 필구 특가 및 쿠팡 대용량 알뜰 팁을 제공하는 스마트 장보기 최적화 앱입니다.

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
* **AI Vision Engine**: Google Gemini 1.5 Flash Vision API (`@google/genai`)
* **Image Processing**: Sharp (전단지 4~6분할 타일 크롭 파이프라인)
* **Database (예정)**: Supabase (PostgreSQL + PostGIS + Realtime)

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
4. Vercel 대시보드 환경 변수에 `GEMINI_API_KEY`를 등록합니다.

### 2. 클라이언트 앱 배포 (Tauri v2 Cross-Platform)
```bash
cd apps/client

# macOS / Windows 데스크톱 앱 바이너리 빌드
pnpm tauri build

# iOS / Android 모바일 앱 번들 빌드
pnpm tauri android build
pnpm tauri ios build
```
