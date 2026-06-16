export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { updateRows } from '@/../egdesk-helpers';

export async function POST(req: Request) {
  try {
    const { operatorId, image } = await req.json();

    if (!operatorId) {
      return NextResponse.json({ success: false, error: '직원 ID(operatorId)가 입력되지 않았습니다.' }, { status: 400 });
    }

    if (!image) {
      return NextResponse.json({ success: false, error: '업로드할 본인 명함 이미지(Base64)가 누락되었습니다.' }, { status: 400 });
    }

    // 1. Base64 이미지 분리 및 저장
    let mimeType = 'image/png';
    let base64Data = image;

    if (image.startsWith('data:')) {
      const parts = image.split(';base64,');
      const meta = parts[0];
      base64Data = parts[1];
      mimeType = meta.split(':')[1];
    }

    const extension = mimeType.split('/')[1] || 'png';
    const filename = `operator_${operatorId}_${crypto.randomBytes(4).toString('hex')}.${extension}`;
    
    // public/uploads/operators/ 폴더 생성 보장
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'operators');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    const buffer = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(filePath, buffer);
    
    const myCardImageUrl = `/uploads/operators/${filename}`;

    // 2. DB 업데이트
    await updateRows('crm_operators', 
      { my_card_image_url: myCardImageUrl },
      { filters: { id: operatorId.toString() } }
    );

    return NextResponse.json({
      success: true,
      myCardImageUrl
    });

  } catch (err: any) {
    console.error('본인 명함 이미지 등록 API 에러:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
