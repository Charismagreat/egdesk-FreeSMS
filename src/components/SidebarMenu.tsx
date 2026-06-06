"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Users, MessageSquare, Settings, ShoppingCart, 
  ClipboardList, CreditCard, CalendarDays, Truck, Send, 
  PackageSearch, Package, UserCog, Zap, Ticket, Landmark, Globe, Briefcase, HelpCircle,
  ArrowRightLeft, Handshake, Sparkles, Coins, Database, Compass, Shield, CheckSquare, Wrench, ShieldAlert
} from "lucide-react";

// 커스텀 인스타그램 아이콘 SVG
function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

// 커스텀 네이버 아이콘 SVG
function NaverIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path d="M16.2 3H21v18h-4.8l-7.4-11V21H4V3h4.8l7.4 11V3z"/>
    </svg>
  );
}

// 커스텀 유튜브 아이콘 SVG
function YoutubeIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.108C19.517 3.545 12 3.545 12 3.545s-7.516 0-9.387.51a3.003 3.003 0 0 0-2.11 2.108C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.108c1.871.51 9.387.51 9.387.51s7.517 0 9.387-.51a3.003 3.003 0 0 0 2.11-2.108C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );
}

// 메뉴 메타데이터 정적 맵 정의
const MENU_STATIC_MAP: Record<string, { label: string; icon: any; color: string }> = {
  "/": { label: "대시보드", icon: Home, color: "text-blue-400" },
  "/sms": { label: "무료 문자 발송 AI", icon: MessageSquare, color: "text-purple-400" },
  "/message-logs": { label: "발송 내역 조회", icon: Send, color: "text-purple-400" },
  "/automation": { label: "자동 발송 설정", icon: Zap, color: "text-yellow-400" },
  "/customers": { label: "고객 관리 AI", icon: Users, color: "text-green-400" },
  "/partners": { label: "거래처 관리 AI", icon: Handshake, color: "text-emerald-400" },
  "/transactions": { label: "거래 관리 AI", icon: ShoppingCart, color: "text-orange-400" },
  "/orders": { label: "주문 관리 AI", icon: ClipboardList, color: "text-blue-400" },
  "/payments": { label: "결제 관리 AI", icon: CreditCard, color: "text-emerald-400" },
  "/finance": { label: "금융 정보 AI", icon: Landmark, color: "text-sky-400" },
  "/coupons": { label: "쿠폰 관리 AI", icon: Ticket, color: "text-rose-400" },
  "/reservations": { label: "예약 관리 AI", icon: CalendarDays, color: "text-indigo-400" },
  "/deliveries": { label: "배송 관리 AI", icon: Truck, color: "text-amber-400" },
  "/products": { label: "상품 관리 AI", icon: PackageSearch, color: "text-blue-400" },
  "/estimates": { label: "견적/발주/수주 AI", icon: ArrowRightLeft, color: "text-indigo-400" },
  "/snaptasks": { label: "AI 스냅태스크", icon: Sparkles, color: "text-indigo-450" },
  "/inventory": { label: "재고 관리 AI", icon: Package, color: "text-cyan-400" },
  "/expenses": { label: "지출 관리 AI", icon: Coins, color: "text-rose-400" },
  "/safety-management": { label: "안전 관리 AI", icon: Shield, color: "text-red-400" },
  "/quality-control": { label: "품질 관리 AI", icon: CheckSquare, color: "text-indigo-400" },
  "/hr/attendance": { label: "근태 관리 AI", icon: CalendarDays, color: "text-indigo-400" },
  "/price-tracker": { label: "가격 추적 AI", icon: Zap, color: "text-pink-400" },
  "/website": { label: "홈페이지 빌더 AI", icon: Globe, color: "text-sky-400" },
  "/recruitment": { label: "채용 매니저 AI", icon: Briefcase, color: "text-rose-400" },
  "/instagram": { label: "인스타그램 마케팅 AI", icon: InstagramIcon, color: "text-[#ff007f]" },
  "/naver-blog": { label: "N-BLOG 포스팅 AI", icon: NaverIcon, color: "text-[#2db400]" },
  "/youtube-shorts": { label: "YOUTUBE 쇼츠 AI", icon: YoutubeIcon, color: "text-[#FF0000]" },
  "/knowledge-ai": { label: "지식 관리 AI", icon: Compass, color: "text-indigo-400" },
  "/ecount-erp-ai": { label: "이카운트 ERP AI", icon: ArrowRightLeft, color: "text-sky-400" },
  "/ai-briefing": { label: "AI 브리핑", icon: Sparkles, color: "text-indigo-400" },
  "/facility-management": { label: "설비 관리 AI", icon: Wrench, color: "text-amber-400" },
  "/finance-cashflow": { label: "자금/원가 AI", icon: Coins, color: "text-amber-400" },
  "/production-plan": { label: "생산 계획 AI", icon: CalendarDays, color: "text-indigo-400" },
  "/energy-management": { label: "에너지 관리 AI", icon: Zap, color: "text-amber-400" },
  "/safety-detection": { label: "위험 감지 AI", icon: ShieldAlert, color: "text-red-400" }
};

