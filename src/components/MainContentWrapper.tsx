"use client";

import { usePathname } from "next/navigation";

export default function MainContentWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname === '/login' || pathname.startsWith('/store')) {
    return <>{children}</>;
  }

  return <div className="p-8 h-full w-full">{children}</div>;
}
