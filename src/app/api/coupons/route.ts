import { NextResponse } from 'next/server';
import { queryTable, insertRows, updateRows, deleteRows } from '../../../../egdesk-helpers';

// GET /api/coupons : 발급된 쿠폰 목록 조회
export async function GET() {
  try {
    const result = await queryTable('coupons', {
      orderBy: 'created_at',
      orderDirection: 'DESC'
    });
    
    return NextResponse.json({ success: true, coupons: result.rows });
  } catch (error: any) {
    console.error('Failed to fetch coupons:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/coupons : 새 쿠폰 발행
export async function POST(req: Request) {
  try {
    const { code, name, discount_type, discount_value, min_order_amount, status } = await req.json();

    if (!code || !name || !discount_value) {
      return NextResponse.json({ success: false, error: 'Required fields missing' }, { status: 400 });
    }

    const id = Date.now().toString();

    await insertRows('coupons', [{
      id,
      code: code.toUpperCase().trim(),
      name,
      discount_type: discount_type || 'amount',
      discount_value: Number(discount_value) || 0,
      min_order_amount: Number(min_order_amount) || 0,
      status: status || 'active',
      created_at: new Date().toISOString()
    }]);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Failed to create coupon:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/coupons : 쿠폰 삭제 (비활성화)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await deleteRows('coupons', { filters: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete coupon:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
