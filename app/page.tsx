'use client';

import { useState } from 'react';

export default function Home() {
  const [urlText, setUrlText] = useState(''); // 여러 줄의 텍스트를 관리
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleStartQA = async () => {
    // 1. 엔터(줄바꿈) 기준으로 텍스트를 쪼개서 배열로 만듭니다. 빈 줄은 제거합니다.
    const urlArray = urlText.split('\n').map(url => url.trim()).filter(url => url !== '');

    if (urlArray.length === 0) {
      alert('최소 1개 이상의 URL을 입력해주세요!');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // 2. 서버로 배열(urlArray)을 통째로 보냅니다.
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: urlArray }), // 'url' -> 'urls' 로 변경
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ 총 ${urlArray.length}개의 URL 접수 완료!\n[접수 번호]: ${data.jobId}\n(GitHub Actions에서 순차적으로 테스트가 진행됩니다.)`);
      } else {
        setResult(`❌ 오류: ${data.error}`);
      }
    } catch (error) {
      setResult('❌ 통신 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-2xl w-full border border-gray-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Multi-URL QA Dashboard</h1>
          <p className="text-gray-500">여러 개의 URL을 줄바꿈(엔터)으로 구분해서 입력해 주세요.</p>
        </div>

        <div className="flex flex-col gap-4">
          {/* input 대신 여러 줄을 입력할 수 있는 textarea 사용 */}
          <textarea
            placeholder="https://example.com&#13;&#10;https://example.org&#13;&#10;(한 줄에 하나씩 입력)"
            value={urlText}
            onChange={(e) => setUrlText(e.target.value)}
            rows={5}
            className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 text-base focus:outline-none focus:border-blue-500 transition-colors resize-y"
          />
          
          <button
            onClick={handleStartQA}
            disabled={isLoading}
            className={`w-full text-white font-bold py-4 rounded-xl text-lg transition-colors shadow-md ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? '로봇 출동 준비 중...' : `${urlText.split('\n').filter(u => u.trim() !== '').length}개 URL 테스트 시작하기`}
          </button>
        </div>

        {result && (
          <div className="mt-6 p-5 bg-blue-50 border border-blue-100 rounded-xl whitespace-pre-wrap text-center font-medium text-blue-800 shadow-inner">
            {result}
          </div>
        )}
      </div>
    </main>
  );
}