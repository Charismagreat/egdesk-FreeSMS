"use client";

import { useLogin } from "./hooks/useLogin";
import { LoginHeader } from "./components/LoginHeader";
import { LoginForm } from "./components/LoginForm";
import { LoginFooter } from "./components/LoginFooter";

// 로그인 메인 페이지 오케스트레이터 컴포넌트
export default function LoginPage() {
  // 로그인 상태 및 핸들러 획득
  const loginState = useLogin();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-700">
        {/* 상단 헤더 영역 */}
        <LoginHeader />
        
        {/* 중앙 폼 입력 영역 */}
        <LoginForm {...loginState} />
      </div>
      
      {/* 하단 푸터 카피라이트 영역 */}
      <LoginFooter />
    </div>
  );
}

