import { NextResponse } from "next/server";
import { queryTable } from "../../../../../egdesk-helpers";

/**
 * GET: SPC 관리도 차트 설정 및 Cpk 분석 데이터 조회 (물리 DB 연동)
 */
export async function GET() {
  try {
    // 1. DB에서 SPC 관리도 기본 설정 조회 (ID: SPC-CFG 단일 행)
    const configRes = await queryTable("crm_quality_spc_config", { filters: { id: "SPC-CFG" } });
    const dbConfig = configRes.rows && configRes.rows.length > 0 ? configRes.rows[0] : null;

    const spcConfig = {
      targetValue: dbConfig ? Number(dbConfig.targetValue || 0) : 210.0,
      ucl: dbConfig ? Number(dbConfig.ucl || 0) : 215.0,
      lcl: dbConfig ? Number(dbConfig.lcl || 0) : 205.0,
      usl: dbConfig ? Number(dbConfig.usl || 0) : 218.0,
      lsl: dbConfig ? Number(dbConfig.lsl || 0) : 202.0
    };

    const currentCpk = dbConfig ? Number(dbConfig.currentCpk || 0) : 1.15;
    const cpkStatus = dbConfig ? dbConfig.cpkStatus : "WARNING";
    const futureRiskProbability = dbConfig ? Number(dbConfig.futureRiskProbability || 0) : 89;

    // 2. DB에서 계측 샘플 리스트 조회
    const samplesRes = await queryTable("crm_quality_spc_samples", {});
    const samples = (samplesRes.rows || []).map((s: any) => ({
      batch: s.batch,
      value: Number(s.value || 0),
      cpk: Number(s.cpk || 0),
      timestamp: s.timestamp
    }));
    // 타임라인 정렬
    samples.sort((a: any, b: any) => a.timestamp.localeCompare(b.timestamp));

    // 3. DB에서 예측 Cpk 리스트 조회
    const predictionsRes = await queryTable("crm_quality_spc_predictions", {});
    const predictions = (predictionsRes.rows || []).map((p: any) => ({
      batch: p.batch,
      value: Number(p.value || 0),
      cpk: Number(p.cpk || 0),
      timestamp: p.timestamp,
      risk: Number(p.risk || 0)
    }));
    // 예측 타임라인 정렬
    predictions.sort((a: any, b: any) => a.timestamp.localeCompare(b.timestamp));

    // 4. DB에서 중요도 리스트 조회
    const featuresRes = await queryTable("crm_quality_spc_features", {});
    const featureImportance = (featuresRes.rows || []).map((f: any) => ({
      name: f.name,
      value: Number(f.value || 0),
      color: f.color
    }));
    // 중요도 역순 정렬
    featureImportance.sort((a: any, b: any) => b.value - a.value);

    return NextResponse.json({
      success: true,
      spcConfig,
      currentCpk,
      cpkStatus,
      futureRiskProbability,
      samples,
      predictions,
      featureImportance
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
