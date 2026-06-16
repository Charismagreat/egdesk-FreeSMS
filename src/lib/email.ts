import { queryTable } from '../../egdesk-helpers';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: any[];
  fromName?: string;
}

/**
 * DB에 저장된 SMTP 설정을 기반으로 이메일을 발송하는 공통 헬퍼 함수입니다.
 */
export async function sendMail(options: SendMailOptions) {
  const { to, subject, html, text, attachments, fromName = '이지데스크' } = options;

  // 1. 데이터베이스(system_settings)에서 SMTP 설정 정보 조회
  const hostSetting = await queryTable('system_settings', { filters: { key: 'email_smtp_host' } });
  const portSetting = await queryTable('system_settings', { filters: { key: 'email_smtp_port' } });
  const userSetting = await queryTable('system_settings', { filters: { key: 'email_smtp_user' } });
  const passSetting = await queryTable('system_settings', { filters: { key: 'email_smtp_pass' } });

  const smtpHost = hostSetting.rows?.[0]?.value || '';
  const smtpPort = parseInt(portSetting.rows?.[0]?.value || '465');
  const smtpUser = userSetting.rows?.[0]?.value || '';
  const smtpPass = passSetting.rows?.[0]?.value || '';

  // 설정값 누락 시 명시적 에러 발생
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error('발송용 이메일(SMTP) 설정이 등록되어 있지 않습니다. [시스템 설정 > 발송 메일 SMTP 계정 설정] 메뉴에서 메일 발송 서버를 먼저 등록해 주세요.');
  }

  // 2. Nodemailer 전송 인터페이스 초기화 및 전송 실행
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // 465일 때만 SSL 적용
    auth: {
      user: smtpUser,
      pass: smtpPass
    },
    connectionTimeout: 12000 // 연결 대기 제한시간 12초
  });

  await transporter.sendMail({
    from: `"${fromName}" <${smtpUser}>`,
    to,
    subject,
    html,
    text,
    attachments
  });
}
