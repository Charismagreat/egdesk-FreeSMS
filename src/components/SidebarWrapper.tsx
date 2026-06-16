"use client";

import { usePathname } from "next/navigation";

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === '/login' || pathname.startsWith('/form-management-new/print') || pathname.startsWith('/shared/view') || pathname.startsWith('/store') || pathname.startsWith('/table-order') || pathname.startsWith('/booking') || pathname.startsWith('/m/') || pathname.startsWith('/expenses/mobile-approve') || pathname.startsWith('/employee/business-card')) {
    return null;
  }

  return <>{children}</>;
}
