import { NextResponse } from 'next/server';
import { queryTable, insertRows, deleteRows } from '../../../../egdesk-helpers';

// GET /api/products : 상품 목록 조회
export async function GET() {
  try {
    const result = await queryTable('products', {
      orderBy: 'id',
      orderDirection: 'DESC'
    });
    
    const products = result.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      price: r.price,
      url: r.url,
      category: r.category,
      description: r.description,
      main_image_url: r.main_image_url,
      detail_image_url: r.detail_image_url,
      available_methods: r.available_methods || '매장에서,가져가기,배달,배송'
    }));

    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST /api/products : 새 상품 생성
export async function POST(req: Request) {
  try {
    const { id, name, price, url, category, description, main_image_url, detail_image_url, available_methods } = await req.json();

    if (!name) {
      return NextResponse.json({ success: false, error: 'Product name is required' }, { status: 400 });
    }

    const newId = id || Date.now().toString();

    await insertRows('products', [{
      id: newId,
      name,
      price: price || '',
      url: url || '',
      category: category || '일반상품',
      description: description || '',
      main_image_url: main_image_url || '',
      detail_image_url: detail_image_url || '',
      available_methods: available_methods || '매장에서,가져가기,배달,배송'
    }]);

    return NextResponse.json({ success: true, id: newId });
  } catch (error: any) {
    console.error('Failed to create product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE /api/products : 상품 삭제
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    await deleteRows('products', { filters: { id: id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete product:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
