"use client";

import React, { useState } from "react";
import { useOperators } from "./hooks/useOperators";
import { OperatorHeader } from "./components/OperatorHeader";
import { OperatorForm } from "./components/OperatorForm";
import { OperatorTable } from "./components/OperatorTable";
import { ContractAnalyzerModal } from "./components/ContractAnalyzerModal";
import { ContractRequestModal } from "./components/ContractRequestModal";
import { Operator } from "./types";

export default function OperatorsPage() {
  const {
    operators,
    isLoading,
    form,
    editingOperator,
    isSubmitting,
    updateForm,
    handleAddOperator,
    handleDelete,
    startEdit,
    cancelEdit
  } = useOperators();

  const [activeAnalysisOperator, setActiveAnalysisOperator] = useState<Operator | null>(null);
  const [activeRequestOperator, setActiveRequestOperator] = useState<Operator | null>(null);

  return (
    <div className="w-full space-y-6 pb-20 min-w-0 font-sans text-slate-800 animate-fade-in text-left" data-easybot-hint="직원 관리: 이지데스크 플랫폼에 접근할 수 있는 사내 서브 운영자 및 일반 직원 계정을 추가하고 접근 권한을 관리합니다.">
      {/* 직원 관리 헤더 영역 */}
      <OperatorHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 새 직원 추가 및 정보 수정 폼 영역 */}
        <div className="lg:col-span-1">
          <OperatorForm 
            form={form}
            isSubmitting={isSubmitting}
            editingOperator={editingOperator}
            onUpdateField={updateForm}
            onSubmit={handleAddOperator}
            onCancelEdit={cancelEdit}
          />
        </div>

        {/* 직원 목록 테이블 영역 */}
        <div className="lg:col-span-2">
          <OperatorTable 
            isLoading={isLoading}
            operators={operators}
            onDelete={handleDelete}
            onEdit={startEdit}
            onAnalyzeContract={(op) => setActiveAnalysisOperator(op)}
            onContractRequest={(op) => setActiveRequestOperator(op)}
          />
        </div>
      </div>

      {/* 근로계약서 AI 분석 모달 */}
      {activeAnalysisOperator && (
        <ContractAnalyzerModal 
          operator={activeAnalysisOperator}
          onClose={() => setActiveAnalysisOperator(null)}
        />
      )}

      {/* 근로계약 모바일 서명 요청 모달 */}
      {activeRequestOperator && (
        <ContractRequestModal 
          operator={activeRequestOperator}
          onClose={() => setActiveRequestOperator(null)}
        />
      )}
    </div>
  );
}
