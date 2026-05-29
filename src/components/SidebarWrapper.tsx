"use client";

import { usePathname } from "next/navigation";

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === '/login' || pathname.startsWith('/store') || pathname.startsWith('/table-order') || pathname.startsWith('/booking') || pathname.startsWith('/m/') || pathname.startsWith('/expenses/mobile-approve')) {
    return null;
  }

  return <>{children}</>;
}
