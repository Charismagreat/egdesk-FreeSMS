import { createTable, queryTable, insertRows, updateRows, deleteRows, deleteTable } from '../../egdesk-helpers';

export async function setupDatabase() {
  const safeCreateTable = async (displayName: string, columns: any[], options: any) => {
    try {
      await createTable(displayName, columns, options);
      console.log(`Table "${options.tableName}" created/verified.`);
    } catch (e: any) {
      if (e.message.includes('UNIQUE constraint failed') || e.message.includes('table_name')) {
        console.log(`Table metadata mismatch for "${options.tableName}". Attempting auto-healing via drop and recreate...`);
        try {
          await deleteTable(options.tableName);
          await createTable(displayName, columns, options);
          console.log(`Table "${options.tableName}" auto-healed and created successfully.`);
          return;
        } catch (recreateErr: any) {
          console.error(`Failed to auto-heal table "${options.tableName}":`, recreateErr.message);
        }
      }
      console.error(`Error creating table "${options.tableName}":`, e.message);
    }
  };

  console.log('Starting database setup for egdesk-FreeSMS...');

  // 1. Customers Table
  await safeCreateTable('고객 명단', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'name', type: 'TEXT', notNull: true },
    { name: 'phone', type: 'TEXT', notNull: true },
    { name: 'tags', type: 'TEXT' }, // Comma-separated tags or JSON
    { name: 'memo', type: 'TEXT' },
    { name: 'address', type: 'TEXT' },
    { name: 'shipping_address', type: 'TEXT' },
    { name: 'recipient_name', type: 'TEXT' },
    { name: 'recipient_phone', type: 'TEXT' },
    { name: 'point_balance', type: 'INTEGER' }, // 적립금 잔액 컬럼 추가
    { name: 'created_at', type: 'TEXT' },
    { name: 'uuid', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: 'updated_by', type: 'TEXT' },
    { name: 'deleted_at', type: 'TEXT' },
    { name: 'deleted_by', type: 'TEXT' },
    { name: 'restored_at', type: 'TEXT' },
    { name: 'restored_by', type: 'TEXT' }
  ], { tableName: 'crm_customers', uniqueKeyColumns: ['id'] });

  // 2. Message Templates Table
  await safeCreateTable('문자 템플릿', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'title', type: 'TEXT', notNull: true },
    { name: 'content', type: 'TEXT', notNull: true },
  ], { tableName: 'message_templates', uniqueKeyColumns: ['id'] });

  // 3. Message Logs Table
  await safeCreateTable('발송 내역', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'customer_id', type: 'INTEGER' }, // Nullable for ad-hoc messages
    { name: 'phone', type: 'TEXT', notNull: true },
    { name: 'message', type: 'TEXT', notNull: true },
    { name: 'status', type: 'TEXT', notNull: true }, // SUCCESS, FAILED
    { name: 'created_at', type: 'TEXT', notNull: true },
  ], { tableName: 'message_logs', uniqueKeyColumns: ['id'] });

  // 4. Ad Templates Table
  await safeCreateTable('광고 템플릿', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'name', type: 'TEXT', notNull: true },
    { name: 'header', type: 'TEXT', notNull: true },
    { name: 'footer', type: 'TEXT', notNull: true },
    { name: 'opt_out', type: 'TEXT', notNull: true },
  ], { tableName: 'ad_templates', uniqueKeyColumns: ['id'] });

  // 5. Products Table
  await safeCreateTable('광고 상품', [
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
    { name: 'is_coupon_excludable', type: 'INTEGER' },
    { name: 'is_estimate_price', type: 'INTEGER', defaultValue: 0 },
    { name: 'uuid', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: 'updated_by', type: 'TEXT' },
    { name: 'deleted_at', type: 'TEXT' },
    { name: 'deleted_by', type: 'TEXT' },
    { name: 'restored_at', type: 'TEXT' },
    { name: 'restored_by', type: 'TEXT' }
  ], { tableName: 'products', uniqueKeyColumns: ['id'], duplicateAction: 'update' });

  // 6. Transactions Table
  await safeCreateTable('거래 내역', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'customer_name', type: 'TEXT', notNull: true },
    { name: 'customer_phone', type: 'TEXT', notNull: true },
    { name: 'product_name', type: 'TEXT', notNull: true },
    { name: 'amount', type: 'TEXT' },
    { name: 'order_date', type: 'TEXT' },
    { name: 'status', type: 'TEXT' },
    { name: 'order_id', type: 'TEXT' },
  ], { tableName: 'crm_transactions', uniqueKeyColumns: ['id'] });

  // 7. Orders Table
  await safeCreateTable('주문 내역', [
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
    { name: 'uuid', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: 'updated_by', type: 'TEXT' },
    { name: 'deleted_at', type: 'TEXT' },
    { name: 'deleted_by', type: 'TEXT' },
    { name: 'restored_at', type: 'TEXT' },
    { name: 'restored_by', type: 'TEXT' }
  ], { tableName: 'crm_orders', uniqueKeyColumns: ['id'], duplicateAction: 'update' });

  // 8. Payments Table
  await safeCreateTable('결제 내역', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'customer_name', type: 'TEXT', notNull: true },
    { name: 'payment_method', type: 'TEXT', notNull: true },
    { name: 'amount', type: 'TEXT', notNull: true },
    { name: 'payment_date', type: 'TEXT' },
    { name: 'status', type: 'TEXT' },
    { name: 'order_id', type: 'TEXT' },
    { name: 'uuid', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: 'updated_by', type: 'TEXT' },
    { name: 'deleted_at', type: 'TEXT' },
    { name: 'deleted_by', type: 'TEXT' },
    { name: 'restored_at', type: 'TEXT' },
    { name: 'restored_by', type: 'TEXT' }
  ], { tableName: 'crm_payments', uniqueKeyColumns: ['id'] });

  // 9. Reservations Table
  await safeCreateTable('예약 내역', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'customer_name', type: 'TEXT', notNull: true },
    { name: 'customer_phone', type: 'TEXT', notNull: true },
    { name: 'service_name', type: 'TEXT', notNull: true },
    { name: 'reservation_date', type: 'TEXT' },
    { name: 'reservation_time', type: 'TEXT' },
    { name: 'status', type: 'TEXT' },
    { name: 'uuid', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: 'updated_by', type: 'TEXT' },
    { name: 'deleted_at', type: 'TEXT' },
    { name: 'deleted_by', type: 'TEXT' },
    { name: 'restored_at', type: 'TEXT' },
    { name: 'restored_by', type: 'TEXT' }
  ], { tableName: 'crm_reservations', uniqueKeyColumns: ['id'] });

  // 10. Deliveries Table
  await safeCreateTable('배송 내역', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'customer_name', type: 'TEXT', notNull: true },
    { name: 'customer_phone', type: 'TEXT', notNull: true },
    { name: 'address', type: 'TEXT', notNull: true },
    { name: 'courier', type: 'TEXT' },
    { name: 'tracking_number', type: 'TEXT' },
    { name: 'status', type: 'TEXT' },
    { name: 'order_id', type: 'TEXT' },
    { name: 'uuid', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: 'updated_by', type: 'TEXT' },
    { name: 'deleted_at', type: 'TEXT' },
    { name: 'deleted_by', type: 'TEXT' },
    { name: 'restored_at', type: 'TEXT' },
    { name: 'restored_by', type: 'TEXT' }
  ], { tableName: 'crm_deliveries', uniqueKeyColumns: ['id'] });

  // 11. System Settings Table
  await safeCreateTable('시스템 설정', [
    { name: 'key', type: 'TEXT', notNull: true },
    { name: 'value', type: 'TEXT', notNull: true }
  ], { tableName: 'system_settings', uniqueKeyColumns: ['key'] });

  // 12. CRM Operators Table
  await safeCreateTable('운영자 권한 관리', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'username', type: 'TEXT', notNull: true },
    { name: 'password_hash', type: 'TEXT', notNull: true },
    { name: 'name', type: 'TEXT', notNull: true },
    { name: 'role', type: 'TEXT', notNull: true }, // 'SUPER_ADMIN' or 'SUB_OPERATOR'
    { name: 'created_at', type: 'TEXT' },
    { name: 'uuid', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: 'updated_by', type: 'TEXT' },
    { name: 'deleted_at', type: 'TEXT' },
    { name: 'deleted_by', type: 'TEXT' },
    { name: 'restored_at', type: 'TEXT' },
    { name: 'restored_by', type: 'TEXT' }
  ], { tableName: 'crm_operators', uniqueKeyColumns: ['username'] });

  // 13. Instagram Posts Table
  await safeCreateTable('인스타그램 포스팅 이력 및 예약', [
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

  // 14. Instagram Settings Table
  await safeCreateTable('인스타그램 마케팅 설정', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'is_autopilot', type: 'INTEGER', notNull: true }, // 0: 수동, 1: 자동
    { name: 'autopilot_interval', type: 'TEXT' }, // DAILY, WEEKLY 등
    { name: 'autopilot_time', type: 'TEXT' }, // "10:00"
    { name: 'tone_style', type: 'TEXT' }, // 인플루언서형, 세련된형 등
    { name: 'instagram_username', type: 'TEXT' },
    { name: 'access_token', type: 'TEXT' }
  ], { tableName: 'instagram_marketing_settings', uniqueKeyColumns: ['id'] });

  // 15. Naver Blog Posts Table
  await safeCreateTable('네이버 블로그 포스팅 이력 및 예약', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'product_id', type: 'TEXT' },
    { name: 'status', type: 'TEXT', notNull: true }, // DRAFT, SCHEDULED, POSTED, FAILED
    { name: 'title', type: 'TEXT' },
    { name: 'content', type: 'TEXT' },
    { name: 'target_keywords', type: 'TEXT' },
    { name: 'image_url', type: 'TEXT' },
    { name: 'sub_image_url', type: 'TEXT' },
    { name: 'scheduled_at', type: 'TEXT' },
    { name: 'posted_at', type: 'TEXT' },
    { name: 'error_message', type: 'TEXT' },
    { name: 'views_count', type: 'INTEGER' },
    { name: 'likes_count', type: 'INTEGER' }
  ], { tableName: 'crm_naver_blog_posts', uniqueKeyColumns: ['id'] });

  // 16. Naver Blog Settings Table
  await safeCreateTable('네이버 블로그 마케팅 설정', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'is_autopilot', type: 'INTEGER', notNull: true }, // 0: 수동, 1: 자동
    { name: 'autopilot_interval', type: 'TEXT' }, // DAILY, WEEKLY 등
    { name: 'autopilot_time', type: 'TEXT' }, // "10:00"
    { name: 'tone_style', type: 'TEXT' }, // 정보제공형, 솔직리뷰형 등
    { name: 'naver_blog_id', type: 'TEXT' },
    { name: 'api_client_id', type: 'TEXT' },
    { name: 'api_client_secret', type: 'TEXT' }
  ], { tableName: 'naver_blog_marketing_settings', uniqueKeyColumns: ['id'] });

  // 17. Coupons Table (쿠폰 관리)
  await safeCreateTable('쿠폰 관리', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'code', type: 'TEXT', notNull: true },
    { name: 'name', type: 'TEXT', notNull: true },
    { name: 'discount_type', type: 'TEXT', notNull: true }, // 'amount' or 'percent'
    { name: 'discount_value', type: 'INTEGER', notNull: true },
    { name: 'min_order_amount', type: 'INTEGER', notNull: true },
    { name: 'status', type: 'TEXT', notNull: true }, // 'active', 'used', 'expired' 등
    { name: 'expires_at', type: 'TEXT' }, // 'YYYY-MM-DD' 형식 (nullable, 지정 안 하면 무제한)
    { name: 'created_at', type: 'TEXT', notNull: true },
    { name: 'uuid', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: 'updated_by', type: 'TEXT' },
    { name: 'deleted_at', type: 'TEXT' },
    { name: 'deleted_by', type: 'TEXT' },
    { name: 'restored_at', type: 'TEXT' },
    { name: 'restored_by', type: 'TEXT' }
  ], { tableName: 'coupons', uniqueKeyColumns: ['id'] });

  // 18. Coupons Restrictions Table (쿠폰 상품/카테고리 제한 관리)
  await safeCreateTable('쿠폰 제한 관리', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'coupon_id', type: 'TEXT', notNull: true },
    { name: 'restriction_type', type: 'TEXT', notNull: true }, // 'INCLUDE' (허용), 'EXCLUDE' (제외)
    { name: 'target_type', type: 'TEXT', notNull: true }, // 'PRODUCT' (상품), 'CATEGORY' (카테고리)
    { name: 'target_value', type: 'TEXT', notNull: true }, // 제한 대상 값 (예: 상품 ID 또는 카테고리명)
    { name: 'created_at', type: 'TEXT', notNull: true },
  ], { tableName: 'crm_coupons_restrictions', uniqueKeyColumns: ['id'] });

  // 19. CRM Point History Table (적립금 내역 관리)
  await safeCreateTable('적립금 내역', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'customer_id', type: 'INTEGER', notNull: true },
    { name: 'transaction_type', type: 'TEXT', notNull: true }, // 'EARN'(적립), 'USE'(사용), 'CANCEL'(취소), 'ADMIN'(수동조정)
    { name: 'amount', type: 'INTEGER', notNull: true },
    { name: 'balance_after', type: 'INTEGER', notNull: true },
    { name: 'description', type: 'TEXT' },
    { name: 'related_entity_type', type: 'TEXT' }, // 'ORDER', 'PAYMENT', 'COUPON' 등
    { name: 'related_entity_id', type: 'TEXT' },
    { name: 'created_at', type: 'TEXT', notNull: true }
  ], { tableName: 'crm_point_history', uniqueKeyColumns: ['id'] });

  // 20. CRM Estimates Table (견적 관리)
  await safeCreateTable('견적서 관리', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'type', type: 'TEXT', notNull: true },               // 'INBOUND' or 'OUTBOUND'
    { name: 'direction_status', type: 'TEXT' },                 // 'REQUESTED', 'DRAFT', 'SENT', 'RECEIVED'
    { name: 'partner_name', type: 'TEXT', notNull: true },
    { name: 'partner_phone', type: 'TEXT' },
    { name: 'total_amount', type: 'INTEGER' },
    { name: 'file_url', type: 'TEXT' },
    { name: 'business_license_url', type: 'TEXT' },             // 첫 견적 요청 시 사업자등록증 첨부 파일 경로
    { name: 'ai_parsed', type: 'INTEGER', defaultValue: 0 },
    { name: 'created_at', type: 'TEXT', notNull: true },
    { name: 'uuid', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: 'updated_by', type: 'TEXT' },
    { name: 'deleted_at', type: 'TEXT' },
    { name: 'deleted_by', type: 'TEXT' },
    { name: 'restored_at', type: 'TEXT' },
    { name: 'restored_by', type: 'TEXT' }
  ], { tableName: 'crm_estimates', uniqueKeyColumns: ['id'] });

  // 21. CRM Estimate Items Table (견적 품목 관리)
  await safeCreateTable('견적서 품목 상세', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'estimate_id', type: 'TEXT', notNull: true },
    { name: 'product_id', type: 'TEXT' },
    { name: 'product_name', type: 'TEXT', notNull: true },
    { name: 'quantity', type: 'INTEGER', notNull: true },
    { name: 'unit_price', type: 'INTEGER', notNull: true },
    { name: 'amount', type: 'INTEGER', notNull: true }
  ], { tableName: 'crm_estimate_items', uniqueKeyColumns: ['id'] });

  // 22. CRM Purchase Orders Table (발주 관리)
  await safeCreateTable('발주서 관리', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'estimate_id', type: 'TEXT' },
    { name: 'vendor_name', type: 'TEXT', notNull: true },
    { name: 'vendor_phone', type: 'TEXT' },
    { name: 'status', type: 'TEXT', notNull: true },             // 'PENDING_INBOUND', 'INBOUND_COMPLETED'
    { name: 'total_amount', type: 'INTEGER' },
    { name: 'created_at', type: 'TEXT', notNull: true },
    { name: 'completed_at', type: 'TEXT' }
  ], { tableName: 'crm_purchase_orders', uniqueKeyColumns: ['id'] });

  // 23. CRM Sales Orders Table (수주 관리)
  await safeCreateTable('수주서 관리', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'estimate_id', type: 'TEXT' },
    { name: 'customer_name', type: 'TEXT', notNull: true },
    { name: 'customer_phone', type: 'TEXT' },
    { name: 'status', type: 'TEXT', notNull: true },             // 'REGISTERED', 'CONFIRMED'
    { name: 'total_amount', type: 'INTEGER' },
    { name: 'created_at', type: 'TEXT', notNull: true }
  ], { tableName: 'crm_sales_orders', uniqueKeyColumns: ['id'] });

  // 24. CRM Partners Table (B2B 거래처 관리)
  await safeCreateTable('거래처 관리', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'type', type: 'TEXT', notNull: true },               // 'VENDOR' or 'BUYER'
    { name: 'company_name', type: 'TEXT', notNull: true },
    { name: 'business_number', type: 'TEXT' },
    { name: 'representative', type: 'TEXT' },
    { name: 'phone', type: 'TEXT' },
    { name: 'manager_name', type: 'TEXT' },
    { name: 'manager_phone', type: 'TEXT' },
    { name: 'email', type: 'TEXT' },
    { name: 'address', type: 'TEXT' },
    { name: 'vip_level', type: 'TEXT', defaultValue: 'NORMAL' }, // 'NORMAL', 'VIP'
    { name: 'credit_limit', type: 'INTEGER', defaultValue: 0 },
    { name: 'business_license_url', type: 'TEXT' },             // 파트너의 공식 사업자등록증 첨부 파일 경로
    { name: 'memo', type: 'TEXT' },
    { name: 'created_at', type: 'TEXT', notNull: true },
    { name: 'uuid', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: 'updated_by', type: 'TEXT' },
    { name: 'deleted_at', type: 'TEXT' },
    { name: 'deleted_by', type: 'TEXT' },
    { name: 'restored_at', type: 'TEXT' },
    { name: 'restored_by', type: 'TEXT' }
  ], { tableName: 'crm_partners', uniqueKeyColumns: ['id'] });

  // 25. CRM SnapTasks Table (스냅태스크 관리)
  await safeCreateTable('스냅태스크 관리', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'title', type: 'TEXT', notNull: true },
    { name: 'status', type: 'TEXT', defaultValue: 'ACTIVE' },   // 'ACTIVE', 'COMPLETED', 'ARCHIVED'
    { name: 'partner_id', type: 'TEXT' },
    { name: 'created_at', type: 'TEXT', notNull: true },
    { name: 'updated_at', type: 'TEXT', notNull: true }
  ], { tableName: 'crm_snaptasks', uniqueKeyColumns: ['id'] });

  // 26. CRM SnapTask Items Table (스냅태스크 타임라인 상세)
  await safeCreateTable('스냅태스크 상세 내역', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'task_id', type: 'TEXT', notNull: true },
    { name: 'content_text', type: 'TEXT' },
    { name: 'file_url', type: 'TEXT' },
    { name: 'file_type', type: 'TEXT', notNull: true },         // 'IMAGE', 'PDF', 'AUDIO', 'LINK', 'TEXT'
    { name: 'ai_analysis', type: 'TEXT' },                      // AI 분석 정형 JSON 스트링
    { name: 'created_at', type: 'TEXT', notNull: true }
  ], { tableName: 'crm_snaptask_items', uniqueKeyColumns: ['id'] });

  // 27. CRM SnapTask Actions Table (자율 액션 히스토리 감사록)
  await safeCreateTable('스냅태스크 AI 액션 감사록', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'task_id', type: 'TEXT', notNull: true },
    { name: 'action_type', type: 'TEXT', notNull: true },       // 'PARTNER_REGISTER', 'ESTIMATE_DRAFT', 'ORDER_CONFIRM', 'SMS_SENT'
    { name: 'description', type: 'TEXT', notNull: true },
    { name: 'created_at', type: 'TEXT', notNull: true }
  ], { tableName: 'crm_snaptask_actions', uniqueKeyColumns: ['id'] });

  // 28. CRM Partner Contacts Table (B2B 담당자 명함첩 대장)
  await safeCreateTable('거래처 담당자 명함첩', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'partner_id', type: 'TEXT', notNull: true },         // crm_partners 외래키
    { name: 'name', type: 'TEXT', notNull: true },
    { name: 'position', type: 'TEXT' },
    { name: 'phone', type: 'TEXT' },
    { name: 'email', type: 'TEXT' },
    { name: 'card_image_url', type: 'TEXT' },
    { name: 'is_primary', type: 'INTEGER', defaultValue: 0 },   // 1: 주대표 실무자, 0: 일반 실무자
    { name: 'created_at', type: 'TEXT', notNull: true }
  ], { tableName: 'crm_partner_contacts', uniqueKeyColumns: ['id'] });  // 29. Inventory Items Table (재고 품목 대장)
  await safeCreateTable('재고 품목', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'type', type: 'TEXT', notNull: true },
    { name: 'name', type: 'TEXT', notNull: true },
    { name: 'category', type: 'TEXT', notNull: true },
    { name: 'price', type: 'REAL', notNull: true },
    { name: 'partner', type: 'TEXT' },
    { name: 'stock', type: 'INTEGER', notNull: true },
    { name: 'safeStock', type: 'INTEGER', notNull: true },
    { name: 'location', type: 'TEXT' },
    { name: 'spec', type: 'TEXT' },
    { name: 'unitType', type: 'TEXT' },
    { name: 'unitValue', type: 'TEXT' },
    { name: 'boxContains', type: 'INTEGER' },
    { name: 'description', type: 'TEXT' },
    { name: 'tags', type: 'TEXT' }, // 커스텀 멀티 태그 콤마 구분값
    { name: 'barcode', type: 'TEXT' }, // 바코드 번호 (USB 리더기/EAN-13 등 지원)
    { name: 'createdAt', type: 'TEXT', notNull: true },
    { name: 'uuid', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: 'updated_by', type: 'TEXT' },
    { name: 'deleted_at', type: 'TEXT' },
    { name: 'deleted_by', type: 'TEXT' },
    { name: 'restored_at', type: 'TEXT' },
    { name: 'restored_by', type: 'TEXT' }
  ], { tableName: 'inventory_items', uniqueKeyColumns: ['id'] });

  // 30. AI Token Usage Logs Table (AI 토큰 소모량 정밀 모니터링 로그 대장)
  await safeCreateTable('AI 토큰 사용량 로그', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'model', type: 'TEXT', notNull: true },
    { name: 'purpose', type: 'TEXT', notNull: true },
    { name: 'prompt_tokens', type: 'INTEGER', notNull: true },
    { name: 'completion_tokens', type: 'INTEGER', notNull: true },
    { name: 'total_tokens', type: 'INTEGER', notNull: true },
    { name: 'created_at', type: 'TEXT', notNull: true }
  ], { tableName: 'ai_token_usage_logs', uniqueKeyColumns: ['id'] });

  // 31. 추적 품목 마스터 테이블 (원자재 / 경쟁 제품 분류 및 마진 관리)
  await safeCreateTable('가격 추적 품목', [
    { name: 'item_id', type: 'INTEGER', notNull: true },
    { name: 'item_code', type: 'TEXT', notNull: true },
    { name: 'item_name', type: 'TEXT', notNull: true },
    { name: 'category', type: 'TEXT', notNull: true }, // RAW_MATERIAL, COMPETITOR_PRODUCT
    { name: 'spec', type: 'TEXT' }, // 상세 규격 정보 (용량, 수량 등)
    { name: 'base_price', type: 'REAL', notNull: true },
    { name: 'target_margin_rate', type: 'REAL', notNull: true },
    { name: 'created_at', type: 'TEXT' }
  ], { tableName: 'tracked_items', uniqueKeyColumns: ['item_id'] });

  // 32. 감시 대상 URL 및 수집 룰 관리 테이블
  await safeCreateTable('가격 감시 URL', [
    { name: 'url_id', type: 'INTEGER', notNull: true },
    { name: 'item_id', type: 'INTEGER', notNull: true },
    { name: 'site_name', type: 'TEXT', notNull: true },
    { name: 'target_url', type: 'TEXT', notNull: true },
    { name: 'css_selector', type: 'TEXT', notNull: true },
    { name: 'xpath', type: 'TEXT' },
    { name: 'cron_interval', type: 'TEXT', notNull: true }, // '0 9 * * *' 등
    { name: 'is_active', type: 'INTEGER', notNull: true }, // 1: Active, 0: Inactive
    { name: 'created_at', type: 'TEXT' }
  ], { tableName: 'target_urls', uniqueKeyColumns: ['url_id'] });

  // 33. 수집 가격 이력 기록 테이블 (차트용 시세 추이 소스)
  await safeCreateTable('수집 가격 이력', [
    { name: 'history_id', type: 'INTEGER', notNull: true },
    { name: 'url_id', type: 'INTEGER', notNull: true },
    { name: 'captured_price', type: 'REAL', notNull: true },
    { name: 'captured_at', type: 'TEXT', notNull: true },
    { name: 'status', type: 'TEXT', notNull: true }, // SUCCESS, FAILED
    { name: 'error_message', type: 'TEXT' }
  ], { tableName: 'price_histories', uniqueKeyColumns: ['history_id'] });

  // 34. FreeSMS 알림 조건 및 템플릿 설정 테이블
  await safeCreateTable('가격 알림 규칙', [
    { name: 'rule_id', type: 'INTEGER', notNull: true },
    { name: 'item_id', type: 'INTEGER', notNull: true },
    { name: 'rule_name', type: 'TEXT', notNull: true },
    { name: 'condition_type', type: 'TEXT', notNull: true }, // ABOVE_LIMIT, BELOW_LIMIT, MARGIN_BREAKDOWN
    { name: 'threshold_value', type: 'REAL', notNull: true },
    { name: 'phone_number', type: 'TEXT', notNull: true },
    { name: 'sms_template', type: 'TEXT', notNull: true },
    { name: 'is_enabled', type: 'INTEGER', notNull: true } // 1: 활성, 0: 비활성
  ], { tableName: 'alert_rules', uniqueKeyColumns: ['rule_id'] });

  // 35. 알림 발송 이력 로그 테이블
  await safeCreateTable('가격 알림 발송 로그', [
    { name: 'log_id', type: 'INTEGER', notNull: true },
    { name: 'rule_id', type: 'INTEGER', notNull: true },
    { name: 'sent_price', type: 'REAL', notNull: true },
    { name: 'sent_message', type: 'TEXT', notNull: true },
    { name: 'sent_at', type: 'TEXT', notNull: true },
    { name: 'api_response', type: 'TEXT' }
  ], { tableName: 'alert_logs', uniqueKeyColumns: ['log_id'] });

  // 36. Inventory Logs Table (재고 변동 이력 감사록)
  await safeCreateTable('재고 변동 이력', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'itemId', type: 'INTEGER', notNull: true },
    { name: 'itemName', type: 'TEXT', notNull: true },
    { name: 'itemType', type: 'TEXT', notNull: true },
    { name: 'changeType', type: 'TEXT', notNull: true },
    { name: 'quantity', type: 'INTEGER', notNull: true },
    { name: 'price', type: 'REAL', notNull: true },
    { name: 'operator', type: 'TEXT', notNull: true },
    { name: 'note', type: 'TEXT' },
    { name: 'createdAt', type: 'TEXT', notNull: true }
  ], { tableName: 'inventory_logs', uniqueKeyColumns: ['id'] });

  // 37. CRM Expenses Table (지출 내역 대장)
  await safeCreateTable('지출 내역', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'title', type: 'TEXT', notNull: true },
    { name: 'category', type: 'TEXT', notNull: true },
    { name: 'amount', type: 'INTEGER', notNull: true },
    { name: 'expense_date', type: 'TEXT', notNull: true },
    { name: 'payment_method', type: 'TEXT', notNull: true },
    { name: 'attachment_url', type: 'TEXT' },
    { name: 'ai_analysis', type: 'TEXT' },
    { name: 'memo', type: 'TEXT' },
    { name: 'approval_status', type: 'TEXT', defaultValue: 'PENDING' },
    { name: 'approval_memo', type: 'TEXT' },
    { name: 'approved_at', type: 'TEXT' },
    { name: 'actual_expense_date', type: 'TEXT' },
    { name: 'deduction_amount', type: 'INTEGER', defaultValue: 0 },
    { name: 'transfer_fee', type: 'INTEGER', defaultValue: 0 },
    { name: 'created_at', type: 'TEXT', notNull: true },
    { name: 'uuid', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: 'updated_by', type: 'TEXT' },
    { name: 'deleted_at', type: 'TEXT' },
    { name: 'deleted_by', type: 'TEXT' },
    { name: 'restored_at', type: 'TEXT' },
    { name: 'restored_by', type: 'TEXT' }
  ], { tableName: 'crm_expenses', uniqueKeyColumns: ['id'] });

  // 38. Expense Settings Table (지출 예산 경보 설정)
  await safeCreateTable('지출 예산 설정', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'monthly_budget', type: 'INTEGER', notNull: true },
    { name: 'is_alert_enabled', type: 'INTEGER', notNull: true },
    { name: 'alert_threshold_percent', type: 'INTEGER', notNull: true },
    { name: 'alert_sms_template', type: 'TEXT', notNull: true },
    { name: 'alert_phone', type: 'TEXT', notNull: true },
    { name: 'created_at', type: 'TEXT', notNull: true }
  ], { tableName: 'expense_settings', uniqueKeyColumns: ['id'] });

  // ID 1의 기본 네이버 블로그 설정 존재 여부 확인 후 자동 주입
    try {
      const naverSettingsCheck = await queryTable('naver_blog_marketing_settings', { filters: { id: '1' } });
      if (!naverSettingsCheck.rows || naverSettingsCheck.rows.length === 0) {
        await insertRows('naver_blog_marketing_settings', [{
          id: 1,
          is_autopilot: 0,
          autopilot_interval: 'DAILY',
          autopilot_time: '10:00',
          tone_style: '정보제공형',
          naver_blog_id: '',
          api_client_id: '',
          api_client_secret: ''
        }]);
        console.log('Dummy Naver Blog settings seeded.');
      }
    } catch (e: any) {
      console.error('Error seeding naver blog settings:', e.message);
    }

    // ID 1의 기본 설정 존재 여부 확인 후 자동 주입
    try {
      const settingsCheck = await queryTable('instagram_marketing_settings', { filters: { id: '1' } });
      if (!settingsCheck.rows || settingsCheck.rows.length === 0) {
        await insertRows('instagram_marketing_settings', [{
          id: 1,
          is_autopilot: 0,
          autopilot_interval: 'DAILY',
          autopilot_time: '10:00',
          tone_style: '인플루언서형',
          instagram_username: '',
          access_token: ''
        }]);
        console.log('Dummy Instagram settings seeded.');
      } else {
        // 기존 데이터가 존재하지만 계정이 이전 임시 데모 ID 'charismagreat'인 경우 안전하게 빈 값으로 초기화(마이그레이션)
        const current = settingsCheck.rows[0];
        if (current.instagram_username === 'charismagreat') {
          await updateRows('instagram_marketing_settings', {
            instagram_username: '',
            access_token: ''
          }, { filters: { id: '1' } });
          console.log('Migrated legacy dummy instagram account settings to empty strings.');
        }
      }
    } catch (e: any) {
      console.error('Error seeding/migrating instagram settings:', e.message);
    }
  // 기존 더미 데이터 및 가짜 포스팅 이력 완전히 비우기 (실제 데이터만 남도록 초기화)
  try {
    const postsCheck = await queryTable('crm_instagram_posts', {});
    const posts = postsCheck.rows || [];
    if (posts.length > 0) {
      const ids = posts.map((post: any) => Number(post.id));
      await deleteRows('crm_instagram_posts', { ids });
      console.log('Cleared all instagram dummy posts successfully.');
    } else {
      console.log('No posts to clear.');
    }
  } catch (e: any) {
    console.error('Error clearing instagram dummy posts:', e.message);
  }

  // 포인트 적립 비율 기본 설정 (point_earning_rate: '1') 자동 주입
  try {
    const rateCheck = await queryTable('system_settings', { filters: { key: 'point_earning_rate' } });
    if (!rateCheck.rows || rateCheck.rows.length === 0) {
      await insertRows('system_settings', [{
        key: 'point_earning_rate',
        value: '1'
      }]);
      console.log('Point earning rate seeded with default value: 1%');
    }
  } catch (e: any) {
    console.error('Error seeding point earning rate setting:', e.message);
  }

  // 가격 추적 AI 기초 더미 데이터 및 시세 이력 시딩(Seeding)
  try {
    const itemsCheck = await queryTable('tracked_items', {});
    if (!itemsCheck.rows || itemsCheck.rows.length === 0) {
      const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      
      // 1. 구리 품목 시딩
      await insertRows('tracked_items', [{
        item_id: 1,
        item_code: 'RAW-COPPER-01',
        item_name: '런던금속거래소(LME) 구리 전기동',
        category: 'RAW_MATERIAL',
        base_price: 8200.00,
        target_margin_rate: 12.50,
        created_at: nowStr
      }]);
      
      // 2. 구리 URL 시딩
      await insertRows('target_urls', [{
        url_id: 1,
        item_id: 1,
        site_name: 'LME 구리 시세 페이지',
        target_url: 'https://www.lme.com/en/Metals/Non-ferrous/Copper',
        css_selector: 'div.price-table__current-price > span',
        cron_interval: '0 9 * * *',
        is_active: 1,
        created_at: nowStr
      }]);

      // 3. 최근 10일 가격 데이터 시딩 (SVG 차트 실시간 렌더링용)
      const mockPrices = [8150, 8220, 8180, 8310, 8450, 8580, 8620, 8500, 8420, 8850];
      for (let index = 0; index < mockPrices.length; index++) {
        const dateOffset = new Date(Date.now() + 9 * 60 * 60 * 1000 - (10 - index) * 24 * 60 * 60 * 1000);
        const dateStr = dateOffset.toISOString().replace('T', ' ').slice(0, 19);
        await insertRows('price_histories', [{
          history_id: index + 1,
          url_id: 1,
          captured_price: mockPrices[index],
          captured_at: dateStr,
          status: 'SUCCESS'
        }]);
      }

      // 4. 알림 조건 규칙 시딩
      await insertRows('alert_rules', [{
        rule_id: 1,
        item_id: 1,
        rule_name: '구리 가격 10% 폭등 및 마진 붕괴 경보',
        condition_type: 'MARGIN_BREAKDOWN',
        threshold_value: 5.00,
        phone_number: '010-1234-5678',
        sms_template: '[🚨가격경보] {item_name} 마진 붕괴! 현재가:{captured_price} USD',
        is_enabled: 1
      }]);

      console.log('Price Tracker AI dummy seed data successfully generated.');
    }
  } catch (e: any) {
    console.error('Error seeding Price Tracker AI data:', e.message);
  }

  // 39. 지출 관리 AI 기본 설정 및 더미 내역 시딩
  try {
    const settingsCheck = await queryTable('expense_settings', { filters: { id: '1' } });
    if (!settingsCheck.rows || settingsCheck.rows.length === 0) {
      const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      await insertRows('expense_settings', [{
        id: 1,
        monthly_budget: 3000000,
        is_alert_enabled: 1,
        alert_threshold_percent: 90,
        alert_sms_template: '[🚨지출AI] 예산 {경보임계율}% 도달! 누적 {누적지출}원 (한도 {월예산}원)',
        alert_phone: '010-1234-5678',
        created_at: nowStr
      }]);
      console.log('Expense settings seeded with default budget: 3,000,000 KRW');
    }
  } catch (e: any) {
    console.error('Error seeding expense settings:', e.message);
  }

  try {
    const expensesCheck = await queryTable('crm_expenses', {});
    if (!expensesCheck.rows || expensesCheck.rows.length === 0) {
      const now = new Date(Date.now() + 9 * 60 * 60 * 1000);
      const nowStr = now.toISOString().replace('T', ' ').slice(0, 19);
      
      const getPastDateStr = (daysAgo: number) => {
        const d = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        return d.toISOString().slice(0, 10);
      };

      const seedExpenses = [
        {
          id: 'exp-01',
          title: '직원 주말 특근 식대 (야식)',
          category: '복리후생비',
          amount: 85000,
          expense_date: getPastDateStr(2),
          payment_method: '법인카드',
          attachment_url: '',
          ai_analysis: JSON.stringify({ parsed: true, confidence: 0.98 }),
          memo: '복지지원, 소액결제',
          approval_status: 'PENDING',
          approved_at: null,
          actual_expense_date: null,
          deduction_amount: 0,
          transfer_fee: 0,
          created_at: nowStr
        },
        {
          id: 'exp-02',
          title: 'AWS 서버 호스팅 사용료 (5월분)',
          category: '소모품비',
          amount: 320000,
          expense_date: getPastDateStr(5),
          payment_method: '계좌이체',
          attachment_url: '',
          ai_analysis: JSON.stringify({ parsed: true, confidence: 0.99 }),
          memo: '인프라유지, 정기지출',
          approval_status: 'PENDING',
          approved_at: null,
          actual_expense_date: null,
          deduction_amount: 0,
          transfer_fee: 0,
          created_at: nowStr
        },
        {
          id: 'exp-03',
          title: '바이어 미팅 다과 및 커피 구매',
          category: '접대비',
          amount: 42000,
          expense_date: getPastDateStr(10),
          payment_method: '법인카드',
          attachment_url: '',
          ai_analysis: JSON.stringify({ parsed: true, confidence: 0.95 }),
          memo: '거래처접대, 소액결제',
          approval_status: 'PENDING',
          approved_at: null,
          actual_expense_date: null,
          deduction_amount: 0,
          transfer_fee: 0,
          created_at: nowStr
        },
        {
          id: 'exp-04',
          title: '지방 출장 KTX 왕복 운임',
          category: '여비교통비',
          amount: 114000,
          expense_date: getPastDateStr(15),
          payment_method: '법인카드',
          attachment_url: '',
          ai_analysis: JSON.stringify({ parsed: true, confidence: 0.97 }),
          memo: '정기지출, 긴급비용',
          approval_status: 'PENDING',
          approved_at: null,
          actual_expense_date: null,
          deduction_amount: 0,
          transfer_fee: 0,
          created_at: nowStr
        },
        {
          id: 'exp-05',
          title: '사무실 복사지 및 필기구 소모품 구입',
          category: '소모품비',
          amount: 58000,
          expense_date: getPastDateStr(20),
          payment_method: '현금영수증',
          attachment_url: '',
          ai_analysis: JSON.stringify({ parsed: true, confidence: 0.96 }),
          memo: '비품구매, 소액결제',
          approval_status: 'PENDING',
          approved_at: null,
          actual_expense_date: null,
          deduction_amount: 0,
          transfer_fee: 0,
          created_at: nowStr
        }
      ];

      await insertRows('crm_expenses', seedExpenses);
      console.log('Expense tracker mock seed data successfully generated.');
    }
  } catch (e: any) {
    console.error('Error seeding expenses data:', e.message);
  }

  // 39-1. 지출 계정과목 3단계 관리 테이블 신설
  await safeCreateTable('지출 계정과목 관리', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'main_category', type: 'TEXT', notNull: true },
    { name: 'mid_category', type: 'TEXT', notNull: true },
    { name: 'sub_category', type: 'TEXT', notNull: true },
    { name: 'created_at', type: 'TEXT', notNull: true }
  ], { tableName: 'expense_categories', uniqueKeyColumns: ['id'] });

  // 39-2. 지출 퀵 태그 프리셋/커스텀 관리 테이블 신설
  await safeCreateTable('지출 태그 관리', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'name', type: 'TEXT', notNull: true },
    { name: 'created_at', type: 'TEXT', notNull: true }
  ], { tableName: 'expense_tags', uniqueKeyColumns: ['id'] });

  // 39-3. 계정과목 및 태그 기초 시딩
  try {
    const catsCheck = await queryTable('expense_categories', {});
    // 강제 이식을 보장하기 위해 구식 카테고리 감지 시 자동으로 국세청 표준 65선으로 무손실 Overwrite 마이그레이션 가동
    if (!catsCheck.rows || catsCheck.rows.length < 40) {
      console.log('Detected outdated or partial expense categories. Upgrading to official National Tax Service standards...');
      
      // 기존 구식 데이터 영구 삭제 (ids를 명시하여 안전한 삭제 실행)
      const legacyIds = (catsCheck.rows || []).map((r: any) => r.id).filter(Boolean);
      if (legacyIds.length > 0) {
        await deleteRows('expense_categories', { ids: legacyIds });
      }
      
      const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      const initialCategories = [
        // 판매비와관리비 - 급여
        { id: 'cat-01', main_category: '판매비와관리비', mid_category: '급여', sub_category: '직원급여', created_at: nowStr },
        { id: 'cat-02', main_category: '판매비와관리비', mid_category: '급여', sub_category: '상여금', created_at: nowStr },
        { id: 'cat-03', main_category: '판매비와관리비', mid_category: '급여', sub_category: '퇴직급여', created_at: nowStr },
        // 판매비와관리비 - 복리후생비
        { id: 'cat-04', main_category: '판매비와관리비', mid_category: '복리후생비', sub_category: '직원식대', created_at: nowStr },
        { id: 'cat-05', main_category: '판매비와관리비', mid_category: '복리후생비', sub_category: '직원야근식대', created_at: nowStr },
        { id: 'cat-06', main_category: '판매비와관리비', mid_category: '복리후생비', sub_category: '경조사비', created_at: nowStr },
        { id: 'cat-07', main_category: '판매비와관리비', mid_category: '복리후생비', sub_category: '음료및간식비', created_at: nowStr },
        { id: 'cat-08', main_category: '판매비와관리비', mid_category: '복리후생비', sub_category: '피복비', created_at: nowStr },
        { id: 'cat-09', main_category: '판매비와관리비', mid_category: '복리후생비', sub_category: '직원교육비', created_at: nowStr },
        { id: 'cat-10', main_category: '판매비와관리비', mid_category: '복리후생비', sub_category: '건강검진비', created_at: nowStr },
        // 판매비와관리비 - 여비교통비
        { id: 'cat-11', main_category: '판매비와관리비', mid_category: '여비교통비', sub_category: '시내교통비', created_at: nowStr },
        { id: 'cat-12', main_category: '판매비와관리비', mid_category: '여비교통비', sub_category: '택시비', created_at: nowStr },
        { id: 'cat-13', main_category: '판매비와관리비', mid_category: '여비교통비', sub_category: '유류비', created_at: nowStr },
        { id: 'cat-14', main_category: '판매비와관리비', mid_category: '여비교통비', sub_category: '톨게이트비', created_at: nowStr },
        { id: 'cat-15', main_category: '판매비와관리비', mid_category: '여비교통비', sub_category: '주차요금', created_at: nowStr },
        { id: 'cat-16', main_category: '판매비와관리비', mid_category: '여비교통비', sub_category: '출장숙박비', created_at: nowStr },
        { id: 'cat-17', main_category: '판매비와관리비', mid_category: '여비교통비', sub_category: 'KTX/항공료', created_at: nowStr },
        // 판매비와관리비 - 임차료
        { id: 'cat-18', main_category: '판매비와관리비', mid_category: '지급임차료', sub_category: '사무실임차료', created_at: nowStr },
        { id: 'cat-19', main_category: '판매비와관리비', mid_category: '지급임차료', sub_category: '기계장비임차료', created_at: nowStr },
        { id: 'cat-20', main_category: '판매비와관리비', mid_category: '지급임차료', sub_category: '대화실대관료', created_at: nowStr },
        // 판매비와관리비 - 통신비
        { id: 'cat-21', main_category: '판매비와관리비', mid_category: '통신비', sub_category: '전화요금', created_at: nowStr },
        { id: 'cat-22', main_category: '판매비와관리비', mid_category: '통신비', sub_category: '인터넷요금', created_at: nowStr },
        { id: 'cat-23', main_category: '판매비와관리비', mid_category: '통신비', sub_category: '우편송달료', created_at: nowStr },
        // 판매비와관리비 - 세금과공과
        { id: 'cat-24', main_category: '판매비와관리비', mid_category: '세금과공과', sub_category: '지방세/재산세', created_at: nowStr },
        { id: 'cat-25', main_category: '판매비와관리비', mid_category: '세금과공과', sub_category: '자동차세', created_at: nowStr },
        { id: 'cat-26', main_category: '판매비와관리비', mid_category: '세금과공과', sub_category: '협회비', created_at: nowStr },
        { id: 'cat-27', main_category: '판매비와관리비', mid_category: '세금과공과', sub_category: '공과금', created_at: nowStr },
        // 판매비와관리비 - 소모품비
        { id: 'cat-28', main_category: '판매비와관리비', mid_category: '소모품비', sub_category: '사무용품비', created_at: nowStr },
        { id: 'cat-29', main_category: '판매비와관리비', mid_category: '소모품비', sub_category: '사무비품비', created_at: nowStr },
        { id: 'cat-30', main_category: '판매비와관리비', mid_category: '소모품비', sub_category: '전산소모품비', created_at: nowStr },
        // 판매비와관리비 - 접대비
        { id: 'cat-31', main_category: '판매비와관리비', mid_category: '접대비(기업업무추진비)', sub_category: '거래처식사비', created_at: nowStr },
        { id: 'cat-32', main_category: '판매비와관리비', mid_category: '접대비(기업업무추진비)', sub_category: '거래처선물비', created_at: nowStr },
        { id: 'cat-33', main_category: '판매비와관리비', mid_category: '접대비(기업업무추진비)', sub_category: '거래처경조사비', created_at: nowStr },
        // 판매비와관리비 - 도서인쇄비
        { id: 'cat-34', main_category: '판매비와관리비', mid_category: '도서인쇄비', sub_category: '도서구입비', created_at: nowStr },
        { id: 'cat-35', main_category: '판매비와관리비', mid_category: '도서인쇄비', sub_category: '인쇄물제작비', created_at: nowStr },
        { id: 'cat-36', main_category: '판매비와관리비', mid_category: '도서인쇄비', sub_category: '명함제작비', created_at: nowStr },
        // 판매비와관리비 - 차량유지비
        { id: 'cat-37', main_category: '판매비와관리비', mid_category: '차량유지비', sub_category: '차량수리비', created_at: nowStr },
        { id: 'cat-38', main_category: '판매비와관리비', mid_category: '차량유지비', sub_category: '유류비', created_at: nowStr },
        { id: 'cat-39', main_category: '판매비와관리비', mid_category: '차량유지비', sub_category: '차량보험료', created_at: nowStr },
        // 판매비와관리비 - 광고선전비
        { id: 'cat-40', main_category: '판매비와관리비', mid_category: '광고선전비', sub_category: '온라인광고비', created_at: nowStr },
        { id: 'cat-41', main_category: '판매비와관리비', mid_category: '광고선전비', sub_category: '홍보물제작비', created_at: nowStr },
        { id: 'cat-42', main_category: '판매비와관리비', mid_category: '광고선전비', sub_category: 'SNS마케팅비', created_at: nowStr },
        // 판매비와관리비 - 지급수수료
        { id: 'cat-43', main_category: '판매비와관리비', mid_category: '지급수수료', sub_category: '세무기장수수료', created_at: nowStr },
        { id: 'cat-44', main_category: '판매비와관리비', mid_category: '지급수수료', sub_category: '은행이체수수료', created_at: nowStr },
        { id: 'cat-45', main_category: '판매비와관리비', mid_category: '지급수수료', sub_category: '카드가맹점수수료', created_at: nowStr },
        { id: 'cat-46', main_category: '판매비와관리비', mid_category: '지급수수료', sub_category: '특허대행수수료', created_at: nowStr },
        // 제조/물류원가 - 외주가공비
        { id: 'cat-47', main_category: '제조/물류원가', mid_category: '외주가공비', sub_category: '임가공외주비', created_at: nowStr },
        { id: 'cat-48', main_category: '제조/물류원가', mid_category: '외주가공비', sub_category: '소프트웨어외주비', created_at: nowStr },
        { id: 'cat-49', main_category: '제조/물류원가', mid_category: '외주가공비', sub_category: '용역비', created_at: nowStr },
        // 제조/물류원가 - 운반비
        { id: 'cat-50', main_category: '제조/물류원가', mid_category: '운반비', sub_category: '택배배송비', created_at: nowStr },
        { id: 'cat-51', main_category: '제조/물류원가', mid_category: '운반비', sub_category: '퀵서비스비', created_at: nowStr },
        { id: 'cat-52', main_category: '제조/물류원가', mid_category: '운반비', sub_category: '화물운송료', created_at: nowStr },
        // 제조/물류원가 - 포장비
        { id: 'cat-53', main_category: '제조/물류원가', mid_category: '포장비', sub_category: '박스구매비', created_at: nowStr },
        { id: 'cat-54', main_category: '제조/물류원가', mid_category: '포장비', sub_category: '박스테이프비', created_at: nowStr },
        { id: 'cat-55', main_category: '제조/물류원가', mid_category: '포장비', sub_category: '완충재구매비', created_at: nowStr },
        // 제조/물류원가 - 원재료비
        { id: 'cat-56', main_category: '제조/물류원가', mid_category: '원재료비', sub_category: '원자재구매비', created_at: nowStr },
        { id: 'cat-57', main_category: '제조/물류원가', mid_category: '원재료비', sub_category: '수입원료대금', created_at: nowStr },
        // 제조/물류원가 - 부재료비
        { id: 'cat-58', main_category: '제조/물류원가', mid_category: '부재료비', sub_category: '부품구매비', created_at: nowStr },
        { id: 'cat-59', main_category: '제조/물류원가', mid_category: '부재료비', sub_category: '부자재구매비', created_at: nowStr },
        // 영업외비용 - 이자비용
        { id: 'cat-60', main_category: '영업외비용', mid_category: '이자비용', sub_category: '은행대출이자', created_at: nowStr },
        { id: 'cat-61', main_category: '영업외비용', mid_category: '이자비용', sub_category: '보증금이자', created_at: nowStr },
        // 영업외비용 - 기부금
        { id: 'cat-62', main_category: '영업외비용', mid_category: '기부금', sub_category: '법정기부금', created_at: nowStr },
        { id: 'cat-63', main_category: '영업외비용', mid_category: '기부금', sub_category: '지정기부금', created_at: nowStr },
        // 영업외비용 - 잡손실
        { id: 'cat-64', main_category: '영업외비용', mid_category: '잡손실', sub_category: '잡손실', created_at: nowStr },
        { id: 'cat-65', main_category: '영업외비용', mid_category: '잡손실', sub_category: '소액차손', created_at: nowStr }
      ];
      await insertRows('expense_categories', initialCategories);
      console.log('Expense categories successfully upgraded to National Tax Service standards.');
    }
  } catch (e: any) {
    console.error('Error seeding expense categories:', e.message);
  }

  try {
    const tagsCheck = await queryTable('expense_tags', {});
    if (!tagsCheck.rows || tagsCheck.rows.length === 0) {
      const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      const initialTags = [
        { id: 'tag-01', name: 'SCM팀', created_at: nowStr },
        { id: 'tag-02', name: '정기지출', created_at: nowStr },
        { id: 'tag-03', name: '긴급비용', created_at: nowStr },
        { id: 'tag-04', name: '벌크구매', created_at: nowStr },
        { id: 'tag-05', name: '거래처접대', created_at: nowStr },
        { id: 'tag-06', name: '복지지원', created_at: nowStr },
        { id: 'tag-07', name: '소액결제', created_at: nowStr },
        { id: 'tag-08', name: '인프라유지', created_at: nowStr },
        { id: 'tag-09', name: '비품구매', created_at: nowStr },
        { id: 'tag-10', name: '마케팅홍보', created_at: nowStr }
      ];
      await insertRows('expense_tags', initialTags);
      console.log('Expense tags successfully seeded.');
    }
  } catch (e: any) {
    console.error('Error seeding expense tags:', e.message);
  }

  // 39-4. 사내 부서 관리 테이블 신설
  await safeCreateTable('지출 부서 관리', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'name', type: 'TEXT', notNull: true },
    { name: 'created_at', type: 'TEXT', notNull: true }
  ], { tableName: 'expense_departments', uniqueKeyColumns: ['id'] });

  // 39-5. 사내 임직원 관리 테이블 신설
  await safeCreateTable('지출 임직원 관리', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'name', type: 'TEXT', notNull: true },
    { name: 'created_at', type: 'TEXT', notNull: true }
  ], { tableName: 'expense_employees', uniqueKeyColumns: ['id'] });

  // 39-6. 수행 프로젝트 관리 테이블 신설
  await safeCreateTable('지출 프로젝트 관리', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'name', type: 'TEXT', notNull: true },
    { name: 'created_at', type: 'TEXT', notNull: true },
    { name: 'uuid', type: 'TEXT' },
    { name: 'updated_at', type: 'TEXT' },
    { name: 'updated_by', type: 'TEXT' },
    { name: 'deleted_at', type: 'TEXT' },
    { name: 'deleted_by', type: 'TEXT' },
    { name: 'restored_at', type: 'TEXT' },
    { name: 'restored_by', type: 'TEXT' }
  ], { tableName: 'expense_projects', uniqueKeyColumns: ['id'] });

  // 39-7. 부서, 직원, 프로젝트 기초 시딩
  try {
    const deptsCheck = await queryTable('expense_departments', {});
    if (!deptsCheck.rows || deptsCheck.rows.length === 0) {
      const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      const initialDepts = [
        { id: 'dept-01', name: '경영지원팀', created_at: nowStr },
        { id: 'dept-02', name: 'SCM팀', created_at: nowStr },
        { id: 'dept-03', name: '물류운송부', created_at: nowStr },
        { id: 'dept-04', name: '기술개발부', created_at: nowStr },
        { id: 'dept-05', name: '영업본부', created_at: nowStr },
        { id: 'dept-06', name: '인사총무부', created_at: nowStr },
        { id: 'dept-07', name: '기획디자인팀', created_at: nowStr },
        { id: 'dept-08', name: '마케팅홍보팀', created_at: nowStr }
      ];
      await insertRows('expense_departments', initialDepts);
      console.log('Expense departments seeded.');
    }
  } catch (e: any) {
    console.error('Error seeding departments:', e.message);
  }

  try {
    const empsCheck = await queryTable('expense_employees', {});
    if (!empsCheck.rows || empsCheck.rows.length === 0) {
      const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      const initialEmps = [
        { id: 'emp-01', name: '김경리', created_at: nowStr },
        { id: 'emp-02', name: '홍길동', created_at: nowStr },
        { id: 'emp-03', name: '이철수', created_at: nowStr },
        { id: 'emp-04', name: '박영희', created_at: nowStr },
        { id: 'emp-05', name: '최민수', created_at: nowStr },
        { id: 'emp-06', name: '이영민', created_at: nowStr }
      ];
      await insertRows('expense_employees', initialEmps);
      console.log('Expense employees seeded.');
    }
  } catch (e: any) {
    console.error('Error seeding employees:', e.message);
  }

  try {
    const projsCheck = await queryTable('expense_projects', {});
    if (!projsCheck.rows || projsCheck.rows.length === 0) {
      const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      const initialProjs = [
        { id: 'proj-01', name: 'FreeSMS 서비스 고도화', created_at: nowStr },
        { id: 'proj-02', name: 'B2B 유통 플랫폼 개발', created_at: nowStr },
        { id: 'proj-03', name: 'SCM 자율 관제 시스템', created_at: nowStr },
        { id: 'proj-04', name: '오프라인 매장 POS 연동', created_at: nowStr },
        { id: 'proj-05', name: '고객 마일리지 부스터 프로젝트', created_at: nowStr }
      ];
      await insertRows('expense_projects', initialProjs);
      console.log('Expense projects seeded.');
    }
  } catch (e: any) {
    console.error('Error seeding projects:', e.message);
  }

  // 40. Shared Dashboards Table (퍼블릭 대시보드 웹 공유 및 배치 자동 갱신)
  await safeCreateTable('공유 대시보드 관리', [
    { name: 'share_id', type: 'TEXT', notNull: true },
    { name: 'title', type: 'TEXT', notNull: true },
    { name: 'sql_query', type: 'TEXT', notNull: true },
    { name: 'table_name', type: 'TEXT' },
    { name: 'display_name', type: 'TEXT' },
    { name: 'chart_spec_json', type: 'TEXT' },
    { name: 'briefing_markdown', type: 'TEXT' },
    { name: 'refresh_interval', type: 'TEXT', defaultValue: 'NONE' },
    { name: 'last_refreshed_at', type: 'TEXT' },
    { name: 'created_at', type: 'TEXT', notNull: true },
    { name: 'is_active', type: 'INTEGER', defaultValue: 1 },
    { name: 'sort_order', type: 'INTEGER', defaultValue: 0 },
    { name: 'is_pinned', type: 'INTEGER', defaultValue: 1 },
    { name: 'custom_title', type: 'TEXT' }
  ], { tableName: 'shared_dashboards', uniqueKeyColumns: ['share_id'] });

  // 41. System Menu Settings Table (사이드바 동적 메뉴 활성 및 순서 설정)
  await safeCreateTable('시스템 메뉴 설정', [
    { name: 'menu_href', type: 'TEXT', notNull: true },
    { name: 'is_enabled', type: 'INTEGER', notNull: true, defaultValue: 1 },
    { name: 'sort_order', type: 'INTEGER', notNull: true }
  ], { tableName: 'system_menu_settings', uniqueKeyColumns: ['menu_href'], duplicateAction: 'update' });

  // 42. Safety Policies Table (안전보건방침 및 목표 설정 대장)
  await safeCreateTable('안전보건방침 및 목표', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'year', type: 'TEXT', notNull: true },
    { name: 'policy_title', type: 'TEXT', notNull: true },
    { name: 'targets_json', type: 'TEXT', notNull: true },
    { name: 'established_at', type: 'TEXT', notNull: true },
    { name: 'established_by', type: 'TEXT', notNull: true }
  ], { tableName: 'safety_policies', uniqueKeyColumns: ['year'], duplicateAction: 'update' });

  // 43. Safety Risk Assessments Table (AI 위험성평가 수립 대장)
  await safeCreateTable('AI 위험성평가서', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'work_name', type: 'TEXT', notNull: true },
    { name: 'work_date', type: 'TEXT', notNull: true },
    { name: 'hazards_json', type: 'TEXT', notNull: true },
    { name: 'risk_level', type: 'TEXT', notNull: true },
    { name: 'evaluated_by', type: 'TEXT', notNull: true },
    { name: 'approved_at', type: 'TEXT' },
    { name: 'status', type: 'TEXT', defaultValue: 'DRAFT' }
  ], { tableName: 'safety_risk_assessments', uniqueKeyColumns: ['id'] });

  // 44. Safety TBM Logs Table (TBM 실시 일지 대장)
  await safeCreateTable('TBM 안전 교육 대장', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'tbm_date', type: 'TEXT', notNull: true },
    { name: 'work_leader', type: 'TEXT', notNull: true },
    { name: 'weather_info', type: 'TEXT' },
    { name: 'tbm_script', type: 'TEXT', notNull: true },
    { name: 'attendees_count', type: 'INTEGER', defaultValue: 0 },
    { name: 'attendee_signatures', type: 'TEXT', notNull: true },
    { name: 'created_at', type: 'TEXT', notNull: true }
  ], { tableName: 'safety_tbm_logs', uniqueKeyColumns: ['id'] });

  // 45. Safety Near Misses Table (근로자 아차사고 및 유해요소 제보 대장)
  await safeCreateTable('아차사고 및 유해요소 제보 대장', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'reporter_name', type: 'TEXT', notNull: true },
    { name: 'hazard_location', type: 'TEXT', notNull: true },
    { name: 'description', type: 'TEXT', notNull: true },
    { name: 'photo_url', type: 'TEXT' },
    { name: 'risk_grade', type: 'TEXT', notNull: true },
    { name: 'action_status', type: 'TEXT', defaultValue: 'PENDING' },
    { name: 'action_description', type: 'TEXT' },
    { name: 'action_photo_url', type: 'TEXT' },
    { name: 'action_completed_at', type: 'TEXT' },
    { name: 'created_at', type: 'TEXT', notNull: true }
  ], { tableName: 'safety_near_misses', uniqueKeyColumns: ['id'] });

  // 46. Safety Inspect Logs Table (안전점검 감사 대장)
  await safeCreateTable('안전점검 감사 대장', [
    { name: 'id', type: 'INTEGER', notNull: true },
    { name: 'inspect_title', type: 'TEXT', notNull: true },
    { name: 'inspect_date', type: 'TEXT', notNull: true },
    { name: 'inspector_name', type: 'TEXT', notNull: true },
    { name: 'checklist_json', type: 'TEXT', notNull: true },
    { name: 'fail_actions_json', type: 'TEXT' },
    { name: 'created_at', type: 'TEXT', notNull: true }
  ], { tableName: 'safety_inspect_logs', uniqueKeyColumns: ['id'] });

  // 안전 관리 AI 기초 시딩 데이터 자동 주입
  try {
    const policyCheck = await queryTable('safety_policies', { filters: { year: '2026' } });
    if (!policyCheck.rows || policyCheck.rows.length === 0) {
      const nowStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);
      
      // 1. 2026년 안전보건방침 시딩
      await insertRows('safety_policies', [{
        id: 1,
        year: '2026',
        policy_title: '인간존중을 실천하는 전사적 안전문화 정착',
        targets_json: JSON.stringify([
          '안전보건예산 적기 집행율 100% 달성',
          '작업 전 TBM 100% 이행 및 QR 서명 정착',
          '중대재해 Zero 실현 및 잠재위험요인 선제적 통제'
        ]),
        established_at: nowStr,
        established_by: '김대표'
      }]);

      // 2. 위험성평가 사례 시딩
      await insertRows('safety_risk_assessments', [{
        id: 'risk-demo-01',
        work_name: '3공장 배터리 조립라인 정기 정비 작업',
        work_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        hazards_json: JSON.stringify([
          {
            hazard: '설비 정비 중 예기치 않은 전원 재인입으로 인한 감전',
            type: '감전',
            measure: '정비 전 LOTO(Lock-Out, Tag-Out) 절차 수립 및 전원 차단 잠금장치 부착'
          },
          {
            hazard: '조립설비 상부 윤활유 교체 시 미끄러짐으로 인한 낙하',
            type: '추락',
            measure: '안전모 및 안전대 착용 필수, 미끄럼 방지 안전화 교체 확인'
          }
        ]),
        risk_level: '중',
        evaluated_by: '김안전',
        approved_at: nowStr,
        status: 'APPROVED'
      }]);

      // 3. 오늘의 TBM 일지 시딩
      await insertRows('safety_tbm_logs', [{
        id: 'tbm-demo-01',
        tbm_date: new Date(Date.now()).toISOString().slice(0, 10),
        work_leader: '김안전',
        weather_info: '맑음',
        tbm_script: '동료 여러분 반갑습니다. 오늘 3공장 배터리 조립라인 정비 작업 전 안전회의를 시작합니다. 우선 정비 전에 LOTO 잠금 조치를 완벽히 이행했는지 전원 상태를 교차 검증해 주세요. 고소 작업 시에는 반드시 안전대 체결을 생활화하고 미끄럼 방지에 각별히 주의하시기 바랍니다. 오늘도 무재해 하루를 만들어 갑시다! 안전!',
        attendees_count: 2,
        attendee_signatures: JSON.stringify([
          {
            worker_name: '이철수',
            signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWAQMAAABC...',
            signed_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
          },
          {
            worker_name: '박영희',
            signature_data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAACWAQMAAABC...',
            signed_at: new Date(Date.now() - 1.9 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19)
          }
        ]),
        created_at: nowStr
      }]);

      // 4. 아차사고 대기중인 건 시딩
      await insertRows('safety_near_misses', [{
        id: 'miss-demo-01',
        reporter_name: '이철수',
        hazard_location: '2공장 원자재 적재장 통로',
        description: '지게차 이동 통로 바닥에 오일 누유 흔적이 넓게 퍼져 있어 보행 시 넘어질 뻔한 아차사고 발생. 방치 시 지게차 바퀴 미끄러짐 및 전도 우려됨.',
        photo_url: '',
        risk_grade: 'HIGH',
        action_status: 'PENDING',
        action_description: null,
        action_photo_url: null,
        action_completed_at: null,
        created_at: nowStr
      }]);

      console.log('Safety management AI seed data generated successfully.');
    }
  } catch (e: any) {
    console.error('Error seeding Safety Management AI data:', e.message);
  }

  // 47. Financial Statements Table (재무제표 관리)
  await safeCreateTable('재무제표 관리', [
    { name: 'id', type: 'TEXT', notNull: true },
    { name: 'company_id', type: 'TEXT', notNull: true },
    { name: 'company_type', type: 'TEXT', notNull: true },
    { name: 'fiscal_year', type: 'INTEGER', notNull: true },
    { name: 'fiscal_quarter', type: 'TEXT', notNull: true, defaultValue: 'YR' },
    { name: 'total_assets', type: 'INTEGER', defaultValue: 0 },
    { name: 'total_liabilities', type: 'INTEGER', defaultValue: 0 },
    { name: 'total_equity', type: 'INTEGER', defaultValue: 0 },
    { name: 'revenue', type: 'INTEGER', defaultValue: 0 },
    { name: 'operating_income', type: 'INTEGER', defaultValue: 0 },
    { name: 'net_income', type: 'INTEGER', defaultValue: 0 },
    { name: 'pdf_file_path', type: 'TEXT' },
    { name: 'parsed_raw_json', type: 'TEXT' },
    { name: 'created_at', type: 'TEXT', notNull: true },
    { name: 'updated_at', type: 'TEXT', notNull: true }
  ], { tableName: 'crm_financial_statements', uniqueKeyColumns: ['id'] });

  // 40-1. 기존 shared_dashboards 테이블 물리 ALTER TABLE 보정 마이그레이션 (자율 핫픽스)
  try {
    const Database = require('better-sqlite3');
    const os = require('os');
    const path = require('path');
    const fs = require('fs');

    const homeDir = os.homedir();
    const appData = process.env.APPDATA || path.join(homeDir, 'AppData/Roaming');
    const paths = [
      path.join(appData, 'EGDesk/database/user_data.db'),
      path.join(appData, 'egdesk/database/user_data.db')
    ];
    
    let targetPath = '';
    for (const p of paths) {
      if (fs.existsSync(p)) {
        targetPath = p;
        break;
      }
    }
    
    if (!targetPath) {
      targetPath = paths[0];
    }

    // 윈도우 환경 및 빌드 번들러 경로 구분자 오작동 방지를 위한 수동 포워드 슬래시 정규화 및 상위 디렉토리 생성
    const normalizedPath = targetPath.replace(/\\/g, '/');
    const dir = normalizedPath.substring(0, normalizedPath.lastIndexOf('/'));
    if (dir && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const db = new Database(normalizedPath);
    
    const colInfo = db.prepare("PRAGMA table_info(shared_dashboards);").all();
    const colNames = colInfo.map((c: any) => c.name);
    
    if (!colNames.includes('sort_order')) {
      db.exec("ALTER TABLE shared_dashboards ADD COLUMN sort_order INTEGER DEFAULT 0;");
      console.log('✓ In-app migration: added sort_order to shared_dashboards');
    }
    if (!colNames.includes('is_pinned')) {
      db.exec("ALTER TABLE shared_dashboards ADD COLUMN is_pinned INTEGER DEFAULT 1;");
      console.log('✓ In-app migration: added is_pinned to shared_dashboards');
    }
    if (!colNames.includes('custom_title')) {
      db.exec("ALTER TABLE shared_dashboards ADD COLUMN custom_title TEXT;");
      console.log('✓ In-app migration: added custom_title to shared_dashboards');
    }
    db.close();
  } catch (err: any) {
    console.error('⚠️ In-app migration error:', err.message);
  }

  console.log('Database setup complete.');
}
