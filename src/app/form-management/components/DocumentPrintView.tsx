'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Printer, 
  Download, 
  FileText, 
  RefreshCw, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

interface MappingItem {
  field_key: string;
  field_label: string;
  pos_x: number;
  pos_y: number;
  font_size: number;
  font_weight: string;
  text_align: string;
}

interface DocumentPrintViewProps {
  templateId: number;
  estimateId: string;
  onBack: () => void;
}

// 금액 한글 변환 함수
function convertToKoreanNumber(num: number): string {
  if (num === 0) return '영';
  const units = ['', '십', '백', '천'];
  const bigUnits = ['', '만', '억', '조'];
  const numbers = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구'];
  
  let result = '';
  let bigUnitIndex = 0;
  
  while (num > 0) {
    const chunk = num % 10000;
    num = Math.floor(num / 10000);
    
    if (chunk > 0) {
      let chunkStr = '';
      let temp = chunk;
      let unitIndex = 0;
      
      while (temp > 0) {
        const digit = temp % 10;
        temp = Math.floor(temp / 10);
        
        if (digit > 0) {
          const digitStr = numbers[digit];
          const unitStr = units[unitIndex];
          chunkStr = digitStr + unitStr + chunkStr;
        }
        unitIndex++;
      }
      result = chunkStr + bigUnits[bigUnitIndex] + result;
    }
    bigUnitIndex++;
  }
  return result;
}

