import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// 1. 대시보드에서 깃허브를 거쳐 전달받을 데이터들
const rawUrls = process.env.TARGET_URLS || '["https://example.org"]';
const urlList = JSON.parse(rawUrls);

// ⭐️ 이번에 새로 추가된 '기준(Spec) URL' 변수입니다. 
const specUrl = process.env.SPEC_URL || 'https://example.com'; 

test.describe('동적 VRT(Visual Regression Testing) 자동화', () => {
  
  for (const url of urlList) {
    // 테스트 이름에 어떤 URL끼리 비교하는지 명확하게 적어줍니다.
    test(`[시각적 비교] Spec(${specUrl}) vs Target(${url})`, async ({ page }, testInfo) => {

      // ==========================================
      // [STEP 1] 기준(Spec) 페이지 정답지 만들기
      // ==========================================
      await page.goto(specUrl);
      await page.waitForLoadState('networkidle'); // 렌더링이 끝날 때까지 대기

      // Playwright가 정답지를 찾는 공식 폴더/파일 경로를 가져옵니다.
      // (운영체제와 브라우저에 맞춰 알아서 '-chromium-linux.png' 같은 이름을 만들어 줍니다)
      const snapshotPath = testInfo.snapshotPath('dynamic-spec.png');

      // 폴더가 없으면 에러가 나므로 미리 만들어 줍니다.
      fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });

      // 기준 화면을 전체 캡처해서 '정답지 경로'에 몰래 덮어씌웁니다! (핵심 트릭 ⭐️)
      await page.screenshot({ path: snapshotPath, fullPage: true });

      // ==========================================
      // [STEP 2] 타겟 페이지 접속 및 비교 검수
      // ==========================================
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // 타겟 화면을 방금 만든 정답지('dynamic-spec.png')와 픽셀 단위로 비교합니다!
      await expect(page).toHaveScreenshot('dynamic-spec.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1, // 애니메이션 등을 고려한 10% 픽셀 오차 허용
        timeout: 10000
      });
      
    });
  }
});