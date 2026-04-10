'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// ⭐️ 본인의 깃허브 정보로 수정해 주세요!
const GITHUB_OWNER = '4j0tjf'; 
const GITHUB_REPO = 'qa-portfolio-web';

export default function Home() {
  const [urlText, setUrlText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  
  // ⭐️ 깃허브 Run ID를 저장할 State 추가
  const [runId, setRunId] = useState<string | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);

  // 다이렉트 다운로드 함수
  const handleDirectDownload = async () => {
    if (!runId) return;
    setIsDownloading(true);
    
    try {
      // 우리가 방금 만든 백엔드 배달부(API)를 호출합니다.
      const response = await fetch(`/api/download?runId=${runId}`);
      if (!response.ok) throw new Error('다운로드 실패');

      // 파일을 덩어리(Blob)로 받아서 내 브라우저에 임시 링크를 만듭니다.
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // 안 보이는 <a> 태그를 몰래 만들어서 강제로 클릭(다운로드) 시킵니다!
      const a = document.createElement('a');
      a.href = url;
      a.download = `QA-Report-${runId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url); // 다 쓴 임시 링크는 청소
      
    } catch (error) {
      alert('파일을 다운로드하는 중 오류가 발생했습니다. 조금 뒤에 다시 시도해주세요.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleStartQA = async () => {
    const urlArray = urlText.split('\n').map(url => url.trim()).filter(url => url !== '');
    if (urlArray.length === 0) {
      alert('최소 1개 이상의 URL을 입력해주세요!');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setCurrentJobId(null);
    setJobStatus('pending');
    setRunId(null); // 시작할 때 초기화

    try {
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlArray }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentJobId(data.jobId);
        setResult(`🚀 로봇 출동 완료! [접수번호: ${data.jobId}]\nGitHub 클라우드에서 테스트가 진행 중입니다. 잠시만 기다려주세요... ⏳`);
      } else {
        setResult(`❌ 오류: ${data.error}`);
        setIsLoading(false);
      }
    } catch (error) {
      setResult('❌ 통신 중 오류가 발생했습니다.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (currentJobId && jobStatus === 'pending') {
      intervalId = setInterval(async () => {
        // ⭐️ DB에서 status와 함께 run_id도 가져옵니다!
        const { data } = await supabase
          .from('qa_jobs')
          .select('status, run_id')
          .eq('job_id', currentJobId)
          .single();

        if (data && data.status !== 'pending') {
          setJobStatus(data.status);
          setRunId(data.run_id); // ⭐️ 가져온 run_id 저장
          setIsLoading(false);
          
          if (data.status === 'success') {
            setResult(`🎉 검사 완료! [접수번호: ${currentJobId}]\n모든 URL이 안전하게 테스트를 통과했습니다! ✅`);
          } else {
            setResult(`🚨 검사 실패! [접수번호: ${currentJobId}]\n테스트 중 에러가 발견되었습니다. 아래 버튼을 눌러 증거물을 확인하세요. ❌`);
          }
        }
      }, 3000);
    }

    return () => clearInterval(intervalId);
  }, [currentJobId, jobStatus]);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-2xl w-full border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Multi-URL QA Dashboard</h1>
          <p className="text-gray-500">여러 개의 URL을 줄바꿈(엔터)으로 구분해서 입력해 주세요.</p>
        </div>

        <div className="flex flex-col gap-4">
          <textarea
            placeholder="https://example.com&#13;&#10;https://example.org"
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            rows={5}
            disabled={isLoading}
            className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 text-base focus:outline-none focus:border-blue-500 transition-colors resize-y disabled:bg-gray-100"
          />
          
          <button
            onClick={handleStartQA}
            disabled={isLoading}
            className={`w-full text-white font-bold py-4 rounded-xl text-lg transition-colors shadow-md ${
              isLoading ? 'bg-indigo-400 animate-pulse cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? '🤖 로봇이 꼼꼼하게 검사 중입니다...' : '테스트 시작하기'}
          </button>
        </div>

        {/* 결과 메시지 표시 영역 */}
        {result && (
          <div className={`mt-6 p-5 border rounded-xl whitespace-pre-wrap text-center font-medium shadow-inner transition-all duration-500 ${
            jobStatus === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
            jobStatus === 'failed' ? 'bg-red-50 border-red-200 text-red-800' : 
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {result}
            
            {/* ⭐️ 작업이 끝났고 run_id가 있다면 다운로드 버튼을 보여줍니다! */}
            {(jobStatus === 'success' || jobStatus === 'failed') && runId && (
              <button 
                onClick={handleDirectDownload}
                disabled={isDownloading}
                className={`mt-4 inline-block font-semibold py-3 px-6 rounded-lg transition-colors shadow-md ${
                  isDownloading 
                  ? 'bg-gray-400 cursor-wait text-white animate-pulse' 
                  : 'bg-gray-800 hover:bg-black text-white'
                }`}
              >
                {isDownloading ? '📥 파일 압축 중...' : '📦 상세 리포트 (ZIP) 다이렉트 다운로드'}
              </button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}