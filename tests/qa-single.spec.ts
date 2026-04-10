import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const rawUrls = process.env.TARGET_URLS || '["https://example.org"]';
const urlList = JSON.parse(rawUrls);
const specUrl = process.env.SPEC_URL || 'https://example.com'; 

test.describe('동적 VRT(Visual Regression Testing) 자동화', () => {
  
  for (const url of urlList) {
    test(`[시각적 비교] Spec(${specUrl}) vs Target(${url})`, async ({ page }, testInfo) => {

      // ==========================================
      // [STEP 1] 기준(Spec) 페이지 정답지 만들기
      // ==========================================
      await page.goto(specUrl);
      await page.waitForLoadState('networkidle');

      const snapshotPath = testInfo.snapshotPath('dynamic-spec.png');
      fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
      await page.screenshot({ path: snapshotPath, fullPage: true });

      // ==========================================
      // [STEP 2] 타겟 페이지 접속 및 비교 검수
      // ==========================================
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // 1. 여기서 픽셀 비교를 진행합니다. (실패하면 여기서 에러 내고 멈춤)
      await expect(page).toHaveScreenshot('dynamic-spec.png', {
        fullPage: true,
        maxDiffPixelRatio: 0.1, 
        timeout: 10000
      });
      
      // Actual (현재 타겟 화면) 스크린샷 찍고 첨부하기
      const actualShot = await page.screenshot({ fullPage: true });
      await testInfo.attach('✅ Actual (현재 타겟 화면)', { 
        body: actualShot, 
        contentType: 'image/png' 
      });

      // Expected (미리 찍어둔 정답지 화면) 파일 읽어와서 첨부하기
      const expectedShot = fs.readFileSync(snapshotPath);
      await testInfo.attach('✅ Expected (기준 Spec 화면)', { 
        body: expectedShot, 
        contentType: 'image/png' 
      });
      
    });
  }
});