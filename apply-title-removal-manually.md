# 배너 title 컬럼 제거 - 수동 적용 가이드

## 문제
`banners` 테이블에서 `title` 컬럼을 제거해야 하지만, drizzle-kit 마이그레이션이 제대로 적용되지 않았습니다.

## 해결 방법

### 방법 1: Supabase 대시보드에서 직접 실행 (권장)

1. Supabase 대시보드 접속
2. SQL Editor로 이동
3. 아래 SQL을 복사하여 실행:

```sql
-- Remove title column from banners table
ALTER TABLE "banners" DROP COLUMN IF EXISTS "title";
```

4. 마이그레이션 추적 테이블에 기록 추가 (선택사항):

```sql
INSERT INTO drizzle.__drizzle_migrations (hash, created_at) 
VALUES ('0010_remove_banner_title', NOW())
ON CONFLICT DO NOTHING;
```

### 방법 2: 타입 정의 업데이트

SQL 실행 후, 다음 명령어로 TypeScript 타입 정의를 업데이트하세요:

```bash
npm run db:typegen
```

이 명령어는 `database.types.ts` 파일을 업데이트하여 `title` 필드를 제거합니다.

