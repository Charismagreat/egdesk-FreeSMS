"use client";

import React from "react";
import { useOperators } from "./hooks/useOperators";
import { OperatorHeader } from "./components/OperatorHeader";
import { OperatorForm } from "./components/OperatorForm";
import { OperatorTable } from "./components/OperatorTable";

export default function OperatorsPage() {
  const {
    operators,
    isLoading,
    form,
    isSubmitting,
    updateForm,
    handleAddOperator,
    handleDelete
  } = useOperators();

  return (
    <div className="w-full space-y-6 pb-20 min-w-0 font-sans text-slate-800 animate-fade-in text-left" data-easybot-hint="운영자 관리: 이지데스크 플랫폼에 접근할 수 있는 사내 서브 운영자 계정 추가 및 접근 권한을 관리합니다.">
      {/* 운영자 관리 헤더 영역 */}
      <OperatorHeader />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 새 운영자 추가 폼 영역 */}
        <div className="lg:col-span-1">
          <OperatorForm 
            form={form}
            isSubmitting={isSubmitting}
            onUpdateField={updateForm}
            onSubmit={handleAddOperator}
          />
        </div>

        {/* 운영자 목록 테이블 영역 */}
        <div className="lg:col-span-2">
          <OperatorTable 
            isLoading={isLoading}
            operators={operators}
            onDelete={handleDelete}
          />
        </div>
      </div>
    </div>
  );
}
