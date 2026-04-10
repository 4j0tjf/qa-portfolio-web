'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const GITHUB_OWNER = '4j0tjf'; 
const GITHUB_REPO = 'qa-portfolio-web';

export default function Home() {
  // 👇 새로 추가된 상태 (Spec URL을 저장합니다)
  const [specUrl, setSpecUrl] = useState('');
  
  const [urlText, setUrlText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [runId, setRunId] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleStartQA = async () => {
    const urlArray = urlText.split('\n').map(url => url.trim()).filter(url => url !== '');
    
    // 👇 검증 로직 추가: Spec URL과 타겟 URL이 모두 있는지 확인합니다.
    if (!specUrl.trim()) {
      alert('기준이 될 Spec URL을 먼저 입력해주세요!');
      return;
    }
    if (urlArray.length === 0) {
      alert('최소 1개 이상의 타겟 URL을 입력해주세요!');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setCurrentJobId(null);
    setJobStatus('pending');
    setRunId(null);

    try {
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // ⭐️ 기존에는 urls만 보냈지만, 이제 specUrl도 함께 포장해서 API로 보냅니다!
        body: JSON.stringify({ specUrl: specUrl.trim(), urls: urlArray }),
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
        const { data } = await supabase
          .from('qa_jobs')
          .select('status, run_id')
          .eq('job_id', currentJobId)
          .single();

        if (data && data.status !== 'pending') {
          setJobStatus(data.status);
          setRunId(data.run_id);
          setIsLoading(false);
          
          if (data.status === 'success') {
            // 텍스트를 VRT 툴에 맞게 조금 더 멋지게 수정했습니다.
            setResult(`🎉 검사 완료! [접수번호: ${currentJobId}]\n모든 타겟 URL이 기준(Spec) 디자인과 완벽하게 일치합니다! ✅`);
          } else {
            setResult(`🚨 검사 실패! [접수번호: ${currentJobId}]\n디자인이 다른 부분이 발견되었습니다. 아래 버튼을 눌러 증거물을 확인하세요. ❌`);
          }
        }
      }, 3000);
    }

    return () => clearInterval(intervalId);
  }, [currentJobId, jobStatus]);

  const handleDirectDownload = async () => {
    if (!runId) return;
    setIsDownloading(true);
    
    try {
      const response = await fetch(`/api/download?runId=${runId}`);
      if (!response.ok) throw new Error('다운로드 실패');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `QA-Report-${runId}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      alert('파일을 다운로드하는 중 오류가 발생했습니다. 조금 뒤에 다시 시도해주세요.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-2xl w-full border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Dynamic VRT Dashboard</h1>
          <p className="text-gray-500">기준이 되는 Spec URL과 검사할 타겟 URL들을 입력해 주세요.</p>
        </div>

        <div className="flex flex-col gap-5">
          
          {/* 👇 새로 추가된 [기준 Spec URL] 입력 영역! */}
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
            <label className="block text-sm font-bold text-indigo-900 mb-2">
              🎯 기준(Spec) URL (정답지)
            </label>
            <input
              type="url"
              placeholder="https://example.com"
              // 👇 이 두 줄이 specUrl 로 되어 있는지 확인해 주세요!
              value={specUrl} 
              onChange={(e) => setSpecUrl(e.target.value)}
              disabled={isLoading}
              className="w-full px-5 py-3 rounded-lg border-2 border-indigo-200 focus:outline-none focus:border-indigo-500 transition-colors disabled:bg-gray-100 bg-white text-gray-900 placeholder-gray-400 font-medium"
            />
          </div>

          {/* 기존 타겟 URL 입력 영역 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              🔍 검사할 타겟 URL 목록 (엔터로 구분)
            </label>
            <textarea
              placeholder="https://example.org&#13;&#10;https://example.net"
              // 👇 이 두 줄이 urlText 로 되어 있는지 확인해 주세요! (여기가 specUrl로 덮어씌워졌을 확률이 99%입니다)
              value={urlText} 
              onChange={(e) => setUrlText(e.target.value)}
              rows={4}
              disabled={isLoading}
              className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 text-base focus:outline-none focus:border-blue-500 transition-colors resize-y disabled:bg-gray-100 bg-white text-gray-900 placeholder-gray-400 font-medium"
            />
          </div>
          
          <button
            onClick={handleStartQA}
            disabled={isLoading}
            className={`w-full text-white font-bold py-4 rounded-xl text-lg transition-colors shadow-md mt-2 ${
              isLoading ? 'bg-indigo-400 animate-pulse cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? '🤖 실시간 A/B 픽셀 비교 중...' : '동적 테스트 시작하기'}
          </button>
        </div>

        {/* 결과 및 다운로드 버튼 영역 (기존과 동일) */}
        {result && (
          <div className={`mt-6 p-5 border rounded-xl whitespace-pre-wrap text-center font-medium shadow-inner transition-all duration-500 ${
            jobStatus === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 
            jobStatus === 'failed' ? 'bg-red-50 border-red-200 text-red-800' : 
            'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            {result}
            
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