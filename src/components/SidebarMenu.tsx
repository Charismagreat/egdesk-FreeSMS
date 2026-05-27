"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Users, MessageSquare, Settings, ShoppingCart, 
  ClipboardList, CreditCard, CalendarDays, Truck, Send, 
  PackageSearch, Package, UserCog, Zap, Ticket, Landmark, Globe, Briefcase, HelpCircle,
  ArrowRightLeft, Handshake, Sparkles
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

interface SidebarMenuProps {
  userRole: string;
}

export default function SidebarMenu({ userRole }: SidebarMenuProps) {
  const pathname = usePathname();

  // 활성화 메뉴 감지 도우미
  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  const menuItems = [
    { href: "/", label: "대시보드", icon: Home, color: "text-blue-400" },
    { href: "/sms", label: "무료 문자 발송 AI", icon: MessageSquare, color: "text-purple-400" },
    { href: "/message-logs", label: "발송 내역 조회", icon: Send, color: "text-purple-400" },
    { href: "/automation", label: "자동 발송 설정", icon: Zap, color: "text-yellow-400" },
    { href: "/customers", label: "고객 관리 AI", icon: Users, color: "text-green-400" },
    { href: "/partners", label: "거래처 관리 AI", icon: Handshake, color: "text-emerald-400" },
    { href: "/transactions", label: "거래 관리 AI", icon: ShoppingCart, color: "text-orange-400" },
    { href: "/orders", label: "주문 관리 AI", icon: ClipboardList, color: "text-blue-400" },
    { href: "/payments", label: "결제 관리 AI", icon: CreditCard, color: "text-emerald-400" },
    { href: "/finance", label: "금융 정보 AI", icon: Landmark, color: "text-sky-400" },
    { href: "/coupons", label: "쿠폰 관리 AI", icon: Ticket, color: "text-rose-400" },
    { href: "/reservations", label: "예약 관리 AI", icon: CalendarDays, color: "text-indigo-400" },
    { href: "/deliveries", label: "배송 관리 AI", icon: Truck, color: "text-amber-400" },
    { href: "/products", label: "상품 관리 AI", icon: PackageSearch, color: "text-blue-400" },
    { href: "/estimates", label: "견적/발주/수주 AI", icon: ArrowRightLeft, color: "text-indigo-400" },
    { href: "/snaptasks", label: "AI 스냅태스크", icon: Sparkles, color: "text-indigo-450" },
    { href: "/inventory", label: "재고 관리 AI", icon: Package, color: "text-cyan-400" },
    { href: "/price-tracker", label: "가격 추적 AI", icon: Zap, color: "text-pink-400" },
    { href: "/website", label: "홈페이지 빌더 AI", icon: Globe, color: "text-sky-400" },
    { href: "/recruitment", label: "채용 매니저 AI", icon: Briefcase, color: "text-rose-400" },
    { href: "/instagram", label: "인스타그램 마케팅 AI", icon: InstagramIcon, color: "text-[#ff007f]" },
    { href: "/naver-blog", label: "N-BLOG 포스팅 AI", icon: NaverIcon, color: "text-[#2db400]" },
    { href: "/youtube-shorts", label: "YOUTUBE 쇼츠 AI", icon: YoutubeIcon, color: "text-[#FF0000]" },
  ];

  return (
    <>
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto no-scrollbar">
        {menuItems.map((item) => {
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
      <div className="p-4 border-t border-slate-800 space-y-2">
        {userRole === "SUPER_ADMIN" && (
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
