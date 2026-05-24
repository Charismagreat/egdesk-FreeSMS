"use client";

import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  Smartphone, 
  Calendar, 
  UserPlus, 
  Camera, 
  Copy, 
  QrCode, 
  MessageSquare, 
  ExternalLink, 
  Printer, 
  Download, 
  Check, 
  X,
  ChevronRight,
  Info,
  Handshake
} from "lucide-react";

interface MobileChannel {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: React.ComponentType<any>;
  themeColor: string; // Tailwind class prefix, e.g., 'blue', 'rose'
  badge: string;
  smsTemplate: string;
}

export default function MobileHubWidget() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeQrChannel, setActiveQrChannel] = useState<MobileChannel | null>(null);
  const [hostUrl, setHostUrl] = useState("");

  // 클라이언트 사이드에서 호스트 URL 확보
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHostUrl(window.location.origin);
    }
  }, []);

  const channels: MobileChannel[] = [
    {
      id: "store",
      name: "스마트 주문 스토어",
      description: "AI 음성 비서 탑재 및 한정 쿠폰 혜택으로 온라인 주문을 유도하는 사장님의 가상 온라인 스토어",
      path: "/store",
      icon: ShoppingBag,
      themeColor: "from-blue-600 to-indigo-600 bg-blue-50 text-blue-600 border-blue-100",
      badge: "온라인/단골 타겟",
      smsTemplate: "[이지데스크] 사장님 추천! 아래 링크에서 간편하게 상품 확인하시고 쿠폰 혜택과 함께 AI 음성 주문을 이용해보세요! "
    },
    {
      id: "table-order",
      name: "매장 테이블 오더",
      description: "비대면으로 각 테이블에서 QR코드로 즉시 주문하고 사장님 어드민에 연동되는 테이블 무인 오더서",
      path: "/table-order/1",
      icon: Smartphone,
      themeColor: "from-rose-600 to-red-600 bg-rose-50 text-rose-600 border-rose-100",
      badge: "매장 내 방문객 타겟",
      smsTemplate: "[이지데스크] 매장 방문 감사드립니다! 테이블 번호 1번의 실시간 테이블 오더 주문 링크입니다. 편하게 이용해주세요. "
    },
    {
      id: "booking",
      name: "실시간 모바일 예약",
      description: "전화 상담 없이 고객이 24시간 언제 어디서나 모바일로 방문/대기 예약을 접수하는 자동 예약 창구",
      path: "/booking",
      icon: Calendar,
      themeColor: "from-purple-600 to-violet-600 bg-purple-50 text-purple-600 border-purple-100",
      badge: "대기/예약 타겟",
      smsTemplate: "[이지데스크] 저희 매장 예약을 환영합니다! 아래 모바일 링크를 통해 날짜와 인원을 기입하시면 간편하게 접수 완료됩니다. "
    },
    {
      id: "recruitment",
      name: "구직자 모바일 접수",
      description: "알바 및 직원 채용 프로세스를 깔끔한 양식으로 자동화하여 면접 대상자를 손쉽게 수집하는 채용서",
      path: "/m/recruitment",
      icon: UserPlus,
      themeColor: "from-emerald-600 to-teal-600 bg-emerald-50 text-emerald-600 border-emerald-100",
      badge: "구인/HR 최적화",
      smsTemplate: "[이지데스크] 직영점 채용 공고에 관심을 가져주셔서 감사합니다. 아래 모바일 지원서를 작성하여 제출해 주시기 바랍니다. "
    },
    {
      id: "order-capture",
      name: "현장 주문 캡처",
      description: "근무 중인 현장 직원이 손님 영수증이나 메모를 촬영하여 AI 스캔 주문서로 즉시 등재하는 스태프용 웹",
      path: "/m/order-capture",
      icon: Camera,
      themeColor: "from-amber-600 to-orange-600 bg-amber-50 text-amber-600 border-amber-100",
      badge: "매장 스태프/직원 전용",
      smsTemplate: "[이지데스크] 현장 주문 캡처 웹 링크입니다. 로그인 후 영수증 촬영 및 수기 오더 전송을 진행해주세요. "
    },
    {
      id: "estimate-request",
      name: "B2B 스마트 견적 요청",
      description: "바이어가 모바일에서 자재 수량을 입력하고 사업자 중복 조회 및 AI OCR 스캔 온보딩을 거쳐 신규 가입하는 B2B 바이어 채널",
      path: "/m/estimate-request",
      icon: Handshake,
      themeColor: "from-cyan-600 to-teal-600 bg-cyan-50 text-cyan-600 border-cyan-100",
      badge: "B2B 바이어/구매처 전용",
      smsTemplate: "[이지데스크] B2B 거래처 견적 요청 링크입니다. 사업자번호 입력과 사업자등록증 첨부 시 AI가 정보를 자동 완성해 드립니다. "
    }
  ];

  const handleCopyLink = async (id: string, path: string) => {
    const fullUrl = `${hostUrl}${path}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      alert("클립보드 복사에 실패했습니다. 브라우저 권한을 확인해주세요.");
    }
  };

  const handlePrintQr = () => {
    if (typeof window !== "undefined") {
      const printWindow = window.open("", "_blank");
      if (printWindow && activeQrChannel) {
        const fullUrl = `${hostUrl}${activeQrChannel.path}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(fullUrl)}`;
        
        printWindow.document.write(`
          <html>
            <head>
              <title>QR코드 인쇄 - ${activeQrChannel.name}</title>
              <style>
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  justify-content: center;
                  height: 100vh;
                  margin: 0;
                  background-color: white;
                  color: #1e293b;
                  text-align: center;
                }
                .container {
                  border: 3px double #cbd5e1;
                  padding: 40px;
                  border-radius: 24px;
                  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.05);
                  max-width: 500px;
                }
                .logo {
                  font-size: 28px;
                  font-weight: 900;
                  color: #2563eb;
                  margin-bottom: 5px;
                  letter-spacing: -0.05em;
                }
                .title {
                  font-size: 22px;
                  font-weight: bold;
                  margin: 20px 0 10px 0;
                }
                .desc {
                  font-size: 14px;
                  color: #64748b;
                  margin-bottom: 30px;
                  line-height: 1.5;
                }
                .qr-img {
                  width: 250px;
                  height: 250px;
                  border: 1px solid #f1f5f9;
                  padding: 10px;
                  border-radius: 12px;
                  background: white;
                }
                .footer {
                  margin-top: 30px;
                  font-size: 11px;
                  color: #94a3b8;
                }
                @media print {
                  body { height: auto; }
                  .container { border: none; box-shadow: none; padding: 20px; }
                }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="logo">이지데스크 [FreeSMS]</div>
                <div class="title">${activeQrChannel.name}</div>
                <div class="desc">아래 QR코드를 스마트폰 카메라로 비추면<br/>해당 모바일 서비스로 즉시 이동합니다.</div>
                <img class="qr-img" src="${qrUrl}" alt="QR Code" />
                <div class="footer">본 QR 코드는 이지데스크 매장관리 플랫폼에서 생성되었습니다.</div>
              </div>
              <script>
                window.onload = function() {
                  window.print();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl mb-8">
      {/* 2중 오로라 백그라운드 블러 */}
      <div className="absolute top-[-100px] left-[-100px] w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-100px] right-[-100px] w-[350px] h-[350px] rounded-full bg-red-500/10 blur-[100px] pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1 rounded-full border border-blue-500/30">사장님 전용</span>
              <span className="bg-rose-500/20 text-rose-400 text-xs font-semibold px-3 py-1 rounded-full border border-rose-500/30">스마트 매장 툴</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400 text-transparent">
              스마트 매장 모바일 채널 제어 센터
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              온·오프라인 단골 고객을 모으는 6대 대고객 접점 모바일 채널을 이곳에서 실시간으로 배포하고 홍보하세요.
            </p>
          </div>
        </div>

        {/* 6대 B2B/B2C 채널 목록 - 가로 와이드 콤팩트 리스트 레이아웃 */}
        <div className="grid grid-cols-1 gap-4.5">
          {channels.map((channel) => {
            const Icon = channel.icon;
            const isCopied = copiedId === channel.id;
            const fullUrl = `${hostUrl}${channel.path}`;

            return (
              <div 
                key={channel.id} 
                className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-800/80 hover:border-slate-650 transition-all duration-300 group shadow-sm hover:shadow-md animate-fade-in"
              >
                {/* 왼쪽 영역: 아이콘 + 텍스트 정보 */}
                <div className="flex gap-6 items-start flex-1 min-w-0">
                  <div className={`p-4 rounded-2xl bg-gradient-to-br ${channel.themeColor.split(' ').slice(0, 2).join(' ')} text-white shadow-lg shrink-0 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-white tracking-tight group-hover:text-blue-400 transition-colors">
                        {channel.name}
                      </h3>
                      <span className="text-[9px] font-black bg-slate-700/50 text-slate-300 px-2 py-0.5 rounded border border-slate-700 uppercase tracking-wider">
                        {channel.badge}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed max-w-2xl font-medium">
                      {channel.description}
                    </p>
                  </div>
                </div>

                {/* 오른쪽 영역: 사장님이 제안하신 3대 액션 버튼 정렬 */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-slate-800/60">
                  <button 
                    onClick={() => handleCopyLink(channel.id, channel.path)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-black transition-all ${
                      isCopied 
                        ? "bg-green-600 text-white" 
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/80"
                    }`}
                    title="모바일 링크 복사"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? "복사완료" : "링크 복사"}</span>
                  </button>

                  <button 
                    onClick={() => setActiveQrChannel(channel)}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-black bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/80 transition-all"
                    title="실시간 QR코드 생성"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>QR 보기</span>
                  </button>

                  <a 
                    href={`/sms?message=${encodeURIComponent(channel.smsTemplate + fullUrl)}`}
                    className="flex items-center justify-center gap-1.5 py-2.5 px-4.5 rounded-xl text-xs font-black bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-600/10 transition-all"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>고객에게 발송 (SMS)</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* QR코드 팝업 모달 */}
      {activeQrChannel && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setActiveQrChannel(null)}></div>
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl relative z-10 overflow-hidden text-center p-6 md:p-8">
            <button 
              onClick={() => setActiveQrChannel(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex flex-col items-center mt-2">
              <span className="bg-blue-500/20 text-blue-400 text-xs font-bold px-3 py-1 rounded-full border border-blue-500/30 mb-2">
                오프라인 매장 홍보용 QR
              </span>
              <h3 className="text-xl font-bold text-white mb-1">{activeQrChannel.name}</h3>
              <p className="text-slate-400 text-xs mb-6 max-w-xs leading-relaxed">
                테이블, 카운터, 메뉴판에 인쇄하여 배치하면 단골 고객들이 모바일 페이지로 즉시 접근할 수 있습니다.
              </p>

              {/* QR 이미지 출력 */}
              <div className="bg-white p-4 rounded-2xl shadow-inner border border-slate-700/50 mb-6 flex items-center justify-center">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(`${hostUrl}${activeQrChannel.path}`)}`} 
                  alt={`${activeQrChannel.name} QR Code`} 
                  className="w-48 h-48"
                />
              </div>

              {/* 퀵 주소 안내 */}
              <div className="w-full bg-slate-950/50 rounded-xl p-3 border border-slate-800 text-left font-mono text-xs text-slate-400 break-all flex items-center justify-between gap-2 mb-6">
                <span>{hostUrl}{activeQrChannel.path}</span>
                <a 
                  href={activeQrChannel.path} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="text-blue-400 hover:underline shrink-0 flex items-center gap-0.5"
                >
                  열기 <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 하단 제어 버튼 */}
              <div className="flex gap-3 w-full">
                <a 
                  href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(`${hostUrl}${activeQrChannel.path}`)}&download=1`}
                  download={`${activeQrChannel.id}-qr.png`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-slate-700"
                >
                  <Download className="w-4 h-4" />
                  이미지 다운로드
                </a>
                <button 
                  onClick={handlePrintQr}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  QR코드 인쇄
                </button>
              </div>

              {/* 꿀팁 뱃지 */}
              <div className="mt-6 flex items-start gap-2 text-left bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl w-full">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-300 leading-normal">
                  <span className="font-bold">마케팅 꿀팁:</span> QR코드를 라벨지에 출력하여 컵 홀더나 포장 봉투에 부착하면 매장 재방문율을 300% 이상 끌어올릴 수 있습니다!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
