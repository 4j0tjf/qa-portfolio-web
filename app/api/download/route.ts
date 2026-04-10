// app/api/download/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // 1. 화면에서 보낸 영수증 번호(runId)를 받습니다.
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get('runId');

  if (!runId) {
    return NextResponse.json({ error: 'Run ID가 필요합니다.' }, { status: 400 });
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_OWNER = process.env.GITHUB_OWNER;
  const GITHUB_REPO = process.env.GITHUB_REPO;

  try {
    // 2. 깃허브에 "이 영수증 번호(runId)로 만들어진 파일(Artifact) 목록 좀 보여줘!" 라고 요청합니다.
    const listRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/runs/${runId}/artifacts`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        }
      }
    );

    if (!listRes.ok) throw new Error('아티팩트 목록을 가져오지 못했습니다.');
    
    const listData = await listRes.json();

    if (listData.total_count === 0 || !listData.artifacts || listData.artifacts.length === 0) {
       return NextResponse.json({ error: '로봇이 아직 파일을 만들지 못했습니다.' }, { status: 404 });
    }

    // 3. 목록에서 첫 번째 파일의 진짜 고유 번호(artifact_id)를 찾습니다.
    const artifactId = listData.artifacts[0].id;

    // 4. 고유 번호로 진짜 ZIP 파일을 다운로드합니다. (서버가 대신 받아옵니다)
    const downloadRes = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/actions/artifacts/${artifactId}/zip`,
      {
        headers: {
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        redirect: 'follow' // 깃허브가 주는 임시 다운로드 링크를 끝까지 따라갑니다.
      }
    );

    if (!downloadRes.ok) throw new Error('파일 다운로드에 실패했습니다.');

    // 5. 받아온 ZIP 파일을 그대로 유저의 브라우저로 쏴줍니다!
    const blob = await downloadRes.blob();
    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    // 다운로드될 파일 이름을 예쁘게 지정합니다.
    headers.set('Content-Disposition', `attachment; filename="QA-Report-${runId}.zip"`);

    return new NextResponse(blob, { status: 200, statusText: "OK", headers });
    
  } catch (error) {
    console.error('다운로드 에러:', error);
    return NextResponse.json({ error: '서버 에러가 발생했습니다.' }, { status: 500 });
  }
}