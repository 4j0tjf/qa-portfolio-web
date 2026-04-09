import { test, expect } from '@playwright/test';

// 1. 외부(GitHub Actions)에서 전달받은 JSON 문자열을 실제 배열로 파싱합니다.
// (로컬에서 테스트할 때를 대비해 기본 배열도 하나 넣어줍니다)
const rawUrls = process.env.TARGET_URLS || '["https://example.com", "https://example.org"]';
const urlList = JSON.parse(rawUrls);

// 2. Playwright 파라미터화 테스트 (배열을 순회하며 테스트를 무한 생성)
for (const url of urlList) {
  
  // url마다 독립적인 test() 블록을 생성합니다.
  test(`[다중 QA] 대상 주소 검증: ${url}`, async ({ page }) => {
    
    // 타겟 주소로 이동
    await page.goto(url);

    // ===============================================
    // 여기에 공통으로 확인할 검증 로직을 작성합니다.
    // (아래는 예시입니다. 나중에 실제 기획에 맞게 수정하세요)
    // ===============================================

    // 예시 1: 화면에 텍스트가 존재하는가? (안전하게 에러 무시 처리)
    try {
       // CLOVA X 예시: await expect(page.getByText('서비스 종료 안내')).toBeVisible({ timeout: 5000 });
       // 지금은 기본 사이트 테스트용으로 둡니다.
    } catch (e) {
      console.log(`${url} 에는 해당 텍스트가 없습니다.`);
    }

    // 예시 2: 하단 링크 검증
    // const csLink = page.getByRole('link', { name: '고객센터' });
    // await expect(csLink).toBeVisible();

    // 임시: 페이지 로딩만 잘 되었는지 Title 검증으로 대체합니다.
    await expect(page).toHaveTitle(/./); 
  });
}