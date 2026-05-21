import { createTable, queryTable, insertRows } from '../../egdesk-helpers';

export async function setupDatabase() {
  console.log('Starting database setup for egdesk-FreeSMS...');

  // 1. Customers Table
  try {
    await createTable('고객 명단', [
      { name: 'id', type: 'INTEGER', notNull: true },
      { name: 'name', type: 'TEXT', notNull: true },
      { name: 'phone', type: 'TEXT', notNull: true },
      { name: 'tags', type: 'TEXT' }, // Comma-separated tags or JSON
      { name: 'memo', type: 'TEXT' },
      { name: 'address', type: 'TEXT' },
      { name: 'shipping_address', type: 'TEXT' },
      { name: 'recipient_name', type: 'TEXT' },
      { name: 'recipient_phone', type: 'TEXT' },
      { name: 'created_at', type: 'TEXT' },
    ], { tableName: 'crm_customers', uniqueKeyColumns: ['id'] });
    console.log('Table "crm_customers" created.');
  } catch (e: any) {
    console.error('Error creating customers table:', e.message);
  }

  // 2. Message Templates Table
  try {
    await createTable('문자 템플릿', [
      { name: 'id', type: 'INTEGER', notNull: true },
      { name: 'title', type: 'TEXT', notNull: true },
      { name: 'content', type: 'TEXT', notNull: true },
    ], { tableName: 'message_templates', uniqueKeyColumns: ['id'] });
    console.log('Table "message_templates" created.');
  } catch (e: any) {
    console.error('Error creating message_templates table:', e.message);
  }

  // 3. Message Logs Table
  try {
    await createTable('발송 내역', [
      { name: 'id', type: 'INTEGER', notNull: true },
      { name: 'customer_id', type: 'INTEGER' }, // Nullable for ad-hoc messages
      { name: 'phone', type: 'TEXT', notNull: true },
      { name: 'message', type: 'TEXT', notNull: true },
      { name: 'status', type: 'TEXT', notNull: true }, // SUCCESS, FAILED
      { name: 'created_at', type: 'TEXT', notNull: true },
    ], { tableName: 'message_logs', uniqueKeyColumns: ['id'] });
    console.log('Table "message_logs" created.');
  } catch (e: any) {
    console.error('Error creating message_logs table:', e.message);
  }

  // 4. Ad Templates Table
  try {
    await createTable('광고 템플릿', [
      { name: 'id', type: 'TEXT', notNull: true },
      { name: 'name', type: 'TEXT', notNull: true },
      { name: 'header', type: 'TEXT', notNull: true },
      { name: 'footer', type: 'TEXT', notNull: true },
      { name: 'opt_out', type: 'TEXT', notNull: true },
    ], { tableName: 'ad_templates', uniqueKeyColumns: ['id'] });
    console.log('Table "ad_templates" created.');
  } catch (e: any) {
    console.error('Error creating ad_templates table:', e.message);
  }

  // 5. Products Table
  try {
    await createTable('광고 상품', [
      { name: 'id', type: 'TEXT', notNull: true },
      { name: 'name', type: 'TEXT', notNull: true },
      { name: 'price', type: 'TEXT' },
      { name: 'url', type: 'TEXT' },
      { name: 'description', type: 'TEXT' },
      { name: 'main_image_url', type: 'TEXT' },
      { name: 'detail_image_url', type: 'TEXT' },
      { name: 'available_methods', type: 'TEXT' },
      { name: 'category', type: 'TEXT' },
      { name: 'menu_category', type: 'TEXT' },
    ], { tableName: 'products', uniqueKeyColumns: ['id'], duplicateAction: 'update' });
    console.log('Table "products" created.');
  } catch (e: any) {
    console.error('Error creating products table:', e.message);
  }

  // 6. Transactions Table
  try {
    await createTable('거래 내역', [
      { name: 'id', type: 'TEXT', notNull: true },
      { name: 'customer_name', type: 'TEXT', notNull: true },
      { name: 'customer_phone', type: 'TEXT', notNull: true },
      { name: 'product_name', type: 'TEXT', notNull: true },
      { name: 'amount', type: 'TEXT' },
      { name: 'order_date', type: 'TEXT' },
      { name: 'status', type: 'TEXT' },
      { name: 'order_id', type: 'TEXT' },
    ], { tableName: 'crm_transactions', uniqueKeyColumns: ['id'] });
    console.log('Table "crm_transactions" created.');
  } catch (e: any) {
    console.error('Error creating crm_transactions table:', e.message);
  }

  // 7. Orders Table
  try {
    await createTable('주문 내역', [
      { name: 'id', type: 'TEXT', notNull: true },
      { name: 'customer_name', type: 'TEXT', notNull: true },
      { name: 'customer_phone', type: 'TEXT', notNull: true },
      { name: 'product_name', type: 'TEXT', notNull: true },
      { name: 'quantity', type: 'TEXT' },
      { name: 'total_price', type: 'TEXT' },
      { name: 'delivery_method', type: 'TEXT' },
      { name: 'shipping_address', type: 'TEXT' },
      { name: 'tracking_number', type: 'TEXT' },
      { name: 'attachment_url', type: 'TEXT' },
      { name: 'customer_memo', type: 'TEXT' },
      { name: 'order_date', type: 'TEXT' },
      { name: 'status', type: 'TEXT' },
    ], { tableName: 'crm_orders', uniqueKeyColumns: ['id'], duplicateAction: 'update' });
    console.log('Table "crm_orders" created.');
  } catch (e: any) {
    console.error('Error creating crm_orders table:', e.message);
  }

  // 8. Payments Table
  try {
    await createTable('결제 내역', [
      { name: 'id', type: 'TEXT', notNull: true },
      { name: 'customer_name', type: 'TEXT', notNull: true },
      { name: 'payment_method', type: 'TEXT', notNull: true },
      { name: 'amount', type: 'TEXT', notNull: true },
      { name: 'payment_date', type: 'TEXT' },
      { name: 'status', type: 'TEXT' },
      { name: 'order_id', type: 'TEXT' },
    ], { tableName: 'crm_payments', uniqueKeyColumns: ['id'] });
    console.log('Table "crm_payments" created.');
  } catch (e: any) {
    console.error('Error creating crm_payments table:', e.message);
  }

  // 9. Reservations Table
  try {
    await createTable('예약 내역', [
      { name: 'id', type: 'TEXT', notNull: true },
      { name: 'customer_name', type: 'TEXT', notNull: true },
      { name: 'customer_phone', type: 'TEXT', notNull: true },
      { name: 'service_name', type: 'TEXT', notNull: true },
      { name: 'reservation_date', type: 'TEXT' },
      { name: 'reservation_time', type: 'TEXT' },
      { name: 'status', type: 'TEXT' },
    ], { tableName: 'crm_reservations', uniqueKeyColumns: ['id'] });
    console.log('Table "crm_reservations" created.');
  } catch (e: any) {
    console.error('Error creating crm_reservations table:', e.message);
  }

  // 10. Deliveries Table
  try {
    await createTable('배송 내역', [
      { name: 'id', type: 'TEXT', notNull: true },
      { name: 'customer_name', type: 'TEXT', notNull: true },
      { name: 'customer_phone', type: 'TEXT', notNull: true },
      { name: 'address', type: 'TEXT', notNull: true },
      { name: 'courier', type: 'TEXT' },
      { name: 'tracking_number', type: 'TEXT' },
      { name: 'status', type: 'TEXT' },
      { name: 'order_id', type: 'TEXT' },
    ], { tableName: 'crm_deliveries', uniqueKeyColumns: ['id'] });
    console.log('Table "crm_deliveries" created.');
  } catch (e: any) {
    console.error('Error creating crm_deliveries table:', e.message);
  }

  // 11. System Settings Table
  try {
    await createTable('시스템 설정', [
      { name: 'key', type: 'TEXT', notNull: true },
      { name: 'value', type: 'TEXT', notNull: true }
    ], { tableName: 'system_settings', uniqueKeyColumns: ['key'] });
    console.log('Table "system_settings" created.');
  } catch (e: any) {
    console.error('Error creating system_settings table:', e.message);
  }

  // 12. CRM Operators Table
  try {
    await createTable('운영자 권한 관리', [
      { name: 'id', type: 'INTEGER', notNull: true },
      { name: 'username', type: 'TEXT', notNull: true },
      { name: 'password_hash', type: 'TEXT', notNull: true },
      { name: 'name', type: 'TEXT', notNull: true },
      { name: 'role', type: 'TEXT', notNull: true }, // 'SUPER_ADMIN' or 'SUB_OPERATOR'
      { name: 'created_at', type: 'TEXT' }
    ], { tableName: 'crm_operators', uniqueKeyColumns: ['username'] });
    console.log('Table "crm_operators" created.');
  } catch (e: any) {
    console.error('Error creating crm_operators table:', e.message);
  }

  // 13. Instagram Posts Table
  try {
    await createTable('인스타그램 포스팅 이력 및 예약', [
      { name: 'id', type: 'INTEGER', notNull: true },
      { name: 'product_id', type: 'TEXT' },
      { name: 'status', type: 'TEXT', notNull: true }, // DRAFT, SCHEDULED, POSTED, FAILED
      { name: 'content', type: 'TEXT' },
      { name: 'image_url', type: 'TEXT' },
      { name: 'scheduled_at', type: 'TEXT' },
      { name: 'posted_at', type: 'TEXT' },
      { name: 'error_message', type: 'TEXT' },
      { name: 'likes_count', type: 'INTEGER' },
      { name: 'comments_count', type: 'INTEGER' }
    ], { tableName: 'crm_instagram_posts', uniqueKeyColumns: ['id'] });
    console.log('Table "crm_instagram_posts" created.');
  } catch (e: any) {
    console.error('Error creating crm_instagram_posts table:', e.message);
  }

  // 14. Instagram Settings Table
  try {
    await createTable('인스타그램 마케팅 설정', [
      { name: 'id', type: 'INTEGER', notNull: true },
      { name: 'is_autopilot', type: 'INTEGER', notNull: true }, // 0: 수동, 1: 자동
      { name: 'autopilot_interval', type: 'TEXT' }, // DAILY, WEEKLY 등
      { name: 'autopilot_time', type: 'TEXT' }, // "10:00"
      { name: 'tone_style', type: 'TEXT' }, // 인플루언서형, 세련된형 등
      { name: 'instagram_username', type: 'TEXT' },
      { name: 'access_token', type: 'TEXT' }
    ], { tableName: 'instagram_marketing_settings', uniqueKeyColumns: ['id'] });
    console.log('Table "instagram_marketing_settings" created.');

    // ID 1의 기본 설정 존재 여부 확인 후 자동 주입
    const settingsCheck = await queryTable('instagram_marketing_settings', { filters: { id: '1' } });
    if (!settingsCheck.rows || settingsCheck.rows.length === 0) {
      await insertRows('instagram_marketing_settings', [{
        id: 1,
        is_autopilot: 0,
        autopilot_interval: 'DAILY',
        autopilot_time: '10:00',
        tone_style: '인플루언서형',
        instagram_username: 'charismagreat',
        access_token: 'dummy_access_token_session_2026'
      }]);
      console.log('Dummy Instagram settings seeded.');
    }
  } catch (e: any) {
    console.error('Error creating instagram_marketing_settings table:', e.message);
  }

  // 인스타그램 더미 포스트 주입 (비어있는 경우만)
  try {
    const postsCheck = await queryTable('crm_instagram_posts', {});
    if (!postsCheck.rows || postsCheck.rows.length === 0) {
      const today = new Date();
      const dummyPosts = [
        {
          id: Date.now() - 172800000, // 2일 전
          product_id: 'prod_1',
          status: 'POSTED',
          content: `✨ 요새 SNS 대폭발 인기 잇템! 💖\n\n직접 가져온 시그니처 럭셔리 소품을 소개합니다! 🥰\n가성비도 엄청나고 감성 가득해지는 마법을 느껴보세요!\n\n상세한 구매 정보는 프로필 링크를 참고해 주세요! 👍\n\n#시그니처소품 #인스타감성 #인기잇템 #지름신강림 #소장각 #득템`,
          image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
          scheduled_at: new Date(today.getTime() - 172800000).toISOString(),
          posted_at: new Date(today.getTime() - 172800000).toISOString(),
          error_message: null,
          likes_count: 142,
          comments_count: 24
        },
        {
          id: Date.now() - 86400000, // 1일 전
          product_id: 'prod_2',
          status: 'POSTED',
          content: `시간이 흘러도 변치 않는 정갈한 무드.\n오늘 제안 드리는 모던 가구 컬렉션입니다. 🌿🕊️\n\n불필요한 디테일을 줄여 세련된 실루엣과 감도를 높였습니다. 소장하는 것만으로 완성되는 특유의 결을 경험해 보세요.\n\n#모던가구 #인테리어디자인 #셀렉샵 #감도높은일상 #오브제`,
          image_url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&auto=format&fit=crop&q=80',
          scheduled_at: new Date(today.getTime() - 86400000).toISOString(),
          posted_at: new Date(today.getTime() - 86400000).toISOString(),
          error_message: null,
          likes_count: 98,
          comments_count: 12
        },
        {
          id: Date.now() + 86400000, // 1일 후 (예약)
          product_id: 'prod_3',
          status: 'SCHEDULED',
          content: `🚨 지갑 수호 실패 각!! 🚨\n\n내일 오픈하는 초특급 신상템 미리 스포합니다! 💸🤪\n디자인 실물 깡패라 벌써부터 문의 대폭발 중이에요!\n\n내일 오전 10시 정각에 프로필 링크에서 만나요! 현기증 납니다..★\n\n#내일오픈 #신상스포 #잇템추천 #탕진잼 #꿀잼일상`,
          image_url: 'https://images.unsplash.com/photo-1507133750040-4a8f57021571?w=800&auto=format&fit=crop&q=80',
          scheduled_at: new Date(today.getTime() + 86400000).toISOString(),
          posted_at: null,
          error_message: null,
          likes_count: 0,
          comments_count: 0
        }
      ];
      await insertRows('crm_instagram_posts', dummyPosts);
      console.log('Dummy Instagram posts seeded successfully.');
    }
  } catch (e: any) {
    console.error('Error seeding crm_instagram_posts dummy data:', e.message);
  }

  console.log('Database setup complete.');
}
