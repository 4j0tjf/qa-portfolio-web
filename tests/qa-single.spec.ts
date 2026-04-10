import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const rawUrls = process.env.TARGET_URLS || '["https://example.com"]';
const urlList = JSON.parse(rawUrls);
const specUrl = process.env.SPEC_URL || 'https://clova-x.naver.com'; 

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
      test.setTimeout(60000);

      // ==========================================
      // [STEP 1] 기준(Spec) 페이지 정답지 만들기
      // ==========================================
      // 💡 사파리(Webkit)가 멈추지 않도록 'domcontentloaded'로 뼈대만 빠르게 잡습니다.
      await page.goto(specUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.addStyleTag({ content: freezeCss });
      await page.waitForTimeout(1500); // 렌더링 안정화 대기

      const snapshotPath = testInfo.snapshotPath('dynamic-spec.png');
      fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
      await page.screenshot({ path: snapshotPath, fullPage: true });

      // ==========================================
      // [STEP 2] 타겟 페이지 접속 및 비교 검수
      // ==========================================
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.addStyleTag({ content: freezeCss });
      await page.waitForTimeout(1500);

      // 🚨 [가장 중요한 수정!!!] 
      // 10% 비율 허용(maxDiffPixelRatio)을 버리고, maxDiffPixels(절대 픽셀 수)를 도입합니다.
      // 이제 화면에 있는 "단어 하나"만 달라도 즉시 FAIL 처리됩니다!
      await expect(page).toHaveScreenshot('dynamic-spec.png', {
        fullPage: true,
        maxDiffPixels: 200, // 💡 단 200픽셀(아주 작은 네모 반점 크기)만 달라도 얄짤없이 실패!
        timeout: 10000
      });
      
      // ==========================================
      // [STEP 3] 성공 시 추가 인증샷
      // ==========================================
      const actualShot = await page.screenshot({ fullPage: true });
      await testInfo.attach('✅ 성공: 현재 타겟 화면', { body: actualShot, contentType: 'image/png' });

      const expectedShot = fs.readFileSync(snapshotPath);
      await testInfo.attach('✅ 성공: 기준 Spec 화면', { body: expectedShot, contentType: 'image/png' });
      
    });
  }
});