import Link from 'next/link';
import { Home, Users, MessageSquare, Settings, ShoppingCart, ClipboardList, CreditCard, CalendarDays, Truck, Send, PackageSearch, UserCog, LogOut, Zap, Ticket } from 'lucide-react';
import { cookies } from 'next/headers';
import { decodeJwt } from 'jose';

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

export default async function Sidebar() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  let userName = '운영자';
  let userRole = 'SUB_OPERATOR';

  if (token) {
    try {
      const payload = decodeJwt(token);
      if (payload.name) userName = payload.name as string;
      if (payload.role) userRole = payload.role as string;
    } catch (e) {
      console.error("Invalid token in Sidebar");
    }
  }


  return (
    <div className="w-64 bg-slate-900 text-white h-full min-h-0 flex flex-col shadow-2xl">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
          EGDESK SMS
        </h1>
        <p className="text-sm text-slate-400 mt-1">고객 관리 무료 문자 발송 시스템</p>
      </div>
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        <Link href="/" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-white">
          <Home className="w-5 h-5 text-blue-400" />
          <span>대시보드</span>
        </Link>
        <Link href="/sms" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-white">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <span>문자 발송</span>
        </Link>
        <Link href="/message-logs" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-white">
          <Send className="w-5 h-5 text-purple-400" />
          <span>발송내역 모니터링</span>
        </Link>
        <Link href="/automation" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-white">
          <Zap className="w-5 h-5 text-yellow-400" />
          <span>자동 발송 설정</span>
        </Link>
        <Link href="/customers" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-white">
          <Users className="w-5 h-5 text-green-400" />
          <span>고객 관리</span>
        </Link>
        <Link href="/transactions" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-white">
          <ShoppingCart className="w-5 h-5 text-orange-400" />
          <span>거래내역 관리</span>
        </Link>
        <Link href="/orders" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-white">
          <ClipboardList className="w-5 h-5 text-blue-400" />
          <span>주문내역 관리</span>
        </Link>
        <Link href="/payments" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-white">
          <CreditCard className="w-5 h-5 text-emerald-400" />
          <span>결제내역 관리</span>
        </Link>
        <Link href="/coupons" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-white">
          <Ticket className="w-5 h-5 text-rose-400" />
          <span>쿠폰 관리</span>
        </Link>
        <Link href="/reservations" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-white">
          <CalendarDays className="w-5 h-5 text-indigo-400" />
          <span>예약 관리</span>
        </Link>
        <Link href="/deliveries" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-white">
          <Truck className="w-5 h-5 text-amber-400" />
          <span>배송내역 관리</span>
        </Link>
        <Link href="/products" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-white">
          <PackageSearch className="w-5 h-5 text-pink-400" />
          <span>상품 DB 관리</span>
        </Link>
        <Link href="/instagram" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-white">
          <InstagramIcon className="w-5 h-5 text-[#ff007f]" />
          <span>인스타 AI 마케팅</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-slate-800 space-y-2">
        {userRole === 'SUPER_ADMIN' && (
          <Link href="/operators" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-white">
            <UserCog className="w-5 h-5 text-indigo-400" />
            <span>운영자 관리</span>
          </Link>
        )}
        <Link href="/settings" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-all text-slate-300 hover:text-white">
          <Settings className="w-5 h-5 text-slate-400" />
          <span>시스템 설정</span>
        </Link>
      </div>
      <div className="p-4 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm">
            {userName[0] || 'U'}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-200 leading-tight">{userName}</span>
            <span className="text-[10px] text-slate-500 leading-tight">{userRole === 'SUPER_ADMIN' ? '최고관리자' : '부운영자'}</span>
          </div>
        </div>
        <form action={async () => {
          "use server";
          const { cookies } = await import("next/headers");
          const cookieStore = await cookies();
          cookieStore.delete('auth_token');
          const { redirect } = await import("next/navigation");
          redirect('/login');
        }}>
          <button type="submit" className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="로그아웃">
            <LogOut className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
