"use client";

import { usePathname } from "next/navigation";

export default function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (
    pathname === '/login' || 
    pathname.startsWith('/form-management-new/print') || 
    pathname.startsWith('/shared/view') || 
    pathname.startsWith('/store') || 
    pathname.startsWith('/table-order') || 
    pathname.startsWith('/booking') || 
    pathname === '/m' || 
    pathname.startsWith('/m/') || 
    pathname.startsWith('/expenses/mobile-approve') ||
    pathname.startsWith('/employee')
  ) {
    return <>{children}</>;
  }

  return <div className="p-8 min-h-full w-full overflow-x-hidden">{children}</div>;
}
