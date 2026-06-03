'use client';

import React, { useState } from 'react';
import { Database, ShieldAlert, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';

export default function DatabaseInitCard() {
  const [dbLoading, setDbLoading] = useState<boolean>(false);
  const [adminLoading, setAdminLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. DB 초기화 API 호출 (/api/setup)
  const handleDbSetup = async () => {
    setDbLoading(true);
    setMessage(null);
    try {
      const res = await fetch('/api/setup');
      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: data.message || '데이터베이스 테이블 스키마가 완벽히 동기화 및 재생성되었습니다! ⚡'
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || '데이터베이스 초기화 도중 오류가 발생했습니다.'
        });
      }
    } catch (err: any) {
      console.error('DB setup fetch error:', err);
      setMessage({
        type: 'error',
        text: '서버와 통신하는 중 네트워크 오류가 발생했습니다.'
      });
    } finally {
      setDbLoading(false);
    }
  };

  // 2. 최고관리자 생성 API 호출 (/api/setup-admin)
  const handleAdminSetup = (force: boolean) => async () => {
    setAdminLoading(true);
    setMessage(null);
    try {
      const url = `/api/setup-admin${force ? '?force=true' : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setMessage({
          type: 'success',
          text: data.message || '최고관리자 계정(admin / admin123)이 정상적으로 세팅되었습니다! 🔑'
        });
      } else {
        setMessage({
          type: 'error',
          text: data.error || '관리자 계정 생성 도중 오류가 발생했습니다.'
        });
      }
    } catch (err: any) {
      console.error('Admin setup fetch error:', err);
      setMessage({
        type: 'error',
        text: '서버와 통신하는 중 네트워크 오류가 발생했습니다.'
      });
    } finally {
      setAdminLoading(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      
      {/* 카드 헤더 */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-emerald-50/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-sm shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
              데이터베이스 초기 설정 및 동기화
              <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">
                최초 1회 필수
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              이지데스크 서비스 호스팅 시 데이터베이스 구조를 원클릭으로 정렬하고 최고관리자 계정을 셋업합니다.
            </p>
          </div>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-100/50">
          시스템 빌더
        </span>
      </div>

      <div className="p-6 space-y-6">
        
        {/* 안내 경고 박스 */}
        <div className="bg-amber-50/60 border border-amber-100 p-4.5 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 space-y-1">
            <span className="font-extrabold block">깃허브에서 프로젝트를 새로 복사(Clone)한 경우 안내</span>
            <p className="font-medium leading-relaxed">
              서버를 처음 구동한 상대방 PC에는 이지데스크 테이블 스키마가 존재하지 않거나 관리자 계정이 비어 있습니다.
              아래의 초기화 도구 버튼을 클릭해 <strong>최초 1회 반드시 테이블 구조 정렬 및 최고관리자 생성</strong>을 진행해 주셔야 정상적인 서비스 이용이 가능합니다.
            </p>
          </div>
        </div>

        {/* 제어 도구 버튼 영역 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. DB 스키마 셋업 */}
          <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/30 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-700 block">1단계: DB 물리 테이블 빌드</span>
              <span className="text-[11px] text-slate-400 font-medium block mt-1 leading-relaxed">
                이지데스크가 참조하는 로컬 물리 데이터베이스 파일에 40여 개의 필수 비즈니스 테이블 구조를 자동 매핑하여 동기화합니다.
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDbSetup}
                disabled={dbLoading || adminLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-0 shadow-sm ${
                  dbLoading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-emerald-600 text-white hover:bg-emerald-500 active:scale-95 cursor-pointer'
                }`}
              >
                {dbLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
                <span>DB 테이블 생성 및 동기화</span>
              </button>
              <a
                href="/api/setup"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                title="새 창으로 API 직접 실행"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* 2. 최고관리자 셋업 */}
          <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/30 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-700 block">2단계: 최고관리자 계정 생성</span>
              <span className="text-[11px] text-slate-400 font-medium block mt-1 leading-relaxed">
                시스템 최초 로그인 및 전체 관리에 필요한 마스터 계정(<code>admin</code> / <code>admin123</code>)을 생성합니다.
              </span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAdminSetup(false)}
                disabled={dbLoading || adminLoading}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border-0 shadow-sm ${
                  adminLoading
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95 cursor-pointer'
                }`}
              >
                {adminLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <span>🔑</span>}
                <span>기본 최고관리자 생성</span>
              </button>
              <button
                type="button"
                onClick={handleAdminSetup(true)}
                disabled={dbLoading || adminLoading}
                className="px-3 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-bold active:scale-95 transition-all"
                title="기존 계정 제거 후 재설정"
              >
                강제 초기화
              </button>
              <a
                href="/api/setup-admin"
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors"
                title="새 창으로 API 직접 실행"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

        </div>

        {/* 처리 결과 알림 피드백 영역 */}
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
