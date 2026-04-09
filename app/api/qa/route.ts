import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { urls } = body; // 화면에서 보낸 배열 받기

    if (!urls || urls.length === 0) {
      return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });
    }

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = process.env.GITHUB_OWNER;
    const GITHUB_REPO = process.env.GITHUB_REPO;
    const WORKFLOW_ID = 'qa-trigger.yml'; 

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
          ref: 'main',
          inputs: {
            // 배열을 JSON 문자열('["url1", "url2"]')로 변환해서 넘깁니다.
            target_urls: JSON.stringify(urls), 
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'GitHub Actions 트리거에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      jobId: `MULTI-QA-${Math.floor(Math.random() * 10000)}` 
    });
    
  } catch (error) {
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }
}