import React from "react";
import { UserCog } from "lucide-react";

export function OperatorHeader() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-slate-800 flex items-center">
          <UserCog className="w-8 h-8 mr-3 text-indigo-500" />
          운영자 관리
        </h1>
        <p className="text-slate-500 mt-2">
          최고관리자 권한 전용 화면입니다. 부운영자 계정을 생성하고 권한을 관리하세요.
        </p>
      </div>
    </div>
  );
}
