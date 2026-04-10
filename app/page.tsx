'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. 내 브라우저(화면)에서 DB를 직접 들여다보기 위한 열쇠 세팅
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const [urlText, setUrlText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);

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

    try {
      // 서버로 로봇 출동 명령 내리기
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

  // 2. ⭐ 핵심 로직: 접수번호가 생기면 3초마다 DB를 몰래 훔쳐보는 마법 (Polling)
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (currentJobId && jobStatus === 'pending') {
      intervalId = setInterval(async () => {
        // DB에서 내 접수번호의 상태(status)만 가져옵니다.
        const { data } = await supabase
          .from('qa_jobs')
          .select('status')
          .eq('job_id', currentJobId)
          .single();

        // 로봇이 'success'나 'failed'로 글자를 바꿨다면?
        if (data && data.status !== 'pending') {
          setJobStatus(data.status);
          setIsLoading(false); // 로봇 일 끝났으니 로딩 버튼 해제
          
          if (data.status === 'success') {
            setResult(`🎉 검사 완료! [접수번호: ${currentJobId}]\n모든 URL이 안전하게 테스트를 통과했습니다! ✅`);
          } else {
            setResult(`🚨 검사 실패! [접수번호: ${currentJobId}]\n테스트 중 에러가 발견되었습니다. GitHub 로봇의 상세 로그를 확인하세요. ❌`);
          }
        }
      }, 3000); // 3000ms = 3초마다 확인
    }

    return () => clearInterval(intervalId); // 화면이 꺼지면 확인 중단
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
            {isLoading ? '🤖 로봇이 꼼꼼하게 검사 중입니다...' : `${urlText.split('\n').filter(u => u.trim() !== '').length}개 페이지 테스트 시작하기`}
          </button>
        </div>

        {result && (
          <div className={`mt-6 p-5 border rounded-xl whitespace-pre-wrap text-center font-medium shadow-inner transition-all duration-500 ${
            jobStatus === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
            jobStatus === 'failed' ? 'bg-red-50 border-red-200 text-red-800' : 
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {result}
          </div>
        )}
      </div>
    </main>
  );
}