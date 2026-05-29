"use client";

import React from "react";
import { 
  Send, Smartphone, ScanLine, FileText, CheckCircle, AlertTriangle, 
  X, Bot, Sparkles, Upload, Download, Search 
} from "lucide-react";

// 커스텀 훅 및 모달 컴포넌트 임포트
import { useSms } from "@/hooks/useSms";
import SmsTestSendModal from "@/components/sms/SmsTestSendModal";
import SmsTemplateEditModal from "@/components/sms/SmsTemplateEditModal";
import SmsDeviceAddModal from "@/components/sms/SmsDeviceAddModal";

export default function SmsPage() {
  const {
    message, setMessage,
    isConnected,
    isPairing,
    smsDevices,
    selectedDeviceId, setSelectedDeviceId,
    newDevicePhone, setNewDevicePhone,
    newDeviceName, setNewDeviceName,
    showAddDeviceModal, setShowAddDeviceModal,
    isAddingDevice,
    customers,
    selectedIds,
    targetMode, setTargetMode,
    excelCustomers,
    selectedExcelIds,
    fileInputRef,
    isAd, setIsAd,
    adHeader, setAdHeader,
    adFooter, setAdFooter,
    optOutPhone, setOptOutPhone,
    spamRisk,
    adTemplates,
    selectedTemplateId,
    products,
    selectedProductId, setSelectedProductId,
    messageTemplates, setMessageTemplates,
    editingTemplate, setEditingTemplate,
    isSending,
    sendProgress,
    showTestModal, setShowTestModal,
    testPhone, setTestPhone,
    testDeviceId, setTestDeviceId,
    aiPrompt, setAiPrompt,
    isAiLoading,
    aiError,
    dbSearchQuery, setDbSearchQuery,
    dbCurrentPage, setDbCurrentPage,
    dbItemsPerPage, setDbItemsPerPage,
    excelSearchQuery, setExcelSearchQuery,
    excelCurrentPage, setExcelCurrentPage,
    excelItemsPerPage, setExcelItemsPerPage,
    filteredDbCustomers, totalDbPages, startDbIndex, endDbIndex, paginatedDbCustomers,
    filteredExcelCustomers, totalExcelPages, startExcelIndex, endExcelIndex, paginatedExcelCustomers,
    fetchCustomers,
    loadDevicesAndStatus,
    handleUpdateDeviceLimit,
    handleAiGenerate,
    handlePairing,
    handleAddDevice,
    handleDeleteDevice,
    toggleSelectAll,
    toggleSelect,
    handleExcelUpload,
    handleDeleteSelectedExcel,
    downloadSampleExcel,
    insertVariable,
    saveAdTemplate,
    loadAdTemplate,
    deleteAdTemplate,
    saveProduct,
    deleteProduct,
    generateFinalMessage,
    handleTestSend,
    handleSend
  } = useSms();

  return (
    <div className="space-y-6 pb-20 w-full min-w-0 font-sans text-slate-800">
      <h1 className="text-3xl font-bold text-slate-800">무료 문자 발송 AI</h1>

      {/* PC 전용 3열 고정 레이아웃 (반응형 접두사 디톡스 적용) */}
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          
          {/* AI Panel (PC용 고정 가로폭 정렬) */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-2xl shadow-sm border border-indigo-100">
            <h2 className="text-lg font-bold text-indigo-900 mb-3 flex items-center">
              <Bot className="w-5 h-5 mr-2 text-indigo-600 animate-bounce" />
              AI 비서에게 발송 타겟팅 & 내용 작성 부탁하기
            </h2>
            <div className="flex gap-3">
              <input
                type="text"
                placeholder="예: 단골 고객들에게 이번 주말 50% 세일 문자를 작성해줘."
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                className="flex-1 border border-indigo-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-550 bg-white text-slate-800 text-xs font-semibold"
                onKeyDown={e => e.key === 'Enter' && handleAiGenerate()}
              />
              <button 
                onClick={handleAiGenerate}
                disabled={isAiLoading}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 transition flex items-center justify-center font-extrabold text-xs disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {isAiLoading ? (
                  <span className="flex items-center"><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span> 생성 중...</span>
                ) : (
                  <span className="flex items-center"><Sparkles className="w-4 h-4 mr-2 animate-pulse" /> 자동 완성</span>
                )}
              </button>
            </div>
            {aiError && <p className="text-red-500 text-sm mt-2 flex items-center"><AlertTriangle className="w-4 h-4 mr-1"/> {aiError}</p>}
          </div>

          {/* 메시지 작성 센터 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-500" />
                메시지 작성
              </div>
              
              <div className="flex items-center space-x-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                <span className="text-xs text-slate-500 ml-1 font-extrabold">광고 상품:</span>
                <select 
                  className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-blue-500 bg-white min-w-[120px] font-bold text-slate-700 cursor-pointer"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">선택 안함</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {selectedProductId && (
                  <button onClick={deleteProduct} className="p-1 text-red-500 hover:bg-red-100 rounded cursor-pointer" title="상품 삭제">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={saveProduct} className="px-2 py-1 bg-white text-blue-600 rounded border border-blue-200 text-xs hover:bg-blue-50 font-bold cursor-pointer">
                  + 새 상품 등록
                </button>
              </div>
            </h2>

            {/* 치환 변수 삽입 패널 */}
            <div className="flex space-x-2 mb-3 bg-slate-100 p-2 rounded-lg items-center">
              <span className="text-xs font-bold text-slate-500 px-1">기본 변수:</span>
              <button onClick={() => insertVariable("{이름}")} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-50 shadow-xs cursor-pointer font-bold">
                + {"{이름}"}
              </button>
              <button onClick={() => insertVariable("{연락처}")} className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs hover:bg-slate-50 shadow-xs cursor-pointer font-bold">
                + {"{연락처}"}
              </button>
              <button onClick={() => insertVariable("{최근구매내역}")} className="px-3 py-1.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-xs hover:bg-orange-100 shadow-xs cursor-pointer font-bold">
                + {"{최근구매내역}"}
              </button>
              <button onClick={() => insertVariable("{쿠폰코드}")} className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs hover:bg-emerald-100 shadow-xs cursor-pointer font-bold">
                + {"{쿠폰코드}"}
              </button>
              
              <div className="w-px h-6 bg-slate-300 mx-2"></div>
              
              <span className="text-xs font-bold text-blue-500 px-1">상품 변수:</span>
              <button onClick={() => insertVariable("{상품명}")} className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs hover:bg-blue-100 shadow-xs cursor-pointer font-bold">
                + {"{상품명}"}
              </button>
              <button onClick={() => insertVariable("{금액}")} className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs hover:bg-blue-100 shadow-xs cursor-pointer font-bold">
                + {"{금액}"}
              </button>
              <button onClick={() => insertVariable("{URL}")} className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs hover:bg-blue-100 shadow-xs cursor-pointer font-bold">
                + {"{URL}"}
              </button>
            </div>

            {/* 광고성 옵션 */}
            <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer select-none">
                  <input type="checkbox" checked={isAd} onChange={(e) => setIsAd(e.target.checked)} className="rounded text-blue-600 focus:ring-0 cursor-pointer" />
                  <span className="font-bold text-xs text-slate-700">광고성 메시지로 발송 (자동 헤더/푸터 추가)</span>
                </label>
                {isAd && (
                  <div className="flex items-center space-x-2">
                    <select 
                      onChange={loadAdTemplate} 
                      className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-blue-500 bg-white font-bold text-slate-700 cursor-pointer"
                      value={selectedTemplateId}
                    >
                      <option value="">템플릿 선택...</option>
                      {adTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    {selectedTemplateId && (
                      <button 
                        onClick={deleteAdTemplate}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                        title="템플릿 삭제"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={saveAdTemplate}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs hover:bg-blue-100 border border-blue-200 font-bold cursor-pointer"
                    >
                      현재 설정 저장
                    </button>
                  </div>
                )}
              </div>
              {isAd && (
                <div className="flex flex-col space-y-2 pl-6 mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-500 w-24">헤더 문구:</span>
                    <input 
                      type="text" 
                      value={adHeader} 
                      onChange={e => setAdHeader(e.target.value)}
                      className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 w-64 text-slate-800 font-semibold"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-500 w-24">푸터 문구:</span>
                    <input 
                      type="text" 
                      value={adFooter} 
                      onChange={e => setAdFooter(e.target.value)}
                      className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 w-32 text-slate-800 font-semibold"
                    />
                    <input 
                      type="text" 
                      value={optOutPhone} 
                      onChange={e => setOptOutPhone(e.target.value)}
                      placeholder="수신거부 번호"
                      className="border border-slate-300 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-blue-500 w-40 text-slate-805 font-mono font-semibold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* 본문 에디터 */}
            <textarea
              className="w-full h-40 p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none text-slate-800 font-semibold text-xs leading-relaxed"
              placeholder="여기에 보낼 메시지를 입력하세요... (변수: {이름}, {연락처})"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            {message && (
              <div className="mt-2 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <p className="text-xs font-black text-slate-600 mb-2">실제 발송 미리보기:</p>
                <div className="text-xs text-slate-700 whitespace-pre-wrap bg-white p-3 rounded-xl border border-slate-150 leading-relaxed font-semibold">
                  {generateFinalMessage(
                    message, 
                    { id: 0, name: "홍길동", phone: "010-1234-5678", tags: "" }, 
                    isAd, 
                    optOutPhone, 
                    adHeader, 
                    adFooter, 
                    products.find(p => p.id === selectedProductId)
                  )}
                </div>
              </div>
            )}

            {spamRisk.score > 0 && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start text-red-700 text-sm">
                <AlertTriangle className="w-5 h-5 mr-2 shrink-0 text-red-500 animate-bounce" />
                <div>
                  <p className="font-black text-xs">스팸 필터 주의</p>
                  <p className="text-[11px] font-semibold">스팸으로 의심받기 쉬운 키워드가 포함되어 있습니다: <strong>{spamRisk.words.join(", ")}</strong></p>
                </div>
              </div>
            )}

            {/* 발송 하단 액션바 */}
            <div className="flex justify-between items-center mt-4 border-t border-slate-50 pt-4">
              <span className="text-xs font-extrabold text-slate-400">{message.length} / 2000 자</span>
              <div className="flex space-x-2">
                <button 
                  onClick={async () => {
                    const title = prompt("현재 작성된 메시지를 템플릿으로 저장합니다. 템플릿의 제목을 입력하세요:");
                    if (!title) return;
                    try {
                      const res = await fetch('/api/message-templates', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ title, content: message })
                      });
                      const json = await res.json();
                      if (json.success) {
                        setMessageTemplates([...messageTemplates, json.template]);
                        alert("템플릿이 저장되었습니다.");
                      } else {
                        alert("저장 실패: " + json.error);
                      }
                    } catch (e) {
                      alert("템플릿 저장 중 오류가 발생했습니다.");
                    }
                  }}
                  className="px-4 py-2 border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-xs font-extrabold cursor-pointer"
                >
                  + 템플릿으로 저장
                </button>
                <button 
                  onClick={() => {
                    setTestDeviceId(selectedDeviceId);
                    setShowTestModal(true);
                  }}
                  disabled={isSending}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-xs font-extrabold cursor-pointer"
                >
                  테스트 발송
                </button>
                <button 
                  onClick={handleSend}
                  disabled={isSending}
                  className={`px-6 py-2 rounded-lg font-extrabold text-xs transition-all flex items-center text-white cursor-pointer ${
                    isSending ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'
                  }`}
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {isSending ? `발송 중... (${sendProgress.current}/${sendProgress.total})` : '본 발송하기'}
                </button>
              </div>
            </div>

            {isSending && sendProgress.total > 0 && (
              <div className="mt-4">
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full transition-all duration-500" style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}></div>
                </div>
                <p className="text-center text-[10px] text-slate-500 mt-2 font-semibold">기계적 발송 정지 제재를 피하기 위해 랜덤한 대기 시간을 두고 순차 안전 발송합니다.</p>
              </div>
            )}
          </div>

          {/* 발송 대상 선택 영역 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4 border-b border-slate-50 pb-3">
              <h2 className="text-base font-black text-slate-800">발송 대상 선택</h2>
              <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button 
                  onClick={() => setTargetMode('db')}
                  className={`px-4 py-1.5 text-xs font-extrabold rounded-md transition-colors cursor-pointer ${targetMode === 'db' ? 'bg-white text-blue-650 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  DB 연동
                </button>
                <button 
                  onClick={() => setTargetMode('excel')}
                  className={`px-4 py-1.5 text-xs font-extrabold rounded-md transition-colors cursor-pointer ${targetMode === 'excel' ? 'bg-white text-blue-650 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  엑셀 직접 업로드
                </button>
              </div>
            </div>
            
            {targetMode === 'db' ? (
              <>
                <div className="flex justify-between items-center gap-3 mb-4">
                  <div className="relative max-w-xs flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="이름, 연락처, 태그로 검색..."
                      value={dbSearchQuery}
                      onChange={e => setDbSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={fetchCustomers} className="text-xs font-bold text-blue-600 hover:underline cursor-pointer">새로고침</button>
                  </div>
                </div>

                <div className="border border-slate-150 rounded-2xl overflow-hidden h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse relative">
                    <thead className="bg-slate-50 text-slate-600 sticky top-0 shadow-xs z-10 font-bold">
                      <tr>
                        <th className="p-4 w-12 text-center">
                          <input 
                            type="checkbox" 
                            className="rounded text-blue-600 cursor-pointer focus:ring-0" 
                            checked={paginatedDbCustomers.length > 0 && paginatedDbCustomers.every(c => selectedIds.has(c.id))}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="p-4 font-bold text-[10px]">이름</th>
                        <th className="p-4 font-bold text-[10px]">연락처</th>
                        <th className="p-4 font-bold text-[10px]">태그 (메모)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {paginatedDbCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-slate-455 font-bold font-sans">
                            {dbSearchQuery ? "검색 결과와 일치하는 고객이 없습니다." : "등록된 고객이 없습니다. 고객 관리 메뉴에서 등록해주세요."}
                          </td>
                        </tr>
                      ) : (
                        paginatedDbCustomers.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50/70 cursor-pointer transition-colors" onClick={() => toggleSelect(c.id)}>
                            <td className="p-4 text-center animate-none" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                className="rounded text-blue-600 cursor-pointer focus:ring-0" 
                                checked={selectedIds.has(c.id)}
                                onChange={() => toggleSelect(c.id)}
                              />
                            </td>
                            <td className="p-4 font-black text-slate-800">{c.name}</td>
                            <td className="p-4 font-mono font-bold text-slate-500">{c.phone}</td>
                            <td className="p-4">
                              {c.tags && <span className="bg-blue-50 text-blue-750 px-2 py-0.5 rounded border border-blue-100 text-[10px] font-bold">{c.tags}</span>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">페이지당 표시:</span>
                    <select 
                      value={dbItemsPerPage} 
                      onChange={e => {
                        setDbItemsPerPage(Number(e.target.value));
                        setDbCurrentPage(1);
                      }} 
                      className="border rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-bold cursor-pointer text-slate-700 focus:border-blue-500"
                    >
                      <option value={5}>5명씩 보기</option>
                      <option value={10}>10명씩 보기</option>
                      <option value={20}>20명씩 보기</option>
                      <option value={50}>50명씩 보기</option>
                    </select>
                    <span className="text-xs text-slate-400 font-semibold ml-2">
                      {filteredDbCustomers.length === 0 
                        ? "전체 0명 표시" 
                        : `전체 ${filteredDbCustomers.length}명 중 ${startDbIndex + 1}-${Math.min(endDbIndex, filteredDbCustomers.length)}명 표시`}
                    </span>
                    <span className="text-xs text-blue-600 font-extrabold ml-2">
                      ({selectedIds.size}명 선택됨)
                    </span>
                  </div>
                  
                  <div className="flex space-x-1">
                    <button 
                      disabled={dbCurrentPage === 1 || totalDbPages <= 1}
                      onClick={() => setDbCurrentPage(prev => Math.max(1, prev - 1))}
                      className="px-3 py-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-655 cursor-pointer disabled:cursor-not-allowed transition-all"
                    >
                      이전
                    </button>
                    {totalDbPages <= 1 ? (
                      <button 
                        disabled
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm border border-blue-600 cursor-not-allowed"
                      >
                        1
                      </button>
                    ) : (
                      Array.from({ length: totalDbPages }, (_, i) => i + 1).map(page => (
                        <button 
                          key={page}
                          onClick={() => setDbCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            dbCurrentPage === page 
                              ? 'bg-blue-600 text-white shadow-sm border border-blue-600' 
                              : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer'
                          }`}
                        >
                          {page}
                        </button>
                      ))
                    )}
                    <button 
                      disabled={dbCurrentPage === totalDbPages || totalDbPages <= 1}
                      onClick={() => setDbCurrentPage(prev => Math.min(totalDbPages, prev + 1))}
                      className="px-3 py-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-655 cursor-pointer disabled:cursor-not-allowed transition-all"
                    >
                      다음
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="text-xs text-slate-500 font-semibold leading-relaxed">
                    첫 줄에 <strong className="text-blue-600 font-extrabold">이름, 연락처</strong> 열이 포함된 엑셀 파일을 업로드하세요.
                  </div>
                  <div className="flex space-x-2 w-auto">
                    <button 
                      onClick={downloadSampleExcel}
                      className="px-3 py-2 text-xs font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" />
                      양식 다운로드
                    </button>
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv" 
                      ref={fileInputRef}
                      onChange={handleExcelUpload}
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center justify-center shadow-sm cursor-pointer border-none"
                    >
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      엑셀 파일 첨부
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-3 mb-4">
                  <div className="relative max-w-xs flex-1">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input 
                      type="text"
                      placeholder="이름, 연락처, 태그로 검색..."
                      value={excelSearchQuery}
                      onChange={e => setExcelSearchQuery(e.target.value)}
                      className="pl-9 pr-4 py-2 w-full text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 font-semibold"
                    />
                  </div>
                </div>

                <div className="border border-slate-150 rounded-2xl overflow-hidden h-64 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse relative">
                    <thead className="bg-slate-50 text-slate-600 sticky top-0 shadow-xs z-10 font-bold">
                      <tr>
                        <th className="p-4 w-12 text-center">
                          <input 
                            type="checkbox" 
                            className="rounded text-blue-600 cursor-pointer focus:ring-0" 
                            checked={paginatedExcelCustomers.length > 0 && paginatedExcelCustomers.every(c => selectedExcelIds.has(c.id))}
                            onChange={toggleSelectAll}
                          />
                        </th>
                        <th className="p-4 font-bold text-[10px]">이름</th>
                        <th className="p-4 font-bold text-[10px]">연락처</th>
                        <th className="p-4 font-bold text-[10px]">태그 (메모)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {paginatedExcelCustomers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-12 text-center text-slate-455 font-bold font-sans">
                            <div className="flex flex-col items-center justify-center space-y-3">
                              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center">
                                <FileText className="w-6 h-6 text-slate-400" />
                              </div>
                              <p className="leading-relaxed">
                                {excelSearchQuery 
                                  ? "검색 결과와 일치하는 고객이 없습니다." 
                                  : <>업로드된 고객 명단이 없습니다.<br/>우측 상단의 <strong>[엑셀 파일 첨부]</strong> 버튼을 눌러 파일을 등록해주세요.</>}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedExcelCustomers.map(c => (
                          <tr key={c.id} className="hover:bg-slate-50/70 cursor-pointer transition-colors" onClick={() => toggleSelect(c.id)}>
                            <td className="p-4 text-center animate-none" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="checkbox" 
                                className="rounded text-blue-600 cursor-pointer focus:ring-0" 
                                checked={selectedExcelIds.has(c.id)}
                                onChange={() => toggleSelect(c.id)}
                              />
                            </td>
                            <td className="p-4 font-black text-slate-800">{c.name}</td>
                            <td className="p-4 font-mono font-bold text-slate-505">{c.phone}</td>
                            <td className="p-4">
                              {c.tags && <span className="bg-blue-50 text-blue-750 px-2 py-0.5 rounded border border-blue-100 text-[10px] font-bold">{c.tags}</span>}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">페이지당 표시:</span>
                    <select 
                      value={excelItemsPerPage} 
                      onChange={e => {
                        setExcelItemsPerPage(Number(e.target.value));
                        setExcelCurrentPage(1);
                      }} 
                      className="border rounded-lg px-2.5 py-1.5 text-xs outline-none bg-white font-bold cursor-pointer text-slate-700 focus:border-blue-500"
                    >
                      <option value={5}>5명씩 보기</option>
                      <option value={10}>10명씩 보기</option>
                      <option value={20}>20명씩 보기</option>
                      <option value={50}>50명씩 보기</option>
                    </select>
                    <span className="text-xs text-slate-400 font-semibold ml-2">
                      {filteredExcelCustomers.length === 0 
                        ? "전체 0명 표시" 
                        : `전체 ${filteredExcelCustomers.length}명 중 ${startExcelIndex + 1}-${Math.min(endExcelIndex, filteredExcelCustomers.length)}명 표시`}
                    </span>
                    <span className="text-xs text-blue-650 font-extrabold ml-2">
                      ({selectedExcelIds.size}명 선택됨)
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {selectedExcelIds.size > 0 && (
                      <button 
                        onClick={handleDeleteSelectedExcel}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-600 rounded-lg border border-red-100 transition-colors flex items-center shadow-2xs mr-2 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5 mr-1" />
                        선택 삭제
                      </button>
                    )}

                    <div className="flex space-x-1">
                      <button 
                        disabled={excelCurrentPage === 1 || totalExcelPages <= 1}
                        onClick={() => setExcelCurrentPage(prev => Math.max(1, prev - 1))}
                        className="px-3 py-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-655 cursor-pointer disabled:cursor-not-allowed transition-all"
                      >
                        이전
                      </button>
                      {totalExcelPages <= 1 ? (
                        <button 
                          disabled
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 text-white shadow-sm border border-blue-600 cursor-not-allowed"
                        >
                          1
                        </button>
                      ) : (
                        Array.from({ length: totalExcelPages }, (_, i) => i + 1).map(page => (
                          <button 
                            key={page}
                            onClick={() => setExcelCurrentPage(page)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              excelCurrentPage === page 
                                ? 'bg-blue-600 text-white shadow-sm border border-blue-600' 
                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 cursor-pointer'
                            }`}
                          >
                            {page}
                          </button>
                        ))
                      )}
                      <button 
                        disabled={excelCurrentPage === totalExcelPages || totalExcelPages <= 1}
                        onClick={() => setExcelCurrentPage(prev => Math.min(totalExcelPages, prev + 1))}
                        className="px-3 py-1.5 border border-slate-200 rounded hover:bg-slate-50 disabled:opacity-50 text-xs font-bold text-slate-655 cursor-pointer disabled:cursor-not-allowed transition-all"
                      >
                        다음
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 우측 3번째 열 (기기관리 및 개인 템플릿 모음) */}
        <div className="space-y-6">
          <div 
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)' }}
            className="p-6 rounded-2xl shadow-md text-white border border-indigo-500/20"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center justify-between border-b border-white/10 pb-3">
              <span className="flex items-center text-sm font-extrabold">
                <Smartphone className="w-5 h-5 mr-2 animate-pulse" />
                발송 기기 멀티 허브
              </span>
              <button 
                onClick={() => setShowAddDeviceModal(true)}
                className="bg-white/20 hover:bg-white/30 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl border border-white/10 transition-all active:scale-95 cursor-pointer"
              >
                + 기기 추가
              </button>
            </h2>

            {/* 활성 기기 선택 */}
            <div className="mb-4 bg-white/10 p-3 rounded-xl border border-white/5">
              <label className="text-[10px] font-black text-indigo-200 block mb-1">📢 현재 문자 전송용 활성 기기</label>
              <select
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="w-full bg-indigo-900/40 border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-extrabold text-[11px] outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
              >
                {smsDevices.map(d => (
                  <option key={d.phoneNumber} value={d.phoneNumber} className="text-slate-800 font-bold text-xs">
                    {d.name} ({d.phoneNumber === "default" ? "기본" : d.phoneNumber})
                  </option>
                ))}
              </select>
            </div>

            {/* 기기 리스트 */}
            <div className="space-y-3 mt-4 max-h-[380px] overflow-y-auto pr-1">
              {smsDevices.map((dev) => (
                <div key={dev.phoneNumber} className="bg-white/10 hover:bg-white/15 p-3.5 rounded-xl backdrop-blur-sm border border-white/5 space-y-2.5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1.5 truncate flex-1 pr-2">
                      <div className="flex items-center gap-2 truncate">
                        <span className={`inline-flex items-center gap-1.5 text-[9px] px-2 py-0.5 rounded-full font-black border tracking-wider shrink-0 transition-all select-none ${
                          dev.isConnected 
                            ? "bg-green-500/20 text-green-300 border-green-400/30 shadow-inner" 
                            : "bg-red-500/20 text-red-300 border-red-400/30"
                        }`}>
                          <span 
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ${dev.isConnected ? "animate-pulse shadow-sm" : ""}`} 
                            style={{ 
                              backgroundColor: dev.isConnected ? '#4ade80' : '#f87171',
                              boxShadow: dev.isConnected ? '0 0 8px #4ade80' : '0 0 6px #f87171'
                            }}
                          />
                          {dev.isConnected ? "연동 완료" : "미연동"}
                        </span>
                        <span className="font-extrabold text-xs text-white truncate">{dev.name}</span>
                      </div>
                      <p className="text-[9px] text-indigo-205 font-mono">
                        {dev.phoneNumber === "default" ? "기본 세션 연동" : dev.phoneNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => handlePairing(dev.phoneNumber)}
                        disabled={isPairing}
                        className="bg-white hover:bg-slate-100 text-indigo-650 font-black text-[9px] px-2.5 py-1.5 rounded-lg shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {isPairing && selectedDeviceId === dev.phoneNumber ? "대기중" : dev.isConnected ? "재연동" : "연동"}
                      </button>
                      {dev.phoneNumber !== "default" && (
                        <button 
                          onClick={() => handleDeleteDevice(dev.phoneNumber)}
                          className="bg-red-500/20 hover:bg-red-500/30 text-red-200 hover:text-red-100 text-[9px] px-2 py-1.5 rounded-lg border border-red-500/10 transition-colors cursor-pointer"
                          title="기기 분리"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 오늘 발송 진척도 바 & 뱃지 */}
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[9px] text-indigo-200 font-bold">
                      <span>오늘 사용량: <strong className="text-white">{dev.todaySent ?? 0}건</strong> / {dev.dailyLimit ?? 150}건</span>
                      <span className="font-mono">{Math.round(((dev.todaySent ?? 0) / (dev.dailyLimit ?? 150)) * 100)}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${Math.min(100, ((dev.todaySent ?? 0) / (dev.dailyLimit ?? 150)) * 100)}%` }} 
                        className={`h-full transition-all ${dev.todaySent >= dev.dailyLimit ? "bg-amber-400" : "bg-green-400"}`}
                      />
                    </div>
                  </div>

                  {/* 개별 한도 조절 슬라이더 */}
                  <div className="bg-indigo-950/20 p-2.5 rounded-lg border border-white/5 space-y-1">
                    <div className="flex justify-between items-center text-[9px] text-indigo-200 font-bold">
                      <span>🛡️ 일일 전송 제한량</span>
                      <div className="flex items-center gap-0.5">
                        <input 
                          type="number"
                          min={1}
                          max={450}
                          value={dev.dailyLimit ?? 150}
                          onChange={(e) => {
                            const val = Math.min(450, Math.max(1, Number(e.target.value)));
                            handleUpdateDeviceLimit(dev.phoneNumber, isNaN(val) ? 150 : val);
                          }}
                          className="w-10 bg-indigo-900/40 border border-white/10 rounded px-1 text-center font-black text-white text-[9px] focus:outline-none"
                        />
                        <span>건</span>
                      </div>
                    </div>
                    <input 
                      type="range"
                      min={1}
                      max={450}
                      step={5}
                      value={dev.dailyLimit ?? 150}
                      onChange={(e) => handleUpdateDeviceLimit(dev.phoneNumber, Number(e.target.value))}
                      className="w-full h-1 bg-white/10 rounded appearance-none cursor-pointer accent-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            {isPairing && (
              <p className="text-[10px] mt-4 text-center text-indigo-200 animate-pulse font-bold">
                ⚠️ 새 브라우저 창에 생성된 QR코드를 스캔해주세요 (최대 2분 대기).
              </p>
            )}
          </div>
          
          {/* 내 템플릿 모음 */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-h-[500px] flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center justify-between border-b border-slate-50 pb-3">
              내 템플릿 모음
              <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{messageTemplates.length}개</span>
            </h2>
            <div className="space-y-3 overflow-y-auto flex-1 pr-2">
              {messageTemplates.length === 0 ? (
                <div className="text-xs text-slate-500 text-center py-8 font-semibold">
                  저장된 템플릿이 없습니다.<br/>문자 작성 창에서 저장해보세요.
                </div>
              ) : (
                messageTemplates.map(t => (
                  <div key={t.id} className="group border border-slate-200 rounded-lg hover:border-blue-500 transition-colors bg-white overflow-hidden flex flex-col shadow-2xs">
                    <div className="flex justify-between items-center p-3 pb-2 border-b border-slate-50 bg-slate-50/50">
                      <p className="font-extrabold text-slate-800 text-sm truncate pr-2">{t.title}</p>
                      <div className="flex space-x-1 shrink-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTemplate(t);
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                          title="수정"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!confirm("이 템플릿을 삭제하시겠습니까?")) return;
                            try {
                              await fetch(`/api/message-templates?id=${t.id}`, { method: 'DELETE' });
                              setMessageTemplates(messageTemplates.filter(x => x.id !== t.id));
                            } catch (e) {
                              alert("삭제 중 오류가 발생했습니다.");
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-650 hover:bg-red-100 rounded transition-colors cursor-pointer"
                          title="삭제"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <button 
                      onClick={() => setMessage(t.content)} 
                      className="w-full text-left p-3 pt-2 hover:bg-blue-50 transition-colors cursor-pointer"
                    >
                      <p className="text-xs text-slate-655 line-clamp-2 leading-relaxed font-semibold">{t.content}</p>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 3대 분리된 모달 컴포넌트 렌더링 영역 */}
      {/* ============================================================ */}

      {/* SmsTestSendModal: 테스트 문자 미리보기 및 전송 모달 */}
      <SmsTestSendModal
        isOpen={showTestModal}
        onClose={() => setShowTestModal(false)}
        testPhone={testPhone}
        setTestPhone={setTestPhone}
        testDeviceId={testDeviceId}
        setTestDeviceId={setTestDeviceId}
        smsDevices={smsDevices}
        isSending={isSending}
        handleTestSend={handleTestSend}
      />

      {/* SmsTemplateEditModal: 템플릿 작성 및 편집 모달 */}
      <SmsTemplateEditModal
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        editingTemplate={editingTemplate}
        setEditingTemplate={setEditingTemplate}
        messageTemplates={messageTemplates}
        setMessageTemplates={setMessageTemplates}
      />

      {/* SmsDeviceAddModal: 발송 기기 추가 모달 */}
      <SmsDeviceAddModal
        isOpen={showAddDeviceModal}
        onClose={() => setShowAddDeviceModal(false)}
        newDeviceName={newDeviceName}
        setNewDeviceName={setNewDeviceName}
        newDevicePhone={newDevicePhone}
        setNewDevicePhone={setNewDevicePhone}
        isAddingDevice={isAddingDevice}
        handleAddDevice={handleAddDevice}
      />

    </div>
  );
}
