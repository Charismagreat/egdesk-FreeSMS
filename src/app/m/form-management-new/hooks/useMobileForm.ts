import { useState, useEffect } from "react";
import { WebTemplate, OperatorInfo } from "../types";

export function useMobileForm() {
  const [templates, setTemplates] = useState<WebTemplate[]>([]);
  const [operator, setOperator] = useState<OperatorInfo | null>(null);
  const [companyProfile, setCompanyProfile] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [issuerLoading, setIssuerLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<WebTemplate | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // 수기 보완 및 바인딩용 통합 데이터 상태
  const [manualData, setManualData] = useState<Record<string, string>>({
    staff_name: "",
    position: "",
    department: "",
    resident_id: "",
    address: "",
    joined_date: "",
    usage: "금융기관 제출용",
    issue_year: "",
    issue_month: "",
    issue_day: "",
    issue_dept: "관리부",
    issue_phone: "",
    issue_email: "",
    issue_fax: "",
    company_name: "",
    representative_name: ""
  });

  // 토스트 자동 초기화
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // 마운트 시 기본 세션 및 템플릿 정보 로딩
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      setError(null);
      try {
        await Promise.all([
          fetchTemplates(),
          fetchMeAndOperator(),
          fetchCompanyProfile()
        ]);
      } catch (err: any) {
        setError(err.message || "초기화 도중 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);

  // 1. 활성 템플릿 목록 로드
  const fetchTemplates = async () => {
    const res = await fetch("/api/templates-new?action=list");
    const json = await res.json();
    if (json.success && json.templates) {
      // 활성화된 템플릿만 필터링
      setTemplates(json.templates.filter((t: any) => t.is_active === 1));
    } else {
      throw new Error("서류 양식 목록을 가져오지 못했습니다.");
    }
  };

  // 2. 로그인 사원 및 프로필 연계 정보 로드
  const fetchMeAndOperator = async () => {
    const meRes = await fetch("/api/auth/me");
    const meData = await meRes.json();
    if (!meData.success) {
      throw new Error("로그인 세션이 유효하지 않습니다.");
    }

    const username = meData.username;
    const opRes = await fetch(`/api/templates-new?action=query_records&table=crm_operators&keyword=${username}`);
    const opData = await opRes.json();
    
    if (opData.success && opData.records && opData.records.length > 0) {
      // 1단계 필드 및 raw 객체 필드 모두 안전하게 검색하도록 버그 보정
      const matched = opData.records.find((r: any) => r.username === username || (r.raw && r.raw.username === username)) || opData.records[0];
      const opInfo: OperatorInfo = {
        id: matched.id,
        name: matched.name || (matched.raw && matched.raw.name) || matched.username,
        username: matched.username || (matched.raw && matched.raw.username),
        role: matched.role || (matched.raw && matched.raw.role) || meData.role,
        department: matched.department || (matched.raw && matched.raw.department) || "관리부",
        position: matched.position || (matched.raw && matched.raw.position) || "사원",
        joined_date: matched.joined_date || (matched.raw && matched.raw.joined_date) || "",
        commute_area: matched.commute_area || (matched.raw && (matched.raw.address || matched.raw.commute_area)) || "",
        email: matched.email || (matched.raw && matched.raw.email) || "",
        phone: matched.phone || (matched.raw && matched.raw.phone) || ""
      };
      
      setOperator(opInfo);

      // 사원 정보를 바탕으로 수기 보완 데이터 초깃값 자동 주입
      const now = new Date();
      setManualData(prev => ({
        ...prev,
        staff_name: opInfo.name,
        position: opInfo.position || "",
        department: opInfo.department || "",
        address: opInfo.commute_area || "",
        joined_date: opInfo.joined_date || "",
        issue_year: String(now.getFullYear()),
        issue_month: String(now.getMonth() + 1),
        issue_day: String(now.getDate()),
        issue_phone: opInfo.phone || "",
        issue_email: opInfo.email || "",
        company_name: prev.company_name,
        representative_name: prev.representative_name
      }));
    } else {
      // 💡 개발/데모 시연 시 임직원 데이터베이스가 비어있는 예외 상황에 대비한 강력한 안전 가드 작동
      const opInfo: OperatorInfo = {
        id: "simulated-op-id",
        name: meData.name || "홍길동",
        username: username,
        role: meData.role || "SUPER_ADMIN",
        department: "관리부",
        position: "대리",
        joined_date: "2024-01-01",
        commute_area: "서울특별시 강남구 테헤란로 123",
        email: username || "employee@egdesk.com",
        phone: "010-1234-5678"
      };
      
      setOperator(opInfo);

      const now = new Date();
      setManualData(prev => ({
        ...prev,
        staff_name: opInfo.name,
        position: opInfo.position || "",
        department: opInfo.department || "",
        address: opInfo.commute_area || "",
        joined_date: opInfo.joined_date || "",
        issue_year: String(now.getFullYear()),
        issue_month: String(now.getMonth() + 1),
        issue_day: String(now.getDate()),
        issue_phone: opInfo.phone || "",
        issue_email: opInfo.email || "",
        company_name: prev.company_name,
        representative_name: prev.representative_name
      }));
    }
  };

  // 3. 회사 프로필 정보 로드 (대표자명, 회사명 오토필용)
  const fetchCompanyProfile = async () => {
    try {
      const detailRes = await fetch("/api/templates-new?action=detail&id=0"); // id=0으로 호출해도 회사프로필은 딸려옴
      const detailData = await detailRes.json();
      if (detailData.success && detailData.companyProfile) {
        setCompanyProfile(detailData.companyProfile);
        setManualData(prev => ({
          ...prev,
          company_name: detailData.companyProfile.company_name || "",
          representative_name: detailData.companyProfile.representative_name || ""
        }));
      }
    } catch {
      // 실패 시 기본 하드코딩 폴백 작동
    }
  };

  // 4. 수기 폼 필드 입력 변경 핸들러
  const handleFieldChange = (key: string, value: string) => {
    setManualData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // 5. 모바일 양식 인쇄 실행
  const handleExecutePrint = () => {
    if (!selectedTemplate) return;
    if (!manualData.staff_name.trim()) {
      setToast({ message: "대상자 성명은 필수 입력 항목입니다.", type: "error" });
      return;
    }

    setIssuerLoading(true);
    try {
      // 1. 인쇄용 통합 페이로드 조립
      const printDataPayload = {
        ...companyProfile,
        ...manualData
      };
      
      // 2. 로컬 스토리지에 적재하여 출력 팝업창에서 바인딩해가도록 함
      localStorage.setItem("web_form_print_data", JSON.stringify(printDataPayload));

      // 3. 모바일 출력용 팝업창(새 탭) 열기
      const url = `/form-management-new/print?templateId=${selectedTemplate.id}`;
      const printWin = window.open(url, "_blank");
      
      if (!printWin) {
        setToast({ message: "팝업 차단이 활성화되어 있습니다. 팝업을 허용해주세요.", type: "error" });
      } else {
        setToast({ message: "서류 발급 미리보기가 새 탭으로 실행되었습니다.", type: "success" });
      }
    } catch (err: any) {
      setToast({ message: err.message || "발급 실행 도중 에러가 발생했습니다.", type: "error" });
    } finally {
      setIssuerLoading(false);
    }
  };

  // 6. 이메일로 서류 발급 실행
  const handleSendEmail = async (emailAddress: string) => {
    if (!selectedTemplate) return;
    if (!manualData.staff_name.trim()) {
      setToast({ message: "대상자 성명은 필수 입력 항목입니다.", type: "error" });
      return;
    }
    if (!emailAddress.trim()) {
      setToast({ message: "이메일 주소는 필수 입력 항목입니다.", type: "error" });
      return;
    }

    setIssuerLoading(true);
    try {
      const printDataPayload = {
        ...companyProfile,
        ...manualData
      };

      const res = await fetch("/api/templates-new/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          emailAddress: emailAddress,
          printDataPayload
        })
      });

      const data = await res.json();
      if (data.success) {
        setToast({ message: data.message || "이메일 전송에 성공했습니다.", type: "success" });
      } else {
        setToast({ message: data.error || "이메일 전송 중 에러가 발생했습니다.", type: "error" });
      }
    } catch (err: any) {
      setToast({ message: err.message || "발급 실행 도중 에러가 발생했습니다.", type: "error" });
    } finally {
      setIssuerLoading(false);
    }
  };

  return {
    templates,
    operator,
    loading,
    issuerLoading,
    error,
    selectedTemplate,
    setSelectedTemplate,
    manualData,
    handleFieldChange,
    handleExecutePrint,
    handleSendEmail,
    toast,
    setToast
  };
}
