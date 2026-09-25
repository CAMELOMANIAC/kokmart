# 마트콕 (Martkok) - Gemini AI 개발 지침 (GEMINI.md)

이 문서는 Gemini AI 어시스턴트가 본 프로젝트의 코드를 작성, 수정, 리팩토링할 때 반드시 준수해야 하는 최우선 가이드라인입니다.

---

## ⚠️ 절대 준수 규칙 (Strict Coding Rules)

### 1. 테스트 코드 작성 절대 금지 (Jules 전담) 🚫
- **AI(Gemini)는 테스트 코드(`*.test.ts`, `*.spec.ts`, `*.test.tsx`)를 절대 직접 생성하거나 작성하지 마십시오.**
- 본 프로젝트의 모든 단위/통합 테스트 코드는 **Jules가 매일 새벽 배치 작업을 통해 자동으로 작성 및 보강**합니다.
- Gemini는 순수 비즈니스 로직, API 엔드포인트, 서비스 기능 구현, UI 컴포넌트 개발 및 리팩토링에만 집중하십시오.
- (사용자가 명시적으로 "테스트 코드를 작성해 줘"라고 요구하는 특수한 경우를 제외하고는 테스트 파일을 생성하지 않습니다.)

### 2. `any` 타입 사용 절대 금지 (Strict TypeScript)
- 프로젝트 전반에서 `any` 타입 사용을 엄격히 금지합니다.
- 모든 타입은 명확하게 Interface, Type Alias, Generics로 정의하십시오.
- 동적 데이터나 외부 API 응답은 반드시 `unknown` 타입을 사용하고 런타임 타입 가드(Type Narrowing)를 거쳐야 합니다.

### 3. 인라인 스타일(`style={{ ... }}`) 절대 금지 (vanilla-extract 준수)
- JSX 컴포넌트 내부의 인라인 스타일 작성을 전면 금지합니다.
- 모든 스타일은 Zero-Runtime CSS-in-JS인 vanilla-extract 전용 모듈(`*.css.ts`)에 작성해야 합니다.
- 색상, 여백 등 디자인 값은 `theme.css.ts`의 디자인 시스템 토큰(`vars.*`)을 철저히 재사용하십시오.

---

## 🏗️ 핵심 아키텍처 요약
- **2-Tier 실행 아키텍처 (Vercel 타임아웃 완전 회피)**:
  - **주간 공통 전단 배치 (GitHub Actions)**: 매주 목요일 새벽 GitHub Actions 워크플로가 마트 3사 공통 마스터 전단을 일괄 파싱하여 Supabase DB에 캐싱 (실행 시간 6시간 지원으로 Vercel 서버리스 60초 타임아웃 완전 회피).
  - **지점 전단 실시간 차분 (Vercel Serverless)**: 클라이언트에서 특정 지점 요청 시 `sharp` 픽셀 차분(`compareFlyerPages`)으로 변동 페이지만 Vercel에서 즉시 단일 페이지 재파싱 (단일 페이지는 ~15개 상품이므로 Vercel 60초 제한 이내 완료).
- **전단 비전 파싱**: Gemini 3.5 Flash-Lite (TSV 포맷으로 출력 토큰 60% 절감)
- **페이지 차분 & 통교체**: `sharp` 기반 페이지 1:1 픽셀 차분 (`compareFlyerPages`) $\rightarrow$ 변동 페이지만 단일 통재파싱 (`parseSinglePageWithGemini`, 유령 상품 0%)
- **스마트 팁 큐레이션**: Groq GPT-OSS-20B API + 웹 검색 그라운딩 (`generateSmartTips`)
  - 신선식품/공산품 불문 실시간 최저가 비교 (`MART_BEST`, `MART_RECOMMEND`, `COUPANG_TIP`, `COUPANG_BULK`)
