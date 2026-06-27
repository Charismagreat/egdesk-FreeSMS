import React, { useState } from 'react';
import { ArrowRightLeft, Printer, X } from 'lucide-react';
import { InventoryLog } from '../types';
import { InboundDetailModal } from './InboundDetailModal';

interface InventoryLogTableProps {
  logs: InventoryLog[];
}

export const InventoryLogTable: React.FC<InventoryLogTableProps> = ({ logs }) => {
  const [selectedInboundId, setSelectedInboundId] = useState<string | null>(null);
  const [activeFileUrl, setActiveFileUrl] = useState<string | null>(null);
  const safeLogs = Array.isArray(logs) ? logs : [];

  const getFileUrl = (url: string | null) => {
    if (!url) return "";
    if (url.startsWith("/uploads/")) {
      const apiHost = process.env.NEXT_PUBLIC_EGDESK_API_URL || "http://localhost:8080";
      return `${apiHost}${url}`;
    }
    return url;
  };

  // 🖨️ 인쇄 기능 구현
  const handlePrint = () => {
    if (!activeFileUrl) return;
    const realUrl = getFileUrl(activeFileUrl);
    const isPdf = activeFileUrl.startsWith("data:application/pdf") || activeFileUrl.toLowerCase().endsWith(".pdf");
    
    if (isPdf) {
      const iframe = document.getElementById("print-iframe-logs") as HTMLIFrameElement;
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
          return;
        } catch (e) {
          console.error("iframe direct print failed", e);
        }
      }
    }

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>인쇄하기 - EGDesk</title>
            <style>
              body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: white; }
              img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              iframe { width: 100vw; height: 100vh; border: none; }
            </style>
          </head>
          <body>
            ${isPdf 
              ? `<iframe src="${realUrl}"></iframe>` 
              : `<img src="${realUrl}" onload="window.print();window.close();" />`
            }
            ${isPdf ? `<script>window.onload = function() { window.print(); window.close(); }</script>` : ""}
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // 🔗 새 탭에서 열기 (Base64 data url 브라우저 차단 우회)
  const handleOpenNewTab = () => {
    if (!activeFileUrl) return;
    if (activeFileUrl.startsWith("data:")) {
      try {
        const parts = activeFileUrl.split(",");
        const mime = parts[0].match(/:(.*?);/)?.[1] || "";
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
      } catch (err) {
        console.error("Base64 새 탭 열기 실패:", err);
        window.open(getFileUrl(activeFileUrl), "_blank");
      }
    } else {
      window.open(getFileUrl(activeFileUrl), "_blank");
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
      
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-500" />
            <span>실시간 시계열 입출고 변동 로그</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            재고 수량 보정, 구매 입고, 주문 출고 등 모든 재고의 흐름이 영구 기록된 데이터 피드입니다.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open("/estimates/web-view?type=inventory_inout", "_blank")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold rounded-xl shadow-md transition active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-indigo-400" />
            웹뷰 대장 내역
          </button>
          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200">
            총 {safeLogs.length}개 로그 기록됨
          </span>
        </div>
      </div>

      <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
        {safeLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            현재고 변동 내역이 아직 존재하지 않습니다.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 sticky top-0 z-10">
                <th className="py-3 px-4 bg-slate-50">일시</th>
                <th className="py-3 px-4 bg-slate-50">품목명</th>
                <th className="py-3 px-4 bg-slate-50">품목 구분</th>
                <th className="py-3 px-4 text-center bg-slate-50">변동 종류</th>
                <th className="py-3 px-4 text-right bg-slate-50">수량</th>
                <th className="py-3 px-4 text-right bg-slate-50">단가</th>
                <th className="py-3 px-4 bg-slate-50">담당자</th>
                <th className="py-3 px-4 bg-slate-50">변동 메모 및 AI 분석 사유</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs">
              {safeLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {new Date(log.createdAt).toLocaleString('ko-KR', {
                      month: 'numeric',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">{log.itemName}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      (log.itemType === '자재' || log.itemType === 'material')
                        ? 'bg-blue-50 text-blue-600 border border-blue-100' 
                        : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    }`}>
                      {(log.itemType === '자재' || log.itemType === 'material') ? '자재' : '제품'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold ${
                      log.changeType === 'in'
                        ? 'bg-blue-100 text-blue-700'
                        : log.changeType === 'out'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {log.changeType === 'in' ? '입고' : log.changeType === 'out' ? '출고' : '실사조정'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-bold">
                    <span className={
                      log.changeType === 'in' 
                        ? 'text-blue-600' 
                        : log.changeType === 'out' 
                        ? 'text-rose-600' 
                        : 'text-purple-600'
                    }>
                      {log.changeType === 'in' ? '+' : log.changeType === 'out' ? '-' : ''}
                      {Math.abs(log.quantity).toLocaleString()} 개
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-slate-600">
                    ₩ {log.price.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-500">{log.operator}</td>
                  <td className="py-3 px-4 text-slate-550 max-w-[280px]" title={log.note || ''}>
                    {(() => {
                      const noteText = log.note || '';
                      const proofMatch = noteText.match(/\(증빙:\s*([^\)]+)\)/);
                      const proofPath = proofMatch ? proofMatch[1] : null;
                      
                      const inboundMatch = noteText.match(/inboundId:\s*(INB-\w+)/);
                      const inboundId = inboundMatch ? inboundMatch[1] : null;

                      let cleanNote = proofMatch ? noteText.replace(proofMatch[0], '').trim() : noteText;
                      if (inboundMatch) {
                        cleanNote = cleanNote.replace(inboundMatch[0], '').replace(/\(\s*\)/, '').trim();
                        cleanNote = cleanNote.replace(/\s*\|\s*$/, '').trim();
                      }
                      // 과거 데이터 소급 적용: [자율 입고 요약] 접두사 공백 치환 제거
                      cleanNote = cleanNote.replace(/^\[자율 입고 요약\]\s*/, '').trim();

                      return (
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="truncate flex-1" title={cleanNote}>{cleanNote || '-'}</span>
                          <div className="flex items-center gap-1 shrink-0">
                            {inboundId && (
                              <button
                                onClick={() => setSelectedInboundId(inboundId)}
                                className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-900 rounded-md text-[9px] font-extrabold border border-emerald-150 transition-colors cursor-pointer"
                                title="일괄 입고 상세 품목 조회"
                              >
                                🔍 상세 조회
                              </button>
                            )}
                            {proofPath && (
                              (() => {
                                const isDocOrImg = 
                                  proofPath.startsWith('data:') || 
                                  proofPath.startsWith('http') || 
                                  proofPath.includes('/uploads/') || 
                                  /\.(pdf|png|jpg|jpeg|gif)$/i.test(proofPath);

                                return isDocOrImg ? (
                                  <button
                                    onClick={() => setActiveFileUrl(proofPath)}
                                    className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-650 hover:text-indigo-800 rounded-md text-[9px] font-extrabold border border-indigo-100 transition-colors cursor-pointer"
                                    title="자율입고 증빙 파일 조회"
                                  >
                                    📄 증빙 조회
                                  </button>
                                ) : (proofPath.endsWith('.xlsx') || proofPath.endsWith('.xls') || proofPath.includes('excel')) ? (
                                  <span 
                                    className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[9px] font-extrabold border border-emerald-150"
                                    title={`엑셀 파일 업로드 건: ${proofPath}`}
                                  >
                                    EXCEL
                                  </span>
                               ) : (
                                 <span 
                                   className="inline-flex items-center px-2 py-0.5 bg-slate-50 text-slate-500 rounded-md text-[9px] font-extrabold border border-slate-200"
                                   title={`수동/일반 기록: ${proofPath}`}
                                 >
                                   일반
                                 </span>
                               );
                             })()
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedInboundId && (
        <InboundDetailModal 
          inboundId={selectedInboundId} 
          onClose={() => setSelectedInboundId(null)} 
        />
      )}

      {/* 📄 원본 증빙문서 전체화면 오버레이 모달 */}
      {activeFileUrl && (() => {
        const isPdf = activeFileUrl.startsWith("data:application/pdf") || activeFileUrl.toLowerCase().endsWith(".pdf");
        return (
          <div className="fixed inset-0 bg-slate-950/95 z-[999] flex flex-col backdrop-blur-sm animate-fade-in">
            {/* 상단 컨트롤 바 */}
            <div className="bg-slate-900/95 border-b border-white/10 px-6 py-4 flex items-center justify-between text-white shadow-2xl">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[9px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase">
                  Document Viewer
                </span>
                <h3 className="text-xs font-black tracking-wide">📄 입출고 증빙 원본문서 뷰어</h3>
              </div>
              <div className="flex items-center gap-2">
                {/* 🖨️ 인쇄하기 */}
                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black cursor-pointer transition-all flex items-center gap-1 shadow-md border-none"
                  title="문서 인쇄하기"
                >
                  <span>🖨️ 인쇄하기</span>
                </button>

                {/* 🌐 새 탭에서 열기 */}
                <button
                  onClick={handleOpenNewTab}
                  className="px-3.5 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 rounded-xl text-[10px] font-black cursor-pointer transition-all flex items-center gap-1 shadow-md"
                  title="브라우저 새 탭에서 열기 (차단 우회 적용)"
                >
                  <span>🌐 새 탭에서 열기</span>
                </button>

                {/* ❌ 닫기 */}
                <button
                  onClick={() => setActiveFileUrl(null)}
                  className="w-9 h-9 flex items-center justify-center bg-slate-800 border border-white/5 hover:bg-slate-700 text-slate-300 rounded-full cursor-pointer transition-all hover:scale-105"
                  title="뷰어 닫기"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* 원본 파일 렌더링 구역 */}
            <div className="flex-1 flex justify-center items-center p-6 overflow-auto bg-slate-950">
              {isPdf ? (
                <iframe
                  id="print-iframe-logs"
                  src={getFileUrl(activeFileUrl)}
                  className="w-full h-full max-w-5xl max-h-[82vh] rounded-2xl border border-white/10 bg-white shadow-2xl"
                  title="PDF 원본 뷰어"
                />
              ) : (
                <img
                  src={getFileUrl(activeFileUrl)}
                  alt="원본 증빙 이미지"
                  className="max-h-[82vh] max-w-full object-contain rounded-2xl border border-white/10 shadow-2xl bg-slate-900/50"
                />
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
