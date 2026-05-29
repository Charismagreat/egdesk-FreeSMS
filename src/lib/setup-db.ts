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
    { name: 'is_estimate_price', type: 'INTEGER', defaultValue: 0 }
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
    { name: 'created_at', type: 'TEXT' }
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
    { name: 'created_at', type: 'TEXT', notNull: true }
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
    { name: 'created_at', type: 'TEXT', notNull: true }
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
    { name: 'createdAt', type: 'TEXT', notNull: true }
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
    { name: 'created_at', type: 'TEXT', notNull: true }
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
        sms_template: '[🚨 가격추적AI - 마진경보]\n품목: {item_name} ({item_code})\n현재시세: {captured_price} USD\n경고 내용: 설정된 최저 마진 보존선 5%가 무너졌습니다. 원재료 수급 및 판가 조율을 검토해 주세요.',
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
        alert_sms_template: '[🚨 이지데스크 - 지출 경보]\n사장님, 이번 달 누적 지출이 설정하신 예산 한도의 {경보임계율}%({경보금액}원)를 돌파했습니다!\n- 현재 누적 지출: {누적지출}원\n- 월별 예산 한도: {월예산}원\n불필요한 과지출이 없는지 경리 대장을 검토해 주세요.',
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
          memo: '개발팀 야근 식대',
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
          memo: '웹 서버 운영비',
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
          memo: '스타벅스 강남점',
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
          memo: '부산 지사 출장',
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
          memo: '알파문구',
          created_at: nowStr
        }
      ];

      await insertRows('crm_expenses', seedExpenses);
      console.log('Expense tracker mock seed data successfully generated.');
    }
  } catch (e: any) {
    console.error('Error seeding expenses data:', e.message);
  }

  console.log('Database setup complete.');
}
