import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
  try {
    // 1. 화면에서 specUrl과 urls를 모두 받아옵니다.
    const { specUrl, urls } = await request.json();

    if (!specUrl || !urls || urls.length === 0) {
      return NextResponse.json({ error: 'Spec URL과 Target URL이 모두 필요합니다.' }, { status: 400 });
    }

    // 2. Supabase에 새로운 작업을 등록합니다.
    const { data: jobData, error: dbError } = await supabase
      .from('qa_jobs')
      .insert([{ status: 'pending', target_urls: urls }]) // (필요하다면 spec_url 컬럼을 추가해 저장해도 좋습니다)
      .select('job_id')
      .single();

    if (dbError) throw new Error('DB 저장 실패');

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_OWNER = process.env.GITHUB_OWNER;
    const GITHUB_REPO = process.env.GITHUB_REPO;

    // 3. 깃허브 Actions에 로봇 출동 명령을 내립니다!
    const githubRes = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/workflows/qa-trigger.yml/dispatches`, {
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
          job_id: jobData.job_id.toString(),
          spec_url: specUrl // ⭐️ 추가됨: 깃허브로 Spec URL 전송!
        }
      })
    });

    if (!githubRes.ok) {
      const errTxt = await githubRes.text();
      console.error('GitHub API 에러:', errTxt);
      throw new Error('GitHub Actions 실행 실패');
    }

    return NextResponse.json({ success: true, jobId: jobData.job_id });

  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}