import React from "react";
import { Plus, Edit } from "lucide-react";
import { Operator, OperatorForm as OperatorFormType } from "../types";

interface OperatorFormProps {
  form: OperatorFormType;
  isSubmitting: boolean;
  editingOperator: Operator | null;
  onUpdateField: (key: keyof OperatorFormType, value: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onCancelEdit: () => void;
}

export function OperatorForm({
  form,
  isSubmitting,
  editingOperator,
  onUpdateField,
  onSubmit,
  onCancelEdit
}: OperatorFormProps) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
        {editingOperator ? (
          <>
            <Edit className="w-5 h-5 mr-2 text-emerald-500" />
            직원 정보 수정
          </>
        ) : (
          <>
            <Plus className="w-5 h-5 mr-2 text-indigo-500" />
            새 직원 추가
          </>
        )}
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">아이디</label>
          <input
            type="text"
            required
            disabled={!!editingOperator}
            value={form.username}
            onChange={(e) => onUpdateField("username", e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed bg-white"
            placeholder="예: staff1"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호</label>
          <input
            type="password"
            required={!editingOperator}
            value={form.password}
            onChange={(e) => onUpdateField("password", e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
            placeholder={editingOperator ? "변경 시에만 입력" : "비밀번호 입력"}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => onUpdateField("name", e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
            placeholder="예: 홍길동"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">연락처 (휴대폰)</label>
          <input
            type="text"
            value={form.phone}
            onChange={(e) => onUpdateField("phone", e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
            placeholder="예: 01012345678 (숫자만 입력)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            사원번호 <span className="text-xs text-red-500 font-normal">(필수)</span>
          </label>
          <input
            type="text"
            required
            value={form.employee_number}
            onChange={(e) => onUpdateField("employee_number", e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
            placeholder="사원번호 필수 입력 (예: 26-001)"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">권한 등급</label>
          <select
            value={form.role}
            onChange={(e) => onUpdateField("role", e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white text-slate-800 disabled:opacity-50"
            disabled={editingOperator?.username === 'admin'}
          >
            <option value="SUB_OPERATOR">부운영자 (일반 기능만)</option>
            <option value="SUPER_ADMIN">최고관리자 (전체 권한)</option>
            <option value="EMPLOYEE">일반 직원 (모바일 전용)</option>
          </select>
        </div>
        <div className="flex gap-2">
          {editingOperator && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors border border-slate-200 cursor-pointer"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`py-2.5 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 border-0 cursor-pointer ${
              editingOperator ? 'w-2/3 bg-emerald-600 hover:bg-emerald-700' : 'w-full bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isSubmitting
              ? (editingOperator ? '수정 중...' : '추가 중...')
              : (editingOperator ? '정보 수정' : '계정 생성')}
          </button>
        </div>
      </form>
    </div>
  );
}