interface SidebarMenuProps {
  userRole: string;
}

interface MenuSettingItem {
  menu_href: string;
  is_enabled: number;
  sort_order: number;
}

export default function SidebarMenu({ userRole }: SidebarMenuProps) {
  const pathname = usePathname();
  
  // 1. 초기 렌더링 시 깜빡임이나 공백 방지를 위해 정적 기본 배열로 초기값 바인딩
  const getInitialDefaultItems = () => {
    const baseItems = Object.entries(MENU_STATIC_MAP).map(([href, meta]) => ({
      href,
      label: meta.label,
      icon: meta.icon,
      color: meta.color
    }));
    // 일반 계정일 경우 AI 브리핑은 제외
    return baseItems.filter(item => {
      if (item.href === "/ai-briefing") {
        return userRole === "SUPER_ADMIN";
      }
      return true;
    });
  };

  const [displayMenuItems, setDisplayMenuItems] = useState<any[]>(getInitialDefaultItems());

  // 활성화 메뉴 감지 도우미
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  // 2. 동적 메뉴 데이터 가져오기 및 권한별 필터링/정렬 수행 함수
  const fetchAndApplyMenuSettings = async () => {
    try {
      const res = await fetch("/api/settings/menu");
      const data = await res.json();

      if (data.success && data.menuSettings) {
        const settings: MenuSettingItem[] = data.menuSettings;

        // DB 설정을 토대로 활성화 및 순서 결합
        const resolved = settings
          .filter(setting => {
            // (1) 비활성화된 메뉴 숨김
            if (setting.is_enabled !== 1) return false;
            // (2) AI 브리핑은 데이터베이스에 켜져 있더라도 최고관리자만 노출
            if (setting.menu_href === "/ai-briefing") {
              return userRole === "SUPER_ADMIN";
            }
            return true;
          })
          .map(setting => {
            const meta = MENU_STATIC_MAP[setting.menu_href] || { label: setting.menu_href, icon: HelpCircle, color: "text-slate-400" };
            return {
              href: setting.menu_href,
              label: meta.label,
              icon: meta.icon,
              color: meta.color,
              sort_order: setting.sort_order
            };
          });

        setDisplayMenuItems(resolved);
      }
    } catch (e) {
      console.error("사이드바 메뉴 동적 로딩 실패, 로컬 폴백 유지:", e);
    }
  };

  // 3. 마운트 시 동작 및 실시간 이벤트 리스너 등록
  useEffect(() => {
    fetchAndApplyMenuSettings();

    // 최고관리자 카드 저장 시 실시간 동기화를 위한 이벤트 청취
    window.addEventListener("menu-settings-updated", fetchAndApplyMenuSettings);

    return () => {
      window.removeEventListener("menu-settings-updated", fetchAndApplyMenuSettings);
    };
  }, [userRole]);

  return (
    <>
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800/80 scrollbar-track-transparent">
        {displayMenuItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                active
                  ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/10 scale-[1.02]"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white hover:scale-[1.01]"
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 transition-colors ${active ? "text-white" : item.color}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      
      {/* 하단 고정 메뉴 영역 */}
      <div className="p-4 border-t border-slate-700/80 bg-slate-900/95 backdrop-blur-md space-y-2 shadow-[0_-12px_24px_-8px_rgba(0,0,0,0.8)] relative z-10">
        {userRole === "SUPER_ADMIN" && (
          <>
            <Link
              href="/operators"
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                isActive("/operators")
                  ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/10 scale-[1.02]"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white hover:scale-[1.01]"
              }`}
            >
              <UserCog className={`w-5 h-5 shrink-0 ${isActive("/operators") ? "text-white" : "text-indigo-400"}`} />
              <span>운영자 관리</span>
            </Link>

            <Link
              href="/my-db"
              className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
                isActive("/my-db")
                  ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/10 scale-[1.02]"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white hover:scale-[1.01]"
              }`}
            >
              <Database className={`w-5 h-5 shrink-0 ${isActive("/my-db") ? "text-white" : "text-indigo-400"}`} />
              <span>MY DB</span>
            </Link>
          </>
        )}
        <Link
          href="/help"
          className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
            isActive("/help")
              ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/10 scale-[1.02]"
              : "text-slate-300 hover:bg-slate-800 hover:text-white hover:scale-[1.01]"
          }`}
        >
          <HelpCircle className={`w-5 h-5 shrink-0 ${isActive("/help") ? "text-white" : "text-amber-400"}`} />
          <span>Q&A 헬프센터</span>
        </Link>
        <Link
          href="/settings"
          className={`flex items-center space-x-3 p-3 rounded-lg transition-all ${
            isActive("/settings")
              ? "bg-blue-600 text-white font-semibold shadow-md shadow-blue-500/10 scale-[1.02]"
              : "text-slate-300 hover:bg-slate-800 hover:text-white hover:scale-[1.01]"
          }`}
        >
          <Settings className={`w-5 h-5 shrink-0 ${isActive("/settings") ? "text-white" : "text-slate-400"}`} />
          <span>시스템 설정</span>
        </Link>
      </div>
    </>
  );
}
