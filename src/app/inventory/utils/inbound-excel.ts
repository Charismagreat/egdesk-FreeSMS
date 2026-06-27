import * as XLSX from 'xlsx';

export interface InboundExcelParsedItem {
  item_name: string;      // 품목명 (필수)
  item_code: string;      // 품목코드 (선택)
  barcode: string;        // 바코드 (선택)
  spec: string;           // 규격
  quantity: number;       // 수량
  unit_price: number;     // 단가
  note: string;           // 비고 (매핑안된 데이터 병합 수집)
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

    // 핵심 컬럼 추정 일반 단어로 첫 헤더 행 지능형 감출
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
 * 매핑되지 않은 모든 컬럼들의 셀 값은 'note(비고)' 필드에 기타 정보로 수집 및 병합됩니다.
 */
export const parseInboundExcelWithMapping = (
  rawRows: any[][],
  headerRowIndex: number,
  mapping: {
    item_name: number;
    item_code?: number;
    barcode?: number;
    spec: number;
    quantity: number;
    unit_price: number;
    note?: number;
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

  // 매핑에 사용된 실제 인덱스 목록 (Unmapped 열 데이터 필터링용)
  const usedIndices = [
    mapping.item_name,
    mapping.item_code,
    mapping.barcode,
    mapping.spec,
    mapping.quantity,
    mapping.unit_price,
    mapping.note,
    mapping.partner_name,
    mapping.inbound_date
  ].filter(idx => idx !== undefined && idx !== -1);

  // 2. 헤더 행 다음 라인부터 데이터를 매핑하여 읽어옴
  for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
    const row = rawRows[r];
    if (!row || row.length === 0) continue;

    // 품목명은 필수값
    const nameIdx = mapping.item_name;
    const item_name = nameIdx !== undefined && nameIdx !== -1 && row[nameIdx]
      ? String(row[nameIdx]).trim()
      : "";

    if (!item_name) continue;

    // 품목코드 (선택)
    const codeIdx = mapping.item_code;
    const item_code = codeIdx !== undefined && codeIdx !== -1 && row[codeIdx]
      ? String(row[codeIdx]).trim()
      : "";

    // 바코드 (선택)
    const barcodeIdx = mapping.barcode;
    const barcode = barcodeIdx !== undefined && barcodeIdx !== -1 && row[barcodeIdx]
      ? String(row[barcodeIdx]).trim()
      : "";

    // 규격
    const specIdx = mapping.spec;
    const spec = specIdx !== undefined && specIdx !== -1 && row[specIdx]
      ? String(row[specIdx]).trim()
      : "";

    // 수량
    const qtyIdx = mapping.quantity;
    const quantity = qtyIdx !== undefined && qtyIdx !== -1 && row[qtyIdx]
      ? Number(row[qtyIdx]) || 1
      : 1;

    // 단가
    const priceIdx = mapping.unit_price;
    const unit_price = priceIdx !== undefined && priceIdx !== -1 && row[priceIdx]
      ? Number(row[priceIdx]) || 0
      : 0;

    // 매핑안된 나머지 컬럼 데이터를 자동으로 수집하여 문자열로 병합
    const unmappedData = row
      .map((val, idx) => {
        if (usedIndices.includes(idx)) return null;
        if (val === undefined || val === null || String(val).trim() === '') return null;
        const headerName = headerRow[idx] || `열${idx + 1}`;
        return `${headerName}: ${String(val).trim()}`;
      })
      .filter(Boolean)
      .join(', ');

    // 지정된 비고 컬럼 데이터 파싱
    const noteIdx = mapping.note;
    const explicitNote = noteIdx !== undefined && noteIdx !== -1 && row[noteIdx]
      ? String(row[noteIdx]).trim()
      : "";

    // 지정된 비고 정보와 매핑되지 않은 기타 정보를 최종 결합
    const note = [explicitNote, unmappedData ? `[기타정보] ${unmappedData}` : ''].filter(Boolean).join(' | ');

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
      item_name,
      item_code,
      barcode,
      spec,
      quantity,
      unit_price,
      note
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
