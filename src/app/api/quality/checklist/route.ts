import { NextResponse } from "next/server";

// 모의 데이터베이스 저장 리스트
let MOCK_CHECKLIST_SUBMISSIONS: any[] = [];

// GET: 제출된 모바일 체크리스트 목록 조회
export async function GET() {
  return NextResponse.json({
    success: true,
    submissions: MOCK_CHECKLIST_SUBMISSIONS,
  });
}

// POST: 신규 모바일 품질 검사 체크리스트 접수
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lotNo, inspector, checkItems, signatureData, photoUrl, status } = body;

    if (!lotNo || !inspector || !checkItems) {
      return NextResponse.json({ success: false, error: "필수 입력 항목(Lot 번호, 검사원, 검사 항목)이 누락되었습니다." }, { status: 400 });
    }

    const newSubmission = {
      id: `CHK-${Date.now()}`,
      lotNo,
      inspector,
      checkItems,
      signatureData: signatureData || null,
      photoUrl: photoUrl || null,
      status: status || "PASS", // PASS 또는 FAIL
      submittedAt: new Date().toLocaleString(),
    };

    MOCK_CHECKLIST_SUBMISSIONS.unshift(newSubmission);

    // 만약 검사 결과가 부적합(FAIL)인 경우, 경보 및 비상 알림 발송 시뮬레이션
    let alertTriggered = false;
    if (status === "FAIL") {
      alertTriggered = true;
      console.log(`[품질 경보 🚨] Lot 번호 [${lotNo}] 검사 부적합 발생! 부적합 보고서(NCR) 자동 발행 및 알림 이송 완료.`);
    }

    return NextResponse.json({
      success: true,
      message: status === "FAIL" 
        ? "품질 검사 부적합이 접수되었습니다. 즉각적인 NCR 자동 발행 및 비상 알림이 전달되었습니다."
        : "모바일 현장 품질 검사서가 정상적으로 접수되었습니다. (Paperless 서명 완료)",
      submission: newSubmission,
      alertTriggered,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
