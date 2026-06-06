import { useState, useEffect, useCallback } from "react";
import { EmployeeLaborStat, LaborAuditSummary, EmployeeContract } from "../types";

export function useLaborManagement() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuditing, setIsAuditing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "warn" } | null>(null);

  const [stats, setStats] = useState<EmployeeLaborStat[]>([]);
  const [summary, setSummary] = useState<LaborAuditSummary | null>(null);
  const [contracts, setContracts] = useState<Record<string, EmployeeContract>>({});

  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" | "warn" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // 1. 노무 통계 데이터 조회 (GET)
  const fetchLaborData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/production/labor");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setSummary(data.summary);
        setContracts(data.contracts);
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      console.error("노무 정보 수집 실패:", e);
      showToast("근로기준법 감사 데이터를 가져오는 데 실패했습니다.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchLaborData();
  }, [fetchLaborData]);

  // 2. 실시간 근태 재스캔 및 AI 노무 진단 실행 (POST)
  const handleGenerateAudit = async () => {
    setIsAuditing(true);
    try {
      const res = await fetch("/api/production/labor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_audit",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setSummary(data.summary);
        setContracts(data.contracts);
        showToast(data.message, "success");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`노무 재진단 실패: ${e.message}`, "error");
    } finally {
      setIsAuditing(false);
    }
  };

  // 3. 독소 계약 조항에 대한 AI 합법 조항 대체 보정 (POST)
  const handleRemediateClause = async (employeeId: string, clauseId: string) => {
    try {
      const res = await fetch("/api/production/labor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "remediate_clause",
          employeeId,
          clauseId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setSummary(data.summary);
        setContracts(data.contracts);
        showToast(data.message, "success");
      } else {
        throw new Error(data.error);
      }
    } catch (e: any) {
      showToast(`계약 조항 보정 실패: ${e.message}`, "error");
    }
  };

  // 4. 보정된 표준 근로계약서 인쇄/원고 출력 핸들러
  const handlePrintContract = () => {
    if (!selectedEmployeeId || !contracts[selectedEmployeeId]) {
      showToast("출력할 임직원 근로계약서가 선택되지 않았습니다.", "warn");
      return;
    }
    const currentContract = contracts[selectedEmployeeId];
    const printWindow = window.open("", "_blank");

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>표준근로계약서 - ${currentContract.employeeName}</title>
            <style>
              body {
                font-family: 'Malgun Gothic', sans-serif;
                padding: 40px;
                color: #334155;
                line-height: 1.8;
              }
              .container {
                max-width: 700px;
                margin: 0 auto;
                border: 1px solid #cbd5e1;
                padding: 30px;
                border-radius: 8px;
              }
              h2 {
                text-align: center;
                margin-bottom: 30px;
                font-size: 24px;
                font-weight: bold;
                letter-spacing: 0.1em;
              }
              .section-title {
                font-size: 14px;
                font-weight: bold;
                margin-top: 20px;
                border-bottom: 2px solid #64748b;
                padding-bottom: 5px;
              }
              .content {
                font-size: 12px;
                white-space: pre-wrap;
                margin: 10px 0;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
              }
              .signatures {
                display: flex;
                justify-content: space-between;
                margin-top: 35px;
                font-weight: bold;
              }
              @media print {
                body { padding: 0; }
                .container { border: none; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h2>표 준 근 로 계 약 서</h2>
              <p style="font-size: 12px; text-align: center;">본 계약은 이지데스크 노무 관리 AI 비서의 조항 감사를 거쳐 법적 무결성이 수호된 근로 합의서입니다.</p>
              
              <p style="font-size: 12px; font-weight: bold; margin-top: 20px;">
                사업주(갑): (주)이지텍스타일 대표자<br/>
                근로자(을): ${currentContract.employeeName}
              </p>

              ${currentContract.clauses.map((cl: any) => `
                <div class="section-title">${cl.title}</div>
                <div class="content">${cl.currentText}</div>
              `).join("")}

              <div class="section-title">기타 준용 조항</div>
              <div class="content">본 계약서에 명시되지 않은 사항은 근로기준법 및 관련 노동관계법령, 그리고 당사의 사내 취업규칙이 정하는 바에 의한다.</div>

              <div class="signatures">
                <div>사업주 (갑): __________________ (인)</div>
                <div>근로자 (을): ${currentContract.employeeName} (인)</div>
              </div>
              
              <div class="footer">
                계약일자: 2026년 06월 07일
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
      showToast("근로계약서 인쇄 미리보기가 새 탭에 생성되었습니다.", "success");
    }
  };

  return {
    isLoading,
    isAuditing,
    toast,
    stats,
    summary,
    contracts,
    selectedEmployeeId,
    handleGenerateAudit,
    handleRemediateClause,
    handlePrintContract,
    setSelectedEmployeeId,
  };
}
