import React from "react";
import { Plus } from "lucide-react";
import { OperatorForm as OperatorFormType } from "../types";

interface OperatorFormProps {
  form: OperatorFormType;
  isSubmitting: boolean;
  onUpdateField: (key: keyof OperatorFormType, value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

export function OperatorForm({
  form,
  isSubmitting,
  onUpdateField,
  onSubmit
}: OperatorFormProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
        <Plus className="w-5 h-5 mr-2 text-indigo-500" />
        새 운영자 추가
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">아이디</label>
          <input
            type="text"
            required
            value={form.username}
            onChange={(e) => onUpdateField("username", e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            placeholder="예: staff1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={(e) => onUpdateField("password", e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            placeholder="비밀번호 입력"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">이름/직급</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => onUpdateField("name", e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            placeholder="예: 홍길동 대리"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">권한 등급</label>
          <select
            value={form.role}
            onChange={(e) => onUpdateField("role", e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white text-slate-750 text-slate-800"
          >
            <option value="SUB_OPERATOR">부운영자 (일반 기능만)</option>
            <option value="SUPER_ADMIN">최고관리자 (전체 권한)</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 border-0 cursor-pointer"
        >
          {isSubmitting ? '추가 중...' : '계정 생성'}
        </button>
      </form>
    </div>
  );
}
