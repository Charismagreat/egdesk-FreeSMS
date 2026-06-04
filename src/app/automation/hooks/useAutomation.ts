"use client";

import { useState, useEffect } from "react";
import { MessageTemplate, AutomationRule, EventItem } from "../types";

export const EVENTS: EventItem[] = [
  { id: "customer_registered", label: "신규 고객 등록 시", desc: "새로운 고객 연락처가 CRM에 등록되었을 때 발송됩니다." },
  { id: "reservation_created", label: "예약 확정 시", desc: "새로운 예약 일정이 등록되었을 때 발송됩니다." },
  { id: "payment_completed", label: "결제 완료 시", desc: "고객의 결제가 정상적으로 승인/등록되었을 때 발송됩니다." },
  { id: "order_created", label: "주문 접수 시", desc: "새로운 상품 주문이 접수되었을 때 발송됩니다." },
  { id: "delivery_started", label: "배송 시작 시", desc: "주문 상품의 배송이 시작되었을 때 발송됩니다." },
  { id: "point_earned", label: "포인트 적립 완료 시 🪙", desc: "고객의 단골 포인트가 신규 적립되었을 때 발송됩니다." },
  { id: "point_redeemed", label: "포인트 사용/차감 시 🔒", desc: "결제 시 고객의 포인트가 차감 사용되었을 때 발송됩니다." },
  { id: "b2b_partner_registered", label: "B2B 신규 거래처 온보딩 시 🤝", desc: "모바일 견적 요청 또는 명함 스냅을 통해 B2B 신규 파트너로 자동 가입되었을 때 발송됩니다." },
  { id: "estimate_received", label: "B2B 견적 요청 접수 시 🪐", desc: "바이어로부터 새로운 모바일 스마트 견적 요청이 접수되었을 때 접수 확인 문자가 발송됩니다." },
  { id: "sales_order_confirmed", label: "B2B 수주 확정 시 📦", desc: "바이어의 계약 최종 승인에 따라 수주 확정서 및 배송 안내 문자가 발송됩니다." }
];

export function useAutomation() {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [rules, setRules] = useState<Record<string, AutomationRule>>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchTemplates();
    fetchRules();
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await fetch("/api/message-templates");
      const json = await res.json();
      if (json.success) {
        setTemplates(json.templates || []);
      }
    } catch (e) {
      console.error("템플릿 목록 조회 에러:", e);
    }
  };

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/automation");
      const json = await res.json();
      if (json.success) {
        const initialRules: Record<string, AutomationRule> = {};
        EVENTS.forEach(ev => {
          initialRules[ev.id] = json.rules[ev.id] || { enabled: false, templateId: null };
        });
        setRules(initialRules);
      }
    } catch (e) {
      console.error("규칙 목록 조회 에러:", e);
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
      const res = await fetch("/api/automation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

  return {
    templates,
    rules,
    isSaving,
    toggleRule,
    changeTemplate,
    saveRules
  };
}
