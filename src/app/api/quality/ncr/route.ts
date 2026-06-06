import { NextResponse } from "next/server";
import { queryTable, updateRows } from "../../../../../egdesk-helpers";

/**
 * GET: NCR 목록 조회 및 유사 사례 추천 데이터 조회 (물리 DB 연동)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const searchKeyword = searchParams.get("query") || "";

    // 1. DB에서 NCR 전체 조회
    const ncrRes = await queryTable("crm_quality_ncr_items", {});
    let ncrList = (ncrRes.rows || []).map((item: any) => ({
      id: item.id,
      date: item.date,
      itemName: item.itemName,
      defectCode: item.defectCode,
      defectType: item.defectType,
      quantity: Number(item.quantity || 0),
      reporter: item.reporter,
      status: item.status,
      description: item.description,
      actionPlan: item.actionPlan || ""
    }));

    // 2. 검색 필터 적용
    if (searchKeyword) {
      ncrList = ncrList.filter((item: any) =>
        (item.itemName || "").includes(searchKeyword) ||
        (item.defectType || "").includes(searchKeyword) ||
        (item.description || "").includes(searchKeyword)
      );
    }

    // 최신 날짜순 정렬
    ncrList.sort((a: any, b: any) => b.id.localeCompare(a.id));

    // 3. DB에서 유사 사례 조회
    const similarRes = await queryTable("crm_quality_ncr_similar_cases", {});
    const similarCases = (similarRes.rows || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      similarity: Number(s.similarity || 0),
      rootCause: s.rootCause,
      actionTaken: s.actionTaken
    }));

    return NextResponse.json({
      success: true,
      ncrList,
      similarCases
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT: NCR 조치 완료 및 상태 갱신
 */
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, status, actionPlan } = body;

    const nextStatus = status || "COMPLETED";
    const nextActionPlan = actionPlan || "지정된 대책 처리 완료";

    // DB 업데이트 실행
    await updateRows("crm_quality_ncr_items", {
      status: nextStatus,
      actionPlan: nextActionPlan
    }, { filters: { id } });

    return NextResponse.json({
      success: true,
      message: `부적합 보고서 [${id}]에 대한 조치 사항이 등록되어 상태가 변경되었습니다.`,
      updatedItem: {
        id,
        status: nextStatus,
        actionPlan: nextActionPlan,
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
