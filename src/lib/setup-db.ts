import { createTable } from '../../egdesk-helpers';

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

  console.log('Database setup complete.');
}
