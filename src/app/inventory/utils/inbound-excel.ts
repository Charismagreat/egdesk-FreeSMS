import * as XLSX from 'xlsx';

export interface InboundExcelParsedItem {
  barcode_or_name: string; // 품명 또는 바코드
  spec: string;           // 규격
  quantity: number;       // 수량
  unit_price: number;     // 단가
}

export interface InboundExcelParsedResult {
  header_signature: string;
  partner_name: string;
  inbound_date: string;
  items: InboundExcelParsedItem[];
  rawRows?: any[][];
  headerRowIndex?: number;
}

/**
 * 엑셀/CSV 파일에서 첫 행의 헤더 열 이름들을 추출하여 파이프(|)로 연결한 시그니처 문자열을 생성합니다.
 */
export const parseInboundExcelHeader = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // 빈 셀 무결성 보존을 위해 2차원 배열로 전환
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  if (!rawRows || rawRows.length === 0) return "";

  // 유효한 첫 행(헤더) 탐색
  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (row && row.length > 0) {
      const headers = row.map(v => String(v || "").trim()).filter(Boolean);
      if (headers.length > 0) {
        return headers.join('|');
      }
    }
  }
  return "";
};

/**
 * 엑셀/CSV 파일에서 전체 행 데이터(rawRows) 및 헤더 행의 인덱스를 추출합니다.
 */
export const getExcelColumnsAndRawData = async (
  file: File
): Promise<{ rawRows: any[][]; headerRowIndex: number; headers: string[] }> => {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
  let headerRowIndex = -1;
  let headers: string[] = [];

  for (let r = 0; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row) continue;

    // 품명/바코드, 수량, 단가 등으로 추정되는 일반적 단어가 포함된 첫 행을 헤더 행으로 지능형 검출
    const rowText = row.map(v => String(v || "").trim());
    const hasCoreColumn = rowText.some(v => 
      v.includes("품명") || v.includes("상품명") || v.includes("품목명") || 
      v.includes("바코드") || v.includes("코드") || v.includes("수량") || v.includes("단가")
    );

    if (hasCoreColumn && headerRowIndex === -1) {
      headerRowIndex = r;
      headers = row.map(v => String(v || "").trim());
      break;
    }
  }

  // 지능형 헤더 검출 실패 시 첫 번째 유효 행을 강제 헤더로 사용
  if (headerRowIndex === -1) {
    for (let r = 0; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (row && row.length > 0) {
        headerRowIndex = r;
        headers = row.map(v => String(v || "").trim());
        break;
      }
    }
  }

  return { rawRows, headerRowIndex, headers };
};

/**
 * 저장된 매핑(열 인덱스 및 설정) 정보를 바탕으로 엑셀 로우(rawRows) 데이터를 해석하여 자율 입고 품목 목록을 빌드합니다.
 * mapping 구조: { barcode_or_name: number, spec: number, quantity: number, unit_price: number, partner_name: number, inbound_date: number }
 */
export const parseInboundExcelWithMapping = (
  rawRows: any[][],
  headerRowIndex: number,
  mapping: {
    barcode_or_name: number;
    spec: number;
    quantity: number;
    unit_price: number;
    partner_name?: number;
    inbound_date?: number;
  },
  filename: string
): InboundExcelParsedResult => {
  const items: InboundExcelParsedItem[] = [];
  let partner_name = "";
  let inbound_date = "";

  // 1. 헤더 행의 실제 컬럼들 추출
  const headerRow = rawRows[headerRowIndex] || [];
  const headerCols = headerRow.map(v => String(v || "").trim()).filter(Boolean);
  const header_signature = headerCols.join('|');

  // 2. 헤더 행 다음 라인부터 데이터를 매핑하여 읽어옴
  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    // 품명/바코드 컬럼이 매핑되어 있고 해당 값이 유효한지 검사
    const barcodeOrNameIdx = mapping.barcode_or_name;
    const barcode_or_name = barcodeOrNameIdx !== undefined && barcodeOrNameIdx !== -1 && row[barcodeOrNameIdx]
      ? String(row[barcodeOrNameIdx]).trim()
      : "";

    if (!barcode_or_name) continue;

    const specIdx = mapping.spec;
    const spec = specIdx !== undefined && specIdx !== -1 && row[specIdx]
      ? String(row[specIdx]).trim()
      : "";

    const qtyIdx = mapping.quantity;
    const quantity = qtyIdx !== undefined && qtyIdx !== -1 && row[qtyIdx]
      ? Number(row[qtyIdx]) || 1
      : 1;

    const priceIdx = mapping.unit_price;
    const unit_price = priceIdx !== undefined && priceIdx !== -1 && row[priceIdx]
      ? Number(row[priceIdx]) || 0
      : 0;

    // 행마다 공급처가 적혀있는지 수집 (첫 번째 유효한 값을 공급처로 사용)
    const partnerIdx = mapping.partner_name;
    if (partnerIdx !== undefined && partnerIdx !== -1 && row[partnerIdx] && !partner_name) {
      partner_name = String(row[partnerIdx]).trim();
    }

    // 행마다 입고일이 적혀있는지 수집 (첫 번째 유효한 값을 입고일로 사용)
    const dateIdx = mapping.inbound_date;
    if (dateIdx !== undefined && dateIdx !== -1 && row[dateIdx] && !inbound_date) {
      inbound_date = String(row[dateIdx]).trim();
    }

    items.push({
      barcode_or_name,
      spec,
      quantity,
      unit_price
    });
  }

  // 공급처명이 없으면 파일명에서 유추하거나 기본값 대입
  if (!partner_name) {
    const cleanName = filename.replace(/\.[^/.]+$/, ""); // 확장자 제거
    partner_name = cleanName.includes("입고") ? cleanName.split("입고")[0].trim() : "일반공급처";
  }

  // 입고일이 없으면 오늘 날짜로 대체
  if (!inbound_date) {
    inbound_date = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  }

  return {
    header_signature,
    partner_name,
    inbound_date,
    items
  };
};
