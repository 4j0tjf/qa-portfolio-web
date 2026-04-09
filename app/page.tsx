'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 관리
  const [result, setResult] = useState<string | null>(null); // 결과 메시지 관리

  const handleStartQA = async () => {
    if (!url) {
      alert('URL을 입력해주세요!');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      // 1. 방금 만든 Next.js API로 URL 데이터를 보냅니다.
      const response = await fetch('/api/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      // 2. 서버에서 돌아온 응답을 확인합니다.
      const data = await response.json();

      if (response.ok) {
        setResult(`✅ 성공적으로 접수되었습니다!\n[접수 번호]: ${data.jobId}\n[대상 URL]: ${data.targetUrl}`);
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
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Automated QA Dashboard</h1>
          <p className="text-gray-500">웹페이지 URL을 입력하면 Playwright 로봇이 테스트를 수행합니다.</p>
        </div>

        <div className="flex flex-col gap-4">
          <input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-5 py-4 rounded-xl border-2 border-gray-200 text-lg focus:outline-none focus:border-blue-500 transition-colors"
          />
          
          <button
            onClick={handleStartQA}
            disabled={isLoading}
            className={`w-full text-white font-bold py-4 rounded-xl text-lg transition-colors shadow-md ${
              isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isLoading ? '서버로 전송 중...' : 'QA 시작하기'}
          </button>
        </div>

        {/* 결과창 영역 (result 값이 있을 때만 나타납니다) */}
        {result && (
          <div className="mt-6 p-5 bg-blue-50 border border-blue-100 rounded-xl whitespace-pre-wrap text-center font-medium text-blue-800 shadow-inner">
            {result}
          </div>
        )}

      </div>
    </main>
  );
}