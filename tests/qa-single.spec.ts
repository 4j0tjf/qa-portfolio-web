import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const rawUrls = process.env.TARGET_URLS || '["https://example.com"]';
const urlList = JSON.parse(rawUrls);
const specUrl = process.env.SPEC_URL || 'https://clova-x.naver.com'; 

// 애니메이션 강제 정지 CSS
const freezeCss = `
  *, *::before, *::after {
    transition: none !important;
    animation: none !important;
    caret-color: transparent !important;
  }
`;

test.describe('동적 VRT 자동화', () => {
  
  for (const url of urlList) {
    test(`[시각적 비교] Target: ${url}`, async ({ page }, testInfo) => {

      // 🚨 [핵심 해결책 1] 제한 시간을 30초에서 60초(1분)로 대폭 늘려줍니다!
      test.setTimeout(60000);

      // ==========================================
      // [STEP 1] 기준(Spec) 페이지 정답지 만들기
      // ==========================================
      // 🚨 [핵심 해결책 2] 'load' 대신 'domcontentloaded'를 써서 렌더링 속도를 확 높입니다.
      await page.goto(specUrl, { waitUntil: 'domcontentloaded' });
      await page.addStyleTag({ content: freezeCss });
      await page.waitForTimeout(2000); // 2초 대기

      // 🚨 [핵심 해결책 3] 대괄호([])를 빼고 일반 문자열로 돌려놓아야 HTML 리포트에 사진이 잘 붙습니다.
      const snapshotPath = testInfo.snapshotPath('dynamic-spec.png');
      fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
      await page.screenshot({ path: snapshotPath, fullPage: true });

      // ==========================================
      // [STEP 2] 타겟 페이지 접속 및 비교 검수
      // ==========================================
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.addStyleTag({ content: freezeCss });
      await page.waitForTimeout(2000);

      // 여기서 실패할 경우, Playwright가 알아서 Diff, Actual, Expected 사진 3장을 리포트에 꽂아줍니다!
      await expect(page).toHaveScreenshot('dynamic-spec.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1, 
        timeout: 10000
      });
      
      // ==========================================
      // [STEP 3] 성공 시 추가 인증샷 (실패하면 여기는 실행 안 됨)
      // ==========================================
      const actualShot = await page.screenshot({ fullPage: true });
      await testInfo.attach('✅ 성공: 현재 타겟 화면', { body: actualShot, contentType: 'image/png' });

      const expectedShot = fs.readFileSync(snapshotPath);
      await testInfo.attach('✅ 성공: 기준 Spec 화면', { body: expectedShot, contentType: 'image/png' });
      
    });
  }
});