export default function DocumentPrintView({ templateId, estimateId, onBack }: DocumentPrintViewProps) {
  const [template, setTemplate] = useState<any>(null);
  const [mappings, setMappings] = useState<MappingItem[]>([]);
  const [estimate, setEstimate] = useState<any>(null);
  const [estimateItems, setEstimateItems] = useState<any[]>([]);
  const [companyProfile, setCompanyProfile] = useState<any>({});
  
  const [loading, setLoading] = useState(true);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  const printAreaRef = useRef<HTMLDivElement>(null);

  // 데이터 로드
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. 템플릿 마스터 & 매핑 로드
        const tempRes = await fetch(`/api/templates?action=detail&id=${templateId}`);
        const tempData = await tempRes.json();
        
        // 2. 견적서 마스터 & 품목 로드
        const estRes = await fetch(`/api/estimates?action=detail&estimateId=${estimateId}`);
        const estData = await estRes.json();

        // 3. 자사 프로필 정보 로드
        const compRes = await fetch('/api/settings?key=my_company_profile');
        const compData = await compRes.json();

        if (tempData.success && estData.success) {
          setTemplate(tempData.template);
          setMappings(tempData.mappings);
          setEstimate(estData.estimate);
          setEstimateItems(estData.items);
          
          if (compData.success && compData.value) {
            setCompanyProfile(JSON.parse(compData.value));
          } else {
            // 기본값 매핑
            setCompanyProfile({
              companyName: '(주)쿠스',
              businessNumber: '731-81-02023',
              representative: '차민수',
              address: '서울특별시 금천구 가산디지털2로 123',
              phone: '02-1234-5678'
            });
          }
        } else {
          alert('인쇄에 필요한 양식 정보 또는 견적서 내역을 조회하지 못했습니다.');
        }
      } catch (e) {
        console.error(e);
        alert('데이터 로드 중 네트워크 통신 에러가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    }

    if (templateId && estimateId) {
      loadData();
    }
  }, [templateId, estimateId]);

  // 바인딩 데이터 값 매핑 변환기
  const getBindingValue = (fieldKey: string) => {
    if (!estimate) return '';

    const createdDate = estimate.created_at ? new Date(estimate.created_at.replace(' ', 'T')) : new Date();
    const isInvalidDate = isNaN(createdDate.getTime());

    switch (fieldKey) {
      case 'estimate_id':
        return estimate.id || '';
      case 'partner_name':
        return estimate.partner_name || '';
      case 'partner_phone':
        return estimate.partner_phone || '';
      case 'total_amount':
        return (estimate.total_amount || 0).toLocaleString() + ' 원';
      case 'total_amount_krw':
        const amountVal = estimate.total_amount || 0;
        return `일금 ${convertToKoreanNumber(amountVal)}원정 (\\${amountVal.toLocaleString()})`;
      case 'created_at_date':
        return estimate.created_at ? estimate.created_at.substring(0, 10) : '';
      case 'created_at_year':
        return isInvalidDate ? '' : createdDate.getFullYear().toString();
      case 'created_at_month':
        return isInvalidDate ? '' : (createdDate.getMonth() + 1).toString().padStart(2, '0');
      case 'created_at_day':
        return isInvalidDate ? '' : createdDate.getDate().toString().padStart(2, '0');
      case 'company_name':
        return companyProfile.companyName || '';
      case 'company_biz_num':
        return companyProfile.businessNumber || '';
      case 'company_owner':
        return companyProfile.representative || '';
      case 'company_address':
        return companyProfile.address || '';
      case 'company_phone':
        return companyProfile.phone || '';
      default:
        return '';
    }
  };

  // 브라우저 윈도우 인쇄
  const handlePrint = () => {
    window.print();
  };

  // jsPDF와 html2canvas를 활용한 PDF 고화질 캡처 다운로드
  const handleDownloadPDF = async () => {
    if (!printAreaRef.current) return;
    setPdfGenerating(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const element = printAreaRef.current;
      
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      
      const fileName = `견적서_${estimate.partner_name || '양식출력'}_${estimateId}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('PDF 다운로드 실패:', error);
      alert('PDF 파일을 생성하는 중 문제가 발생했습니다.');
    } finally {
      setPdfGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-slate-400">
        <RefreshCw className="w-12 h-12 animate-spin mb-4 text-indigo-655 text-indigo-600" />
        <p className="text-base font-bold text-slate-700">인쇄할 데이터를 정제하는 중입니다...</p>
      </div>
    );
  }

  if (!template || !estimate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-6 bg-white border border-slate-150 border-slate-100 rounded-3xl shadow-sm">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4 animate-bounce" />
        <h3 className="text-lg font-black text-slate-800 mb-2">데이터 로드 실패</h3>
        <p className="text-xs font-semibold text-slate-500 mb-5">인쇄 양식 설정 혹은 실물 견적 내역을 찾을 수 없습니다.</p>
        <button onClick={onBack} className="px-5 py-2.5 bg-slate-900 hover:bg-slate-850 transition rounded-xl text-xs font-black text-white cursor-pointer shadow-md">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col bg-white text-slate-800 border border-slate-100 rounded-3xl shadow-sm overflow-hidden min-h-[85vh]">
      
      {/* 글로벌 인쇄 전용 CSS 주입 */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-area-wrapper, #print-area-wrapper * {
            visibility: visible !important;
          }
          #print-area-wrapper {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          @page {
            size: A4 portrait;
            margin: 0;
          }
        }
      `}} />

      {/* 1. 컨트롤 탑 바 */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-5 border-b border-slate-100 bg-white/95 backdrop-blur-md gap-4 no-print">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition text-slate-600 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
          </button>
          <div>
            <h1 className="text-lg font-black flex items-center gap-2 text-slate-800">
              <FileText className="w-5 h-5 text-indigo-650 text-indigo-600" />
              양식 오버레이 출력 미리보기
            </h1>
            <p className="text-xs font-semibold text-slate-400 mt-0.5">선택한 견적서 정보를 양식의 매핑 좌표에 정합하여 출력합니다.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs transition cursor-pointer border border-slate-200/50 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            인쇄하기 (window.print)
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={pdfGenerating}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-655 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition shadow-md shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
          >
            {pdfGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin animate-spin-slow" />
                PDF 생성 중...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                PDF 다운로드
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. 실물 미리보기 영역 */}
      <div className="flex-1 bg-slate-100/50 p-8 overflow-y-auto flex justify-center items-start shadow-inner">
        
        {/* 인쇄 및 캡처 전용 A4 사이즈 래퍼 */}
        <div 
          ref={printAreaRef}
          id="print-area-wrapper"
          style={{ 
            backgroundImage: `url(${template.file_path})`,
            backgroundSize: '100% 100%'
          }}
          className="relative bg-white shadow-2xl border border-slate-300 aspect-[1/1.414] w-[700px] md:w-[750px] overflow-hidden select-none"
        >
          
          {/* 매핑된 데이터들 오버레이 */}
          {mappings.map((mapping, idx) => {
            const isTable = mapping.field_key === 'estimate_items_table';
            const value = getBindingValue(mapping.field_key);

            // 품목표일 경우 별도 표 마크업 렌더링
            if (isTable) {
              return (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${mapping.pos_x}%`,
                    top: `${mapping.pos_y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '90%',
                    fontSize: `${mapping.font_size}px`,
                    textAlign: mapping.text_align as any
                  }}
                  className="z-10 px-2 py-1 text-slate-800 font-medium"
                >
                  <table className="w-full border-collapse border border-slate-400 text-slate-900 bg-white/70">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 font-bold border-b border-slate-400 text-center text-[10px] md:text-xs">
                        <th className="p-1 border-r border-slate-400 w-12">순번</th>
                        <th className="p-1 border-r border-slate-400">품목명</th>
                        <th className="p-1 border-r border-slate-400 w-16">수량</th>
                        <th className="p-1 border-r border-slate-400 w-24">단가</th>
                        <th className="p-1 w-28">금액</th>
                      </tr>
                    </thead>
                    <tbody>
                      {estimateItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-3 text-center text-slate-450 text-[10px] md:text-xs">상세 품목 내역이 없습니다.</td>
                        </tr>
                      ) : (
                        estimateItems.map((item, index) => (
                          <tr key={item.id || index} className="border-b border-slate-300 text-[10px] md:text-xs">
                            <td className="p-1 border-r border-slate-400 text-center">{index + 1}</td>
                            <td className="p-1 border-r border-slate-400 text-left pl-2 truncate max-w-[200px]" title={item.product_name}>{item.product_name}</td>
                            <td className="p-1 border-r border-slate-400 text-center font-bold">{(item.quantity || 0).toLocaleString()}</td>
                            <td className="p-1 border-r border-slate-400 text-right pr-2">{(item.unit_price || 0).toLocaleString()}</td>
                            <td className="p-1 text-right pr-2 font-bold">{(item.amount || 0).toLocaleString()}</td>
                          </tr>
                        ))
                      )}
                      
                      {/* 합계행 */}
                      {estimateItems.length > 0 && (
                        <tr className="bg-indigo-50/30 font-bold border-t border-slate-400 text-[10px] md:text-xs text-slate-900">
                          <td colSpan={2} className="p-1.5 border-r border-slate-400 text-center">합 계</td>
                          <td className="p-1.5 border-r border-slate-400 text-center">
                            {estimateItems.reduce((acc, cur) => acc + (parseInt(cur.quantity) || 0), 0).toLocaleString()}
                          </td>
                          <td className="p-1.5 border-r border-slate-400 text-right"></td>
                          <td className="p-1.5 text-right pr-2 text-indigo-700">
                            {(estimate.total_amount || 0).toLocaleString()}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              );
            }

            // 일반 텍스트 필드 렌더링
            return (
              <div
                key={idx}
                style={{
                  position: 'absolute',
                  left: `${mapping.pos_x}%`,
                  top: `${mapping.pos_y}%`,
                  transform: 'translate(-50%, -50%)',
                  fontSize: `${mapping.font_size}px`,
                  fontWeight: mapping.font_weight as any,
                  textAlign: mapping.text_align as any,
                  color: '#1e293b',
                  whiteSpace: 'nowrap'
                }}
                className="z-10 px-1 py-0.5 rounded font-medium"
              >
                {value}
              </div>
            );
          })}

        </div>

      </div>
      
    </div>
  );
}
