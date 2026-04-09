import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });
    }

    // 1. .env.local에 저장해 둔 내 GitHub 정보 불러오기
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = process.env.GITHUB_OWNER;
    const GITHUB_REPO = process.env.GITHUB_REPO;
    const WORKFLOW_ID = 'qa-trigger.yml'; // 아까 .github 폴더에 만든 파일명

    // 2. GitHub 서버로 "로봇 깨워줘!" 라고 HTTP 요청(POST) 쏘기
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/${WORKFLOW_ID}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main', // 깃허브 기본 브랜치 이름 (만약 master라면 master로 변경)
          inputs: {
            target_url: url, // 화면에서 입력받은 URL을 Actions로 넘겨줍니다.
          },
        }),
      }
    );

    // 3. 깃허브가 요청을 거절했을 경우 에러 처리
    if (!response.ok) {
      const errorData = await response.text();
      console.error('GitHub API 에러:', errorData);
      return NextResponse.json({ error: 'GitHub Actions 트리거에 실패했습니다.' }, { status: 500 });
    }

    // 4. 성공적으로 신호를 보냈다면 프론트엔드에 완료 메시지 전송
    return NextResponse.json({
      success: true,
      message: 'GitHub 클라우드에서 QA 테스트가 시작되었습니다!',
      targetUrl: url,
      jobId: `GH-ACTION-${Math.floor(Math.random() * 1000)}` 
    });
    
  } catch (error) {
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}