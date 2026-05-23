"use client";

import { useState, useEffect } from "react";
import { UserCog, Plus, Trash2, ShieldAlert, ShieldCheck } from "lucide-react";

type Operator = {
  id: number;
  username: string;
  name: string;
  role: string;
  created_at: string;
};

export default function OperatorsPage() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("SUB_OPERATOR");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const res = await fetch('/api/operators');
      const data = await res.json();
      if (data.success) {
        setOperators(data.operators);
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !name) return alert("모든 항목을 입력해주세요.");
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, name, newRole: role })
      });
      const data = await res.json();
      
      if (data.success) {
        setUsername("");
        setPassword("");
        setName("");
        setRole("SUB_OPERATOR");
        fetchOperators();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("서버 연결 실패");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("정말 이 운영자 계정을 삭제하시겠습니까?")) return;
    
    try {
      const res = await fetch(`/api/operators?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchOperators();
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("서버 연결 실패");
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
              <Plus className="w-5 h-5 mr-2 text-indigo-500" />
              새 운영자 추가
            </h2>
            <form onSubmit={handleAddOperator} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">아이디</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="예: staff1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="비밀번호 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">이름/직급</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  placeholder="예: 홍길동 대리"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">권한 등급</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm bg-white"
                >
                  <option value="SUB_OPERATOR">부운영자 (일반 기능만)</option>
                  <option value="SUPER_ADMIN">최고관리자 (전체 권한)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {isSubmitting ? '추가 중...' : '계정 생성'}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-sm">
                  <th className="p-4 font-semibold text-slate-600">이름</th>
                  <th className="p-4 font-semibold text-slate-600">아이디</th>
                  <th className="p-4 font-semibold text-slate-600">권한</th>
                  <th className="p-4 font-semibold text-slate-600">생성일</th>
                  <th className="p-4 font-semibold text-slate-600 text-center">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">불러오는 중...</td></tr>
                ) : operators.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">등록된 운영자가 없습니다.</td></tr>
                ) : (
                  operators.map((op) => (
                    <tr key={op.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-medium text-slate-800">{op.name}</td>
                      <td className="p-4 text-slate-600">{op.username}</td>
                      <td className="p-4">
                        {op.role === 'SUPER_ADMIN' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <ShieldAlert className="w-3 h-3 mr-1" />
                            최고관리자
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            부운영자
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-slate-500 text-sm">
                        {new Date(op.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleDelete(op.id)}
                          disabled={op.username === 'admin'}
                          className="p-2 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-20"
                          title="계정 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
