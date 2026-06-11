'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import DocumentPrintView from '../components/DocumentPrintView';

function PrintPageContent() {
  const searchParams = useSearchParams();
  const templateIdStr = searchParams.get('templateId');
  const estimateId = searchParams.get('estimateId') || undefined;
  const logIdStr = searchParams.get('logId');

  if (!templateIdStr) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-400 bg-white">
        <p className="text-base font-bold text-slate-700">올바르지 않은 요청입니다. 양식 ID가 누락되었습니다.</p>
        <button onClick={() => window.close()} className="mt-4 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black cursor-pointer shadow-md">
          창 닫기
        </button>
      </div>
    );
  }

  const templateId = parseInt(templateIdStr);
  const certificateLogId = logIdStr ? parseInt(logIdStr) : undefined;

  return (
    <div className="w-full min-h-screen bg-slate-100 flex justify-center items-start p-0">
      <div className="w-full max-w-full">
        <DocumentPrintView
          templateId={templateId}
          estimateId={estimateId}
          certificateLogId={certificateLogId}
          onBack={() => window.close()}
        />
      </div>
    </div>
  );
}

export default function FormPrintPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center min-h-screen text-slate-400 bg-white">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-xs font-bold text-slate-500">인쇄 미리보기를 준비하는 중...</p>
      </div>
    }>
      <PrintPageContent />
    </Suspense>
  );
}
