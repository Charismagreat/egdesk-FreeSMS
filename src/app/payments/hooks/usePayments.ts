"use client";

import { useState, useEffect } from "react";
import { PaymentItem, PaymentForm } from "../types";

export function usePayments() {
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [data, setData] = useState<PaymentItem[]>([]);
  const [form, setForm] = useState<PaymentForm>({
    customerName: '',
    amount: '',
    paymentMethod: '카드결제',
    orderId: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // 검색어 입력 시 페이지 번호 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/payments');
      const json = await res.json();
      if (json.success) {
        setData(json.payments || []);
      }
    } catch (e) {
      console.error("결제 목록 조회 에러:", e);
    }
  };

  const updateForm = (key: keyof PaymentForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const addData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.amount) {
      alert('필수 입력 누락');
      return;
    }
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (json.success) {
        setForm({
          customerName: '',
          amount: '',
          paymentMethod: '카드결제',
          orderId: ''
        });
        fetchData();
      }
    } catch (error) {
      alert("등록 중 오류가 발생했습니다.");
    }
  };

  const deleteData = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/payments?id=${id}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
      }
    } catch (error) {
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  // 실시간 필터링
  const filteredData = data.filter(t => {
    const query = searchQuery.toLowerCase();
    return (
      (t.customer_name && t.customer_name.toLowerCase().includes(query)) ||
      (t.payment_method && t.payment_method.toLowerCase().includes(query)) ||
      (t.order_id && t.order_id.toLowerCase().includes(query))
    );
  });

  // 페이지네이션 슬라이싱 로직
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  return {
    activeOrderId,
    setActiveOrderId,
    data,
    form,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    filteredData,
    totalPages,
    startIndex,
    endIndex,
    paginatedData,
    updateForm,
    addData,
    deleteData
  };
}
