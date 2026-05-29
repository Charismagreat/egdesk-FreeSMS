export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { queryTable, insertRows, deleteRows, updateRows } from '@/../egdesk-helpers';

// YYYY-MM-DD 형식에서 월(YYYY-MM) 추출 헬퍼
function getYearMonth(dateStr: string) {
  return dateStr.slice(0, 7);
}

// YYYY-MM-DD 형식의 현재 날짜를 반환 (KST 기준)
function getKstDateStr() {
  const kst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit')) || 1000;
    
    // 1. 모든 지출 내역 조회
    const expensesRes = await queryTable('crm_expenses', {
      limit,
      orderBy: 'expense_date',
      orderDirection: 'DESC'
    });
    const expenses = expensesRes.rows || [];

    // 2. 예산 설정 조회
    const settingsRes = await queryTable('expense_settings', { filters: { id: 1 } });
    const expenseSetting = settingsRes.rows?.[0] || {
      monthly_budget: 3000000,
      is_alert_enabled: 1,
      alert_threshold_percent: 90,
      alert_sms_template: '[🚨지출AI] 예산 {경보임계율}% 도달! 누적 {누적지출}원 (한도 {월예산}원)',
      alert_phone: '010-1234-5678'
    };

    // 3. 통계 집계 연산 (현재 월 기준)
    const currentMonthStr = getKstDateStr().slice(0, 7); // 예: '2026-05'
    let currentMonthTotal = 0;
    const categoryTotals: Record<string, number> = {};

    expenses.forEach((exp: any) => {
      const expMonth = getYearMonth(exp.expense_date);
      const amount = Number(exp.amount) || 0;
      
      // 이번 달 누적 합산
      if (expMonth === currentMonthStr) {
        currentMonthTotal += amount;
      }

      // 비목별 누적 합산
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amount;
    });

    // 비목별 데이터 리스트 정렬 가공
    const categoryStats = Object.keys(categoryTotals).map(cat => ({
      category: cat,
      amount: categoryTotals[cat],
      percentage: expenses.length > 0 
        ? Math.round((categoryTotals[cat] / expenses.reduce((a, b) => a + (Number(b.amount) || 0), 0)) * 100) 
        : 0
    })).sort((a, b) => b.amount - a.amount);

    return NextResponse.json({
      success: true,
      expenses,
      stats: {
        currentMonth: currentMonthStr,
        currentMonthTotal,
        monthlyBudget: expenseSetting.monthly_budget,
        budgetConsumptionRate: expenseSetting.monthly_budget > 0 
          ? Math.round((currentMonthTotal / expenseSetting.monthly_budget) * 100) 
          : 0,
        categoryStats
      },
      settings: expenseSetting
    });

  } catch (error: any) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, amount, expense_date, payment_method, attachment_url, ai_analysis, memo } = body;

    if (!title || !category || !amount || !expense_date || !payment_method) {
      return NextResponse.json({ success: false, error: '필수 항목이 누락되었습니다.' }, { status: 400 });
    }

    const id = `exp-${Date.now()}`;
    const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

    await insertRows('crm_expenses', [{
      id,
      title,
      category,
      amount: Number(amount),
      expense_date,
      payment_method,
      attachment_url: attachment_url || '',
      ai_analysis: ai_analysis ? (typeof ai_analysis === 'string' ? ai_analysis : JSON.stringify(ai_analysis)) : '',
      memo: memo || '',
      created_at: nowStr
    }]);

    // --- 🚨 예산 초과 방지 실시간 SMS 경보 체크 파이프라인 ---
    try {
      const settingsRes = await queryTable('expense_settings', { filters: { id: 1 } });
      const setting = settingsRes.rows?.[0];

      if (setting && setting.is_alert_enabled === 1 && setting.monthly_budget > 0) {
        const currentMonthStr = expense_date.slice(0, 7); // 등록한 지출 일자의 해당 연월
        
        // 이번 달 모든 지출 목록 다시 가져와 합산
        const expensesRes = await queryTable('crm_expenses', {});
        const currentMonthExpenses = (expensesRes.rows || []).filter((exp: any) => 
          getYearMonth(exp.expense_date) === currentMonthStr
        );
        const totalMonthAmount = currentMonthExpenses.reduce((sum: number, exp: any) => sum + (Number(exp.amount) || 0), 0);

        const thresholdAmount = setting.monthly_budget * (setting.alert_threshold_percent / 100);

        // 현재 지출 등록으로 인해 비로소 임계값를 돌파하는 순간 파악
        if (totalMonthAmount >= thresholdAmount) {
          // 중복 발송을 막기 위해 system_settings 기반의 이달의 발송 플래그 체크
          const alertFlagKey = `expense_alert_sent_${currentMonthStr}`;
          const systemSettingsRes = await queryTable('system_settings', { filters: { key: alertFlagKey } });
          const isAlreadySent = systemSettingsRes.rows && systemSettingsRes.rows.length > 0;

          if (!isAlreadySent) {
            // SMS 발송 트리거
            let messageContent = setting.alert_sms_template;
            messageContent = messageContent.replace(/{경보임계율}/g, String(setting.alert_threshold_percent));
            messageContent = messageContent.replace(/{경보금액}/g, thresholdAmount.toLocaleString());
            messageContent = messageContent.replace(/{누적지출}/g, totalMonthAmount.toLocaleString());
            messageContent = messageContent.replace(/{월예산}/g, setting.monthly_budget.toLocaleString());

            console.log(`[Expense Alert] Threshold reached (${totalMonthAmount} / ${thresholdAmount}). Sending SMS to ${setting.alert_phone}...`);

            // 비동기로 문자 발송 API 호출 (Fire & Forget)
            fetch('http://localhost:3000/api/sms/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phoneNumber: setting.alert_phone,
                message: messageContent,
                customerId: null
              })
            }).then(async (smsRes) => {
              const smsJson = await smsRes.json();
              if (smsJson.success) {
                // 발송 완료 플래그 기록하여 중복 방지
                await insertRows('system_settings', [{
                  key: alertFlagKey,
                  value: 'true'
                }]);
                console.log(`[Expense Alert] Sent flag saved for ${currentMonthStr}`);
              }
            }).catch(e => console.error('[Expense Alert] SMS Send trigger failed:', e));
          }
        }
      }
    } catch (alertError) {
      console.error('[Expense Alert] Safety trigger check failed:', alertError);
    }
    // ----------------------------------------------------

    return NextResponse.json({ success: true, id });

  } catch (error: any) {
    console.error('Error adding expense:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const idsParam = searchParams.get('ids');

    if (!id && !idsParam) {
      return NextResponse.json({ success: false, error: '삭제할 ID가 필요합니다.' }, { status: 400 });
    }

    const idsToDelete = idsParam ? idsParam.split(',') : [id!];
    await deleteRows('crm_expenses', { ids: idsToDelete });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting expense:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
