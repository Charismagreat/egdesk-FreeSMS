import React from "react";
import { Compass, UserCheck } from "lucide-react";

interface HeaderProps {
  currentUser: string;
  setCurrentUser: (val: string) => void;
  currentRole: "SUPER_ADMIN" | "PRESIDENT" | "SUB_OPERATOR";
  setCurrentRole: (val: "SUPER_ADMIN" | "PRESIDENT" | "SUB_OPERATOR") => void;
  currentDept: string;
  setCurrentDept: (val: string) => void;
}

export function Header({
  currentRole,
  setCurrentUser,
  setCurrentRole,
  currentDept,
  setCurrentDept,
}: HeaderProps) {
  return (
    <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center">
          <Compass className="w-8 h-8 text-slate-500 mr-3 animate-spin-slow" />
          지식 관리 AI
        </h1>
        <p className="text-slate-500 mt-2">
          비정형 문서의 결재 이력 감사 및 Zero-Trust 사내 지식 RAG 분석을 관제합니다.
        </p>
      </div>

      {/* 데모용 세션 계정 모의 조작 패널 */}
      <div className="flex flex-wrap items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 text-xs shadow-sm self-start">
        <span className="text-slate-500 font-semibold flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5" /> 권한:
        </span>
        <button
          onClick={() => {
            setCurrentUser("ceo_park");
            setCurrentRole("SUPER_ADMIN");
            setCurrentDept("STRATEGY");
          }}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            currentRole === "SUPER_ADMIN" ? "bg-rose-500 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          id="btn-session-admin"
        >
          최고관리자 (대표)
        </button>
        <button
          onClick={() => {
            setCurrentUser("sales_manager");
            setCurrentRole("SUB_OPERATOR");
            setCurrentDept("SALES");
          }}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            currentRole === "SUB_OPERATOR" && currentDept === "SALES" ? "bg-blue-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          id="btn-session-sales"
        >
          영업부서장
        </button>
        <button
          onClick={() => {
            setCurrentUser("rnd_engineer");
            setCurrentRole("SUB_OPERATOR");
            setCurrentDept("RND");
          }}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
            currentRole === "SUB_OPERATOR" && currentDept === "RND" ? "bg-cyan-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
          id="btn-session-rnd"
        >
          일반사원
        </button>
      </div>
    </div>
  );
}
