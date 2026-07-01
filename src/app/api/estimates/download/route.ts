import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { chromium } from "playwright";
import { queryTable } from "@/../egdesk-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const estimateId = searchParams.get("id");

    if (!estimateId) {
      return NextResponse.json({ success: false, error: "id가 누락되었습니다." }, { status: 400 });
    }

    // 0. 실제 데이터베이스에 존재하는 견적서인지 선제 검증
    const checkRes = await queryTable("crm_estimates", { filters: { id: estimateId }, limit: 1 });
    let activeEst = checkRes.rows?.[0];
    if (!activeEst) {
      const fallbackCheck = await queryTable("crm_estimates", { filters: { uuid: estimateId }, limit: 1 });
      activeEst = fallbackCheck.rows?.[0];
      if (!activeEst) {
        return NextResponse.json({ success: false, error: "존재하지 않는 견적서 데이터입니다." }, { status: 404 });
      }
    }

    const realId = String(activeEst.id);

    // 1. PDF 저장 폴더 확보
    const uploadDir = path.join(process.cwd(), "public", "uploads", "estimates");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, `${realId}.pdf`);

    // 2. 캐시 유효성 판단 (DB 수정시간 및 소스코드 패치 시간과 캐시 파일 수정시간 비교)
    const TEMPLATE_PATCH_TIME = new Date("2026-07-01T03:00:00.000Z").getTime(); // 2026-07-01 KST 패치 시점
    let shouldRegenerate = !fs.existsSync(filePath);
    if (!shouldRegenerate) {
      try {
        const fileStat = fs.statSync(filePath);
        const fileMtime = fileStat.mtime.getTime();
        
        // A. 템플릿 소스 코드나 도장/줄바꿈 패치일보다 캐시 파일이 오래된 경우
        if (fileMtime < TEMPLATE_PATCH_TIME) {
          console.log(`[PDF Generator] PDF cache file is older than template patch time. Invalidating and regenerating.`);
          shouldRegenerate = true;
        }
        
        // B. DB 상의 데이터 수정 시간이 캐시 파일 생성 시간보다 최신인 경우
        if (!shouldRegenerate && activeEst.updated_at) {
          const dbUpdateTime = new Date(activeEst.updated_at).getTime();
          if (dbUpdateTime > fileMtime) {
            console.log(`[PDF Generator] DB updated_at (${activeEst.updated_at}) is newer than PDF cache file. Regenerating.`);
            shouldRegenerate = true;
          }
        }
      } catch (err) {
        shouldRegenerate = true;
      }
    }

    // 3. 캐시가 없거나 유효기간이 만료된 경우 Playwright로 실시간 인쇄 빌드
    if (shouldRegenerate) {
      console.log(`[PDF Generator] Generating/Updating PDF cache for Estimate ID: ${realId}`);
      let browser = null;
      try {
        browser = await chromium.launch({
          headless: true,
          args: ["--no-sandbox", "--disable-setuid-sandbox"]
        });
        const context = await browser.newContext();
        const page = await context.newPage();
        
        // 개발용 서버 포트 4000 기준 연동
        const targetUrl = `http://localhost:4000/estimates/print-pdf?id=${realId}`;
        await page.goto(targetUrl, { waitUntil: "networkidle" });
        
        // A4 규격 배경 포함 PDF 출력 저장
        await page.pdf({
          path: filePath,
          format: "A4",
          printBackground: true,
          margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" }
        });
        console.log(`[PDF Generator] PDF successfully cached: ${filePath}`);
      } catch (err: any) {
        console.error("[PDF Generator] Playwright PDF 렌더링 실패:", err);
        return NextResponse.json({ 
          success: false, 
          error: `PDF 생성 중 서버 에러가 발생했습니다: ${err.message}` 
        }, { status: 500 });
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    }

    // 3. 파일 바이너리 스트림 읽기 및 다운로드 전송
    const fileBuffer = fs.readFileSync(filePath);
    const response = new NextResponse(fileBuffer);
    
    response.headers.set("Content-Type", "application/pdf");
    response.headers.set(
      "Content-Disposition",
      `attachment; filename="Estimate_${realId}.pdf"`
    );

    return response;
  } catch (error: any) {
    console.error("PDF 다운로드 라우트 에러:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
