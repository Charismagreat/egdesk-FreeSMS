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
  { id: 'delivery_started', label: '배송 시작 시', desc: '주문 상품의 배송이 시작되었을 때 발송됩니다.' },
  { id: 'point_earned', label: '포인트 적립 완료 시 🪙', desc: '고객의 단골 포인트가 신규 적립되었을 때 발송됩니다.' },
  { id: 'point_redeemed', label: '포인트 사용/차감 시 🔒', desc: '결제 시 고객의 포인트가 차감 사용되었을 때 발송됩니다.' },
  { id: 'b2b_partner_registered', label: 'B2B 신규 거래처 온보딩 시 🤝', desc: '모바일 견적 요청 또는 명함 스냅을 통해 B2B 신규 파트너로 자동 가입되었을 때 발송됩니다.' },
  { id: 'estimate_received', label: 'B2B 견적 요청 접수 시 🪐', desc: '바이어로부터 새로운 모바일 스마트 견적 요청이 접수되었을 때 접수 확인 문자가 발송됩니다.' },
  { id: 'sales_order_confirmed', label: 'B2B 수주 확정 시 📦', desc: '바이어의 계약 최종 승인에 따라 수주 확정서 및 배송 안내 문자가 발송됩니다.' }
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
            자동 발송 설정
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

      <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl mb-8 flex flex-col md:flex-row items-start gap-4 shadow-sm animate-fade-in">
        <Info className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800 leading-relaxed space-y-2">
          <p>
            <strong>작동 원리:</strong> 아래 목록에서 자동 알림을 전송할 상황(이벤트)을 'On'으로 켜고, 발송할 '템플릿'을 연결해두면 끝입니다. 
            각 이벤트가 발생할 때 자동으로 고객의 전화번호를 추출하여 문자를 쏩니다.
          </p>
          <div className="bg-white/80 p-3.5 rounded-xl border border-blue-100 text-xs text-slate-700 space-y-1 mt-1 font-semibold">
            <p className="font-extrabold text-blue-900 mb-1 flex items-center">💡 템플릿 내 사용 가능한 예약어 변수</p>
            <p>• <strong>포인트 변수</strong>: <code>{"{적립포인트}"}</code> (새로 적립된 액수), <code>{"{차감포인트}"}</code> (결제 시 사용된 액수), <code>{"{잔여포인트}"}</code> (사용 후 남은 최종 잔액)</p>
            <p>• <strong>쿠폰 변수 (수동/단체 문자용)</strong>: <code>{"{쿠폰코드}"}</code> (자동 맵핑되어 전송되는 난수 쿠폰 코드)</p>
            <p>• <strong>B2B / SCM 특화 변수</strong>: <code>{"{상호명}"}</code> (거래처 회사명), <code>{"{담당자명}"}</code> (B2B 담당자 성함), <code>{"{금액}"}</code> (견적/수주 총합계금액), <code>{"{수주번호}"}</code> (확정 수주 고유코드)</p>
            <p>• <strong>기본 변수</strong>: <code>{"{이름}"}</code> (고객 성명), <code>{"{연락처}"}</code> (고객 번호)</p>
          </div>
          <p className="text-[11px] text-blue-600 font-bold">* 주의: 연결할 템플릿은 사전에 <b>[무료 문자 발송 AI]</b> 메뉴의 메시지 작성 칸에서 <b>[+ 템플릿으로 저장]</b>을 미리 클릭하여 등록해 두셔야 아래 목록에 나타납니다.</p>
        </div>
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
