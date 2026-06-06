import { NextResponse } from "next/server";

// 모의 점검 이력 데이터베이스 저장용 리스트
let MOCK_MAINTENANCE_CHECKS: any[] = [];

export async function GET() {
  return NextResponse.json({
    success: true,
    checks: MOCK_MAINTENANCE_CHECKS
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { equipmentId, inspector, checks, signatureData, audioUrl, status } = body;

    if (!equipmentId || !inspector || !checks) {
      return NextResponse.json({ success: false, error: "필수 입력 항목(설비 코드, 정비원, 점검 문항)이 누락되었습니다." }, { status: 400 });
    }

    const newCheck = {
      id: `MC-${Date.now()}`,
      equipmentId,
      inspector,
      checks,
      signatureData: signatureData || null,
      audioUrl: audioUrl || null,
      status: status || "PASS", // PASS 또는 FAIL
      checkedAt: new Date().toLocaleString(),
    };

    MOCK_MAINTENANCE_CHECKS.unshift(newCheck);

    let alertTriggered = false;
    if (status === "FAIL") {
      alertTriggered = true;
      console.log(`[설비 고장 경보 🚨] 설비 [${equipmentId}] 현장 점검 부적합 발생! 긴급 정비 티켓 발행 및 카카오톡 이송.`);
    }

    return NextResponse.json({
      success: true,
      message: status === "FAIL"
        ? "설비 점검 부합 사항이 접수되었습니다. 긴급 수리 대장 이송 및 예비 자재 점검 알림이 발행되었습니다."
        : "모바일 설비 예방 점검이 안전하게 저장되었습니다. (Paperless 서명 서명)",
      check: newCheck,
      alertTriggered
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
