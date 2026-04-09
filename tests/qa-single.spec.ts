import { test, expect } from '@playwright/test';

test('CLOVA X 서비스 종료 페이지 자동 QA', async ({ page }) => {
  // ⭐ 핵심: 외부(GitHub Actions)에서 전달해 주는 URL을 받아서 사용합니다.
  const targetUrl = process.env.TARGET_URL || 'https://example.com'; 
  
  await page.goto(targetUrl);

  // ... (아래 검증 로직은 기존과 동일) ...
  const mainTitle = page.getByText('서비스 종료 안내');
  await expect(mainTitle).toBeVisible();
  
  // ... 생략 ...
});