'use client';

import React, { useState } from 'react';
import { Database, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

export default function DatabaseInitCard() {
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 데이터베이스 테이블 빌드 및 관리자 생성 원클릭 통합 핸들러
  const handleSystemInitialize = async () => {
    const confirmSetup = window.confirm(
      '⚡ 원클릭 시스템 빌드 및 동기화를 시작하시겠습니까?\n' +
      '이 작업은 필수 데이터베이스 테이블 스키마를 동기화하고, 기본 최고관리자 계정을 자동 주입합니다.'
    );
    if (!confirmSetup) return;

    setLoading(true);
    setMessage(null);

    try {
      // 1단계: 필수 테이블 스키마 생성 및 동기화 (/api/setup)
      const resSetup = await fetch('/api/setup');
      const dataSetup = await resSetup.json();

      if (!dataSetup.success) {
        throw new Error(dataSetup.error || '데이터베이스 테이블 동기화에 실패했습니다.');
      }

      // 2단계: 최고관리자 계정 안전 생성 및 정비 (/api/setup-admin)
      const resAdmin = await fetch('/api/setup-admin');
      const dataAdmin = await resAdmin.json();

      if (!dataAdmin.success) {
        throw new Error(dataAdmin.error || '최고관리자 계정 생성에 실패했습니다.');
      }

      // 성공 피드백 표기
      setMessage({
        type: 'success',
        text: '데이터베이스 테이블 빌드 및 최고관리자 계정(admin) 세팅이 원클릭으로 완벽하게 완료되었습니다! 즉시 서비스를 이용하실 수 있습니다. ⚡🔑'
      });
    } catch (err: any) {
      console.error('System initialization error:', err);
      setMessage({
        type: 'error',
        text: err.message || '시스템 초기화 도중 예상치 못한 오류가 발생했습니다. 다시 시도해 주세요.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md mt-6">
      
      {/* 카드 헤더 */}
      <div className="p-6 flex items-center justify-between bg-gradient-to-r from-slate-50 to-emerald-50/10 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
              데이터베이스 및 시스템 동기화 설정
              <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                원클릭 초기화
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              이지데스크 데이터베이스 필수 테이블 스키마를 생성하고 최고관리자 계정을 원클릭으로 일괄 셋업합니다.
            </p>
          </div>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-100/50 shrink-0">
          시스템 빌더
        </span>
      </div>

      {/* 카드 바디 */}
      <div className="p-6 space-y-5">
        
        {/* 안내 경고 박스 */}
        <div className="bg-amber-50/60 border border-amber-100 p-4.5 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <span className="font-extrabold block">최초 설치 및 신규 컴퓨터 구동 시 필수 확인</span>
            <p className="font-medium leading-relaxed">
              신규 컴퓨터에서 서비스를 처음 시작할 때는 데이터베이스 파일이나 최고관리자 계정이 생성되어 있지 않습니다.
              아래의 <strong>[원클릭 시스템 빌드 및 동기화]</strong> 버튼을 실행하여 기본 구조 구축을 완료해 주십시오. (기존 데이터는 보존되며 누락된 테이블만 안전하게 빌드됩니다.)
            </p>
          </div>
        </div>

        {/* 통합 원클릭 제어 영역 */}
        <div className="bg-slate-50/40 border border-slate-100 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs font-bold text-slate-700 block">이지데스크 통합 빌드 프로세스</span>
            <span className="text-[11px] text-slate-400 font-medium block leading-relaxed max-w-xl">
              클릭 한 번으로 40여 개의 필수 데이터베이스 테이블을 구축하고, 즉시 로그인 및 관리 기능 활용이 가능하도록 최고관리자 마스터 계정(<code>admin</code>) 셋업을 동시에 자동 처리합니다.
            </span>
          </div>

          <div className="flex gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={handleSystemInitialize}
              disabled={loading}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs font-bold transition-all border-0 shadow-sm ${
                loading
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 cursor-pointer'
              }`}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              <span>원클릭 시스템 빌드 및 동기화</span>
            </button>
            <a
              href="/api/setup"
              target="_blank"
              rel="noreferrer"
              className="w-12 h-12 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-55/60 hover:text-slate-700 transition-colors bg-white"
              title="새 창으로 API 직접 실행"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* 처리 결과 피드백 알림 영역 */}
        {message && (
          <div
            className={`flex items-start gap-2.5 p-4 rounded-xl border text-xs font-semibold animate-fadeIn ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                : 'bg-rose-50 border-rose-100 text-rose-800'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{message.text}</span>
          </div>
        )}

      </div>
    </div>
  );
}
