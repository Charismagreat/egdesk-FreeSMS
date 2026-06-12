import React from "react";
import { WebTemplate } from "../types";
import { FileText, ChevronRight, Award, Landmark, Sparkles } from "lucide-react";

interface MobileFormSelectorProps {
  templates: WebTemplate[];
  onSelect: (template: WebTemplate) => void;
}

export default function MobileFormSelector({ templates, onSelect }: MobileFormSelectorProps) {
  // 문서 유형에 어울리는 테마 메타 데이터 반환
  const getDocumentTheme = (type: string) => {
    const docType = (type || "").toLowerCase();
    if (docType.includes("employment") || docType.includes("재직")) {
      return {
        icon: FileText,
        bgColor: "bg-blue-50 text-blue-600 border-blue-100",
        label: "인사/재직"
      };
    }
    if (docType.includes("career") || docType.includes("경력")) {
      return {
        icon: Award,
        bgColor: "bg-purple-50 text-purple-600 border-purple-100",
        label: "경력/포상"
      };
    }
    if (docType.includes("license") || docType.includes("사업자")) {
      return {
        icon: Landmark,
        bgColor: "bg-emerald-50 text-emerald-600 border-emerald-100",
        label: "인허가/기업"
      };
    }
    return {
      icon: Sparkles,
      bgColor: "bg-amber-50 text-amber-600 border-amber-100",
      label: "기타 양식"
    };
  };

  return (
    <div className="space-y-4 text-left">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1.5 h-3.5 bg-indigo-500 rounded-full"></span>
          발급 가능 서류 양식
        </h2>
        <span className="text-[10px] text-slate-400 font-bold font-mono">
          {templates.length} Active Templates
        </span>
      </div>

      {templates.length === 0 ? (
        <div className="py-16 text-center text-[10px] font-bold text-slate-400 bg-white rounded-2xl border border-slate-200">
          현재 발급 가능한 웹 양식 서류가 등록되어 있지 않습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {templates.map(template => {
            const theme = getDocumentTheme(template.template_name || template.document_type);
            const Icon = theme.icon;
            
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                type="button"
                className="w-full bg-white border border-slate-150 hover:border-indigo-200 rounded-2xl p-4 flex items-center justify-between text-left shadow-2xs hover:shadow-xs hover:bg-slate-50/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${theme.bgColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <span className="inline-block text-[8px] font-black text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.2 rounded-md">
                      {theme.label}
                    </span>
                    <h3 className="text-xs font-black text-slate-800 truncate group-hover:text-indigo-650 transition-colors">
                      {template.template_name}
                    </h3>
                    <p className="text-[9px] text-slate-400 font-bold truncate">
                      발급처: {template.updated_by || "시스템 관리자"} | 수정일: {template.updated_at.substring(0, 10)}
                    </p>
                  </div>
                </div>
                
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
