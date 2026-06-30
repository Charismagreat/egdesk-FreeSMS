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

    // 2. 캐시된 PDF 파일이 존재하지 않는 경우 Playwright로 실시간 인쇄 빌드
    if (!fs.existsSync(filePath)) {
      console.log(`[PDF Generator] Generating new PDF cache for Estimate ID: ${realId}`);
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
