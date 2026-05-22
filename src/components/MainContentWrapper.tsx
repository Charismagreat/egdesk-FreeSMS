"use client";

import { usePathname } from "next/navigation";

export default function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === '/login' || pathname.startsWith('/store') || pathname.startsWith('/table-order') || pathname.startsWith('/booking') || pathname.startsWith('/m/')) {
    return <>{children}</>;
  }

  return <div className="p-8 min-h-full w-full overflow-x-hidden">{children}</div>;
}
