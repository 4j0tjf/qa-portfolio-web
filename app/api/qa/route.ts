import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// 1. 방금 .env.local에 적은 주소와 키를 가져와서 DB 클라이언트를 만듭니다.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || urls.length === 0) {
      return NextResponse.json({ error: 'URL이 필요합니다.' }, { status: 400 });
    }

    // 이번 작업의 고유 번호(접수 번호)를 먼저 만듭니다.
    const jobId = `MULTI-QA-${Math.floor(Math.random() * 10000)}`;

    // ⭐ 핵심: GitHub 로봇을 깨우기 전에, DB 창고에 먼저 '대기 중(pending)' 상태로 기록을 남깁니다!
    const { error: dbError } = await supabase
      .from('qa_jobs')
      .insert([
        { job_id: jobId, urls: urls, status: 'pending' }
      ]);

    if (dbError) {
      console.error('DB 저장 에러:', dbError);
      return NextResponse.json({ error: '데이터베이스 저장에 실패했습니다.' }, { status: 500 });
    }

    // 아래는 기존과 동일하게 GitHub Actions 로봇을 깨우는 로직입니다.
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
            target_urls: JSON.stringify(urls), 
          },
        }),
      }
    );

    if (!response.ok) {
      return NextResponse.json({ error: 'GitHub Actions 트리거에 실패했습니다.' }, { status: 500 });
    }

    // 성공적으로 마무리되었다면 화면에 접수 번호를 돌려줍니다.
    return NextResponse.json({ success: true, jobId: jobId });
    
  } catch (error) {
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }
}