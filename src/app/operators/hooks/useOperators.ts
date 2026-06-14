"use client";

import { useState, useEffect } from "react";
import { Operator, OperatorForm } from "../types";

export function useOperators() {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form states
  const [form, setForm] = useState<OperatorForm>({
    username: "",
    password: "",
    name: "",
    role: "SUB_OPERATOR",
    employee_number: ""
  });
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/operators');
      const data = await res.json();
      if (data.success) {
        setOperators(data.operators || []);
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error("직원 목록 조회 에러:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const updateForm = (key: keyof OperatorForm, value: string) => {
    setForm(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const startEdit = (op: Operator) => {
    setEditingOperator(op);
    setForm({
      username: op.username,
      password: "", // 보안상 비움 (수정 시 미기입하면 기존 비밀번호 유지)
      name: op.name,
      role: op.role,
      employee_number: op.employee_number || ""
    });
  };

  const cancelEdit = () => {
    setEditingOperator(null);
    setForm({
      username: "",
      password: "",
      name: "",
      role: "SUB_OPERATOR",
      employee_number: ""
    });
  };

  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isEditMode = !!editingOperator;
    if (!form.username || !form.name || (!isEditMode && !form.password)) {
      alert("모든 항목을 입력해주세요.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const url = '/api/operators';
      const method = isEditMode ? 'PUT' : 'POST';
      const bodyPayload = isEditMode 
        ? {
            id: editingOperator.id,
            password: form.password,
            name: form.name,
            newRole: form.role,
            employee_number: form.employee_number
          }
        : {
            username: form.username,
            password: form.password,
            name: form.name,
            newRole: form.role,
            employee_number: form.employee_number
          };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });
      const data = await res.json();
      
      if (data.success) {
        cancelEdit();
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
    if (!confirm("정말 이 직원 계정을 삭제하시겠습니까?")) return;
    
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

  return {
    operators,
    isLoading,
    form,
    editingOperator,
    isSubmitting,
    updateForm,
    handleAddOperator,
    handleDelete,
    startEdit,
    cancelEdit,
    fetchOperators
  };
}
