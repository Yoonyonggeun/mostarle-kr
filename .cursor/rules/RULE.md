---
alwaysApply: false
---

# Mostarle-KR 프로젝트 규칙

## 프로젝트 개요

해외 mostarle.com의 3D 메탈 퍼즐 상품을 한국에서 드롭쉬핑으로 판매하는 전자상거래 플랫폼

## 기술 스택

- React Router 7 (파일 기반 라우팅)
- Tailwind CSS + shadcn/ui (app/core/components/ui/)
- Supabase (Auth, DB, Storage)
- Drizzle ORM (app/core/db/)
- Toss Payments (결제)
- TypeScript + Zod (타입/검증)

## 개발 원칙

1. Feature-based 구조: `app/features/[feature]/api|components|screens|lib`
2. React Router 7 패턴: loader(데이터), action(폼/변경), meta(메타데이터)
3. 서버 코드: `.server.ts` 확장자, `makeServerClient(request)` 패턴
4. 인증 가드: `private.layout.tsx` 또는 `requireAuthentication()`
5. 타입 안정성: TypeScript + Zod 스키마 검증

## 필수 구현 기능

1. 메인페이지: navigation.layout.tsx (Header + Footer)
2. 카카오 로그인: `/auth/social/start/kakao` (기존 소셜 로그인 패턴 참고)
3. 상품 상세: `/products/:slug` (새 feature 생성)
4. 장바구니: `/cart` (새 feature, private)
5. 배송현황: `/orders` (새 feature, private)
6. 결제: `/payments/checkout` (기존 코드 확장)
7. 상품 생성: 특정 회원만 접근 가능한 상품 생성 페이지(email: yoon5ye@gmail.com)

## 코딩 규칙

- 파일명: kebab-case, 컴포넌트: PascalCase
- 공통: `app/core/`, 기능별: `app/features/[name]/`
- 라우트: `app/routes.ts`에서 관리
