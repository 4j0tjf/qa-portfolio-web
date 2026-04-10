import { test, expect } from '@playwright/test';

const rawUrls = process.env.TARGET_URLS || '["https://example.com", "https://example.org"]';
const urlList = JSON.parse(rawUrls);

for (const url of urlList) {
  test(`[다중 QA] 대상 주소 검증: ${url}`, async ({ page }) => {
    // 1. 타겟 주소로 이동
    await page.goto(url);

    // 2. 페이지 로딩이 완료될 때까지 잠시 대기 (네트워크 요청이 멈출 때까지 대기)
    await page.waitForLoadState('networkidle');

    // ===============================================
    // [핵심] 시각적 비교 (Visual Comparison) 추가
    // ===============================================
    
    // 파일명을 URL을 기반으로 안전하게 만듭니다. (예: example-com.png)
    const urlObj = new URL(url);
    const safeFilename = urlObj.hostname.replace(/[^a-z0-9]/gi, '-') + '.png';

    // 화면 전체를 캡처하여 '정답' 이미지와 비교합니다.
    // maxDiffPixelRatio: 0.1 (전체 픽셀 중 10%까지는 달라도 통과시켜 줌 - 애니메이션 등 고려)
    await expect(page).toHaveScreenshot(safeFilename, {
      fullPage: true,          // 스크롤 아래까지 전체 화면 캡처
      maxDiffPixelRatio: 0.1, // 허용 오차 (0 ~ 1 사이 값, 0이면 완벽 일치해야 함)
      timeout: 10000          // 렌더링 대기 시간
    });
  });
}