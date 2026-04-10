import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const rawUrls = process.env.TARGET_URLS || '["https://example.com"]';
const urlList = JSON.parse(rawUrls);
const specUrl = process.env.SPEC_URL || 'https://clova-x.naver.com'; 

// ⭐️ 마법의 CSS: 화면의 모든 애니메이션과 깜빡임을 강제로 정지시킵니다.
const freezeCss = `
  *, *::before, *::after {
    transition: none !important;
    animation: none !important;
    caret-color: transparent !important;
  }
`;

test.describe('동적 VRT(Visual Regression Testing) 자동화', () => {
  
  for (const url of urlList) {
    test(`[시각적 비교] Target: ${url}`, async ({ page }, testInfo) => {

      // ==========================================
      // [STEP 1] 기준(Spec) 페이지 정답지 만들기
      // ==========================================
      // 네이버 같은 무거운 사이트는 networkidle 대신 load를 쓰고 살짝 기다려주는 것이 훨씬 안전합니다.
      await page.goto(specUrl, { waitUntil: 'load' });
      await page.addStyleTag({ content: freezeCss }); // 애니메이션 얼음!
      await page.waitForTimeout(3000); // 렌더링이 완전히 안정화될 때까지 3초 대기

      // ⭐️ 핵심: 문자열 대신 배열 ['...'] 을 넣으면 브라우저/OS 이름표가 마음대로 붙는 것을 방지합니다.
      const snapshotPath = testInfo.snapshotPath(['dynamic-spec.png']);
      fs.mkdirSync(path.dirname(snapshotPath), { recursive: true });
      await page.screenshot({ path: snapshotPath, fullPage: true });

      // ==========================================
      // [STEP 2] 타겟 페이지 접속 및 비교 검수
      // ==========================================
      await page.goto(url, { waitUntil: 'load' });
      await page.addStyleTag({ content: freezeCss }); // 타겟 페이지도 똑같이 얼음!
      await page.waitForTimeout(3000);

      // ⭐️ 여기서도 똑같이 배열 ['...'] 을 넣어 방금 만든 파일과 정확하게 1:1 매칭시킵니다.
      await expect(page).toHaveScreenshot(['dynamic-spec.png'], {
        fullPage: true,
        maxDiffPixelRatio: 0.1, // 10% 픽셀 오차 허용 (폰트 렌더링 등 대비)
        timeout: 15000
      });
      
      // ==========================================
      // [STEP 3] 성공 인증샷 첨부 (성공했을 경우에만 실행됨)
      // ==========================================
      const actualShot = await page.screenshot({ fullPage: true });
      await testInfo.attach('✅ Actual (현재 타겟 화면)', { body: actualShot, contentType: 'image/png' });

      const expectedShot = fs.readFileSync(snapshotPath);
      await testInfo.attach('✅ Expected (기준 Spec 화면)', { body: expectedShot, contentType: 'image/png' });
      
    });
  }
});