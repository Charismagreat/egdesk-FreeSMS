import React from "react";
import { ShieldAlert, ShieldCheck, Trash2, Edit2, FileText, PenTool } from "lucide-react";
import { Operator } from "../types";

interface OperatorTableProps {
  isLoading: boolean;
  operators: Operator[];
  onDelete: (id: number) => Promise<void>;
  onEdit: (op: Operator) => void;
  onAnalyzeContract: (op: Operator) => void;
  onContractRequest: (op: Operator) => void;
}

export function OperatorTable({
  isLoading,
  operators,
  onDelete,
  onEdit,
  onAnalyzeContract,
  onContractRequest
}: OperatorTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 text-sm">
            <th className="p-4 font-semibold text-slate-600">이름</th>
            <th className="p-4 font-semibold text-slate-600">사원번호</th>
            <th className="p-4 font-semibold text-slate-600">아이디</th>
            <th className="p-4 font-semibold text-slate-600">연락처</th>
            <th className="p-4 font-semibold text-slate-600">권한</th>
            <th className="p-4 font-semibold text-slate-600">생성일</th>
            <th className="p-4 font-semibold text-slate-600 text-center">관리</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {isLoading ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-slate-400">불러오는 중...</td>
            </tr>
          ) : operators.length === 0 ? (
            <tr>
              <td colSpan={7} className="p-8 text-center text-slate-400">등록된 직원이 없습니다.</td>
            </tr>
          ) : (
            operators.map((op) => (
              <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-800">{op.name}</td>
                <td className="p-4 text-slate-600 font-mono">{op.employee_number || "-"}</td>
                <td className="p-4 text-slate-600">{op.username}</td>
                <td className="p-4 text-slate-600">{op.phone || "-"}</td>
                <td className="p-4">
                  {op.role === 'SUPER_ADMIN' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      <ShieldAlert className="w-3 h-3 mr-1" />
                      최고관리자
                    </span>
                  ) : op.role === 'EMPLOYEE' ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      일반 직원
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <ShieldCheck className="w-3 h-3 mr-1" />
                      부운영자
                    </span>
                  )}
                </td>
                <td className="p-4 text-slate-500 text-sm">
                  {new Date(op.created_at).toLocaleDateString()}
                </td>
                <td className="p-4 text-center">
                  <button
                    type="button"
                    onClick={() => onAnalyzeContract(op)}
                    className="p-2 text-slate-400 hover:text-indigo-500 transition-colors border-0 bg-transparent cursor-pointer mr-1"
                    title="근로계약 AI 분석 및 등록"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onContractRequest(op)}
                    className="p-2 text-slate-400 hover:text-indigo-500 transition-colors border-0 bg-transparent cursor-pointer mr-1"
                    title="근로계약 모바일 서명 요청 발송"
                  >
                    <PenTool className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit(op)}
                    disabled={op.username === 'admin'}
                    className="p-2 text-slate-400 hover:text-indigo-500 transition-colors disabled:opacity-20 border-0 bg-transparent cursor-pointer mr-1"
                    title="정보 수정"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(op.id)}
                    disabled={op.username === 'admin'}
                    className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-20 border-0 bg-transparent cursor-pointer"
                    title="계정 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
