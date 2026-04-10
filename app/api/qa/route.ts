import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const jobId = `MULTI-QA-${Math.floor(Math.random() * 10000)}`;

    const { error: dbError } = await supabase
      .from('qa_jobs')
      .insert([
        { job_id: jobId, urls: urls, status: 'pending' }
      ]);

    if (dbError) {
      console.error('DB 저장 에러:', dbError);
      return NextResponse.json({ error: '데이터베이스 저장에 실패했습니다.' }, { status: 500 });
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
            target_urls: JSON.stringify(urls), 
            job_id: jobId,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n🚨 [깃허브 에러 상세 내용] 🚨\n', errorText, '\n');
      return NextResponse.json({ error: 'GitHub Actions 트리거에 실패했습니다.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, jobId: jobId });
    
  } catch (error) {
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }
}