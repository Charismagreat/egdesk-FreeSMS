"use client";

import { useState, useEffect } from "react";
import { Order, OrderForm } from "../types";

export function useOrders() {
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [data, setData] = useState<Order[]>([]);
  const [form, setForm] = useState<OrderForm>({ 
    customerName: '', 
    customerPhone: '', 
    productName: '', 
    quantity: '1',
    totalPrice: '',
    deliveryMethod: '택배배송',
    shippingAddress: '',
  });

  const [activeTab, setActiveTab] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [trackingEdits, setTrackingEdits] = useState<Record<string, string>>({});
  const [viewerUrl, setViewerUrl] = useState<string | null>(null);

  const TABS = ['전체', '접수완료', '견적요청', '결제대기', '결제완료', '상품준비중', '배송시작', '배송중', '배송완료', '수령완료', '주문취소'];

  // 검색어 또는 탭 변경 시 페이지 번호 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeTab]);

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch('/api/orders');
      const json = await res.json();
      if (json.success) setData(json.orders || []);
    } catch (e) {
      console.error("주문 데이터 로드 실패:", e);
    }
  };

  const addData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.productName) {
      return alert('필수 입력 누락');
    }
    try {
      const res = await fetch('/api/orders', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form) 
      });
      const json = await res.json();
      if (json.success) { 
        setForm({
          customerName: '', 
          customerPhone: '', 
          productName: '', 
          quantity: '1', 
          totalPrice: '', 
          deliveryMethod: '택배배송', 
          shippingAddress: ''
        }); 
        fetchData(); 
      }
    } catch (err) {
      console.error("주문 등록 오류:", err);
    }
  };

  const deleteData = async (id: string) => {
    if (!confirm('삭제하시겠습니까?')) return;
    try {
      const res = await fetch('/api/orders?id=' + id, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) fetchData();
    } catch (err) {
      console.error("주문 삭제 오류:", err);
    }
  };

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    setIsUpdating(true);
    try {
      const res = await fetch('/api/orders', { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id], updates })
      });
      const json = await res.json();
      if (json.success) fetchData();
    } catch (err) {
      console.error("주문 수정 오류:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const bulkUpdateStatus = async (status: string) => {
    if (selectedIds.size === 0) return alert('선택된 주문이 없습니다.');
    if (!confirm(`선택한 ${selectedIds.size}건의 상태를 '${status}'(으)로 변경하시겠습니까?`)) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch('/api/orders', { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), updates: { status } })
      });
      const json = await res.json();
      if (json.success) {
        setSelectedIds(new Set());
        fetchData();
      }
    } catch (err) {
      console.error("일괄 상태 변경 오류:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  const saveTrackingNumber = (id: string) => {
    const tracking = trackingEdits[id];
    if (tracking !== undefined) {
      updateOrder(id, { tracking_number: tracking });
    }
  };

  const filteredData = data.filter(t => {
    const matchesTab = activeTab === '전체' || t.status === activeTab;
    const matchesSearch = 
      (t.customer_name && t.customer_name.includes(searchQuery)) || 
      (t.customer_phone && t.customer_phone.includes(searchQuery)) || 
      (t.product_name && t.product_name.includes(searchQuery));
    return matchesTab && matchesSearch;
  });

  // 페이지네이션 슬라이싱 로직
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(paginatedData.map(t => t.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  return {
    activeOrderId, setActiveOrderId,
    data,
    form, setForm,
    activeTab, setActiveTab,
    searchQuery, setSearchQuery,
    selectedIds, setSelectedIds,
    isUpdating,
    currentPage, setCurrentPage,
    itemsPerPage, setItemsPerPage,
    trackingEdits, setTrackingEdits,
    viewerUrl, setViewerUrl,
    TABS,
    fetchData,
    addData,
    deleteData,
    updateOrder,
    bulkUpdateStatus,
    saveTrackingNumber,
    filteredData,
    totalPages,
    startIndex,
    endIndex,
    paginatedData,
    toggleSelectAll,
    toggleSelect
  };
}
