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
    role: "SUB_OPERATOR"
  });
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
      console.error("운영자 목록 조회 에러:", e);
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

  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username || !form.password || !form.name) {
      alert("모든 항목을 입력해주세요.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/operators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: form.username, 
          password: form.password, 
          name: form.name, 
          newRole: form.role 
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setForm({
          username: "",
          password: "",
          name: "",
          role: "SUB_OPERATOR"
        });
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

  return {
    operators,
    isLoading,
    form,
    isSubmitting,
    updateForm,
    handleAddOperator,
    handleDelete,
    fetchOperators
  };
}
