"use client";

import { useState, useEffect } from "react";
import { Zap, CheckCircle, Save, Info } from "lucide-react";

interface MessageTemplate {
  id: number;
  title: string;
  content: string;
}

interface AutomationRule {
  enabled: boolean;
  templateId: number | null;
}

const EVENTS = [
  { id: 'customer_registered', label: '신규 고객 등록 시', desc: '새로운 고객 연락처가 CRM에 등록되었을 때 발송됩니다.' },
  { id: 'reservation_created', label: '예약 확정 시', desc: '새로운 예약 일정이 등록되었을 때 발송됩니다.' },
  { id: 'payment_completed', label: '결제 완료 시', desc: '고객의 결제가 정상적으로 승인/등록되었을 때 발송됩니다.' },
  { id: 'order_created', label: '주문 접수 시', desc: '새로운 상품 주문이 접수되었을 때 발송됩니다.' },
  { id: 'delivery_started', label: '배송 시작 시', desc: '주문 상품의 배송이 시작되었을 때 발송됩니다.' }
];

export default function AutomationPage() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [rules, setRules] = useState<Record<string, AutomationRule>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchRules();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/message-templates');
      const json = await res.json();
      if (json.success) setTemplates(json.templates);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await fetch('/api/automation');
      const json = await res.json();
      if (json.success) {
        // Initialize with default states if empty
        const initialRules: Record<string, AutomationRule> = {};
        EVENTS.forEach(ev => {
          initialRules[ev.id] = json.rules[ev.id] || { enabled: false, templateId: null };
        });
        setRules(initialRules);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const toggleRule = (eventId: string) => {
    setRules(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], enabled: !prev[eventId]?.enabled }
    }));
  };

  const changeTemplate = (eventId: string, templateId: number | null) => {
    setRules(prev => ({
      ...prev,
      [eventId]: { ...prev[eventId], templateId }
    }));
  };

  const saveRules = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rules })
      });
      const json = await res.json();
      if (json.success) {
        alert("자동 발송 규칙이 성공적으로 저장되었습니다.");
      } else {
        alert("저장 실패: " + json.error);
      }
    } catch (e) {
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center">
            <Zap className="w-8 h-8 text-yellow-500 mr-3" />
            다목적 자동 발송 설정
          </h1>
          <p className="text-slate-500 mt-2">이벤트가 발생할 때마다 백그라운드에서 지정된 템플릿 문자를 자동으로 발송합니다.</p>
        </div>
        <button 
          onClick={saveRules}
          disabled={isSaving}
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all flex items-center disabled:opacity-50"
        >
          <Save className="w-5 h-5 mr-2" />
          {isSaving ? "저장 중..." : "설정 저장하기"}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl mb-12 flex items-start">
        <Info className="w-6 h-6 text-blue-500 mr-3 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 leading-relaxed">
          <strong>작동 원리:</strong> 아래 목록에서 원하는 상황(이벤트)을 'On'으로 켜고, 발송할 '템플릿'을 연결해두면 끝입니다. 
          각 이벤트가 발생할 때 자동으로 고객의 전화번호를 추출하여 문자를 쏩니다. <br/>
          * 주의: 연결할 템플릿은 사전에 <b>[문자 발송] - [템플릿으로 저장]</b> 메뉴에서 미리 만들어 두셔야 목록에 나타납니다.
        </p>
      </div>

      <div className="space-y-4">
        {EVENTS.map(ev => {
          const rule = rules[ev.id] || { enabled: false, templateId: null };
          
          return (
            <div key={ev.id} className={`p-6 rounded-2xl border transition-all ${rule.enabled ? 'bg-white border-blue-300 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={rule.enabled}
                      onChange={() => toggleRule(ev.id)}
                    />
                    <div className="w-14 h-7 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-500"></div>
                  </label>
                  <div>
                    <h3 className={`text-lg font-bold ${rule.enabled ? 'text-slate-800' : 'text-slate-500'}`}>
                      {ev.label}
                    </h3>
                    <p className="text-sm text-slate-500">{ev.desc}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 w-1/3">
                  <span className="text-sm font-medium text-slate-600 whitespace-nowrap">연결 템플릿:</span>
                  <select 
                    value={rule.templateId || ''}
                    onChange={e => changeTemplate(ev.id, e.target.value ? parseInt(e.target.value) : null)}
                    disabled={!rule.enabled}
                    className={`w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors ${rule.enabled ? 'border-slate-300 bg-white focus:border-blue-500' : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                  >
                    <option value="">-- 템플릿을 선택하세요 --</option>
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
