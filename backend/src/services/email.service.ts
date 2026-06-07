import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

const USE_SENDGRID = !!process.env.SENDGRID_API_KEY;

if (USE_SENDGRID) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY!);
}

const transporter = USE_SENDGRID
  ? null
  : nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
      port: parseInt(process.env.SMTP_PORT || '2525'),
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    });

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(date));
}

function maskAccount(num?: string): string {
  if (!num || num.length < 4) return 'N/A';
  return `XXXX${num.slice(-4)}`;
}

function generateReceiptHtml(data: {
  logoUrl: string;
  totalPaid: string;
  currency: string;
  receiptNumber: string;
  paymentNumber: string;
  transferDate: string;
  destinationCountry: string;
  bankName: string;
  beneficiaryName: string;
  accountNumber: string;
  swiftCode: string;
  transferAmount: string;
  transferFee: string;
  supportPhone: string;
  supportEmail: string;
  currentYear: number;
  receiptPdfUrl: string;
  isSender: boolean;
}): string {
  const statusText = data.isSender ? 'Transfer Sent' : 'Transfer Received';
  const headerGradient = data.isSender
    ? 'linear-gradient(135deg, #dc2626, #ef4444, #f87171)'
    : 'linear-gradient(135deg, #16a34a, #22c55e, #34d399)';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Apex Bank Receipt</title>
<style>
body{margin:0;padding:0;background:#0f172a;font-family:Arial,Helvetica,sans-serif}
.wrapper{width:100%;padding:30px 10px;background:#0f172a}
.container{max-width:640px;margin:0 auto;background:#111827;border-radius:24px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.35)}
.header{background:${headerGradient};padding:40px 30px;text-align:center}
.logo{max-width:180px;margin-bottom:20px}
.success-badge{width:80px;height:80px;line-height:80px;border-radius:50%;margin:0 auto 20px;background:rgba(255,255,255,.2);color:#fff;font-size:42px;font-weight:bold}
.status{color:#fff;font-size:22px;font-weight:700;margin-bottom:10px}
.amount{color:#fff;font-size:48px;font-weight:800;line-height:1;margin-bottom:12px}
.subtext{color:#e5e7eb;font-size:14px}
.content{padding:30px}
.card{background:#1f2937;border:1px solid #374151;border-radius:18px;padding:24px;margin-bottom:24px}
.section-title{color:#fff;font-size:18px;font-weight:700;margin:0 0 18px}
table{width:100%;border-collapse:collapse}
td{padding:12px 0;border-bottom:1px solid #374151}
.label{color:#9ca3af;font-size:14px}
.value{color:#fff;font-size:14px;font-weight:600;text-align:right}
.total-row td{border-top:2px solid #22c55e;border-bottom:none;padding-top:18px}
.total{color:#34d399;font-size:20px;font-weight:800}
.notice{background:#0f172a;border-left:4px solid #22c55e;border-radius:10px;padding:18px;color:#d1d5db;font-size:14px;line-height:1.6}
.button{display:block;width:100%;box-sizing:border-box;text-align:center;background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff!important;text-decoration:none;padding:18px;border-radius:14px;font-size:16px;font-weight:700;margin-top:25px}
.footer{background:#0b1220;padding:30px;text-align:center}
.footer-text{color:#9ca3af;font-size:13px;line-height:1.7}
.support{color:#fff;font-weight:600}
@media screen and (max-width:600px){
.container{border-radius:18px}
.content{padding:20px}
.header{padding:30px 20px}
.amount{font-size:38px}
.value,.label{display:block;width:100%;text-align:left}
}
</style>
</head>
<body>
<div class="wrapper">
<div class="container">
<div class="header">
<img src="${data.logoUrl}" alt="Apex Bank" class="logo">
<div class="success-badge">✓</div>
<div class="status">${statusText}</div>
<div class="amount">$${data.totalPaid}</div>
<div class="subtext">International Transfer • ${data.currency}</div>
</div>

<div class="content">
<div class="card">
<h2 class="section-title">Transaction Details</h2>
<table>
<tr><td class="label">Receipt Number</td><td class="value">${data.receiptNumber}</td></tr>
<tr><td class="label">Payment Number</td><td class="value">${data.paymentNumber}</td></tr>
<tr><td class="label">Date & Time</td><td class="value">${data.transferDate}</td></tr>
<tr><td class="label">Status</td><td class="value">Completed</td></tr>
<tr><td class="label">Destination</td><td class="value">${data.destinationCountry}</td></tr>
</table>
</div>

<div class="card">
<h2 class="section-title">Beneficiary Information</h2>
<table>
<tr><td class="label">Bank Name</td><td class="value">${data.bankName}</td></tr>
<tr><td class="label">Account Name</td><td class="value">${data.beneficiaryName}</td></tr>
<tr><td class="label">Account Number</td><td class="value">${data.accountNumber}</td></tr>
<tr><td class="label">SWIFT / BIC</td><td class="value">${data.swiftCode}</td></tr>
</table>
</div>

<div class="card">
<h2 class="section-title">Payment Breakdown</h2>
<table>
<tr><td class="label">Transfer Amount</td><td class="value">$${data.transferAmount}</td></tr>
<tr><td class="label">Transfer Fee</td><td class="value">$${data.transferFee}</td></tr>
<tr class="total-row"><td class="label total">Total Paid</td><td class="value total">$${data.totalPaid}</td></tr>
</table>
</div>

<div class="notice">
<strong>Important Information</strong><br><br>
Please verify all beneficiary and transfer information carefully. Once funds are processed, recovery may not be possible if incorrect details were provided.
</div>

<a href="${data.receiptPdfUrl}" class="button">Download PDF Receipt</a>
</div>

<div class="footer">
<div class="footer-text">
Thank you for banking with <strong>Apex Bank</strong>.<br><br>
<span class="support">${data.supportPhone}</span><br>
<span class="support">${data.supportEmail}</span><br><br>
This is an automated transaction receipt.<br>
Please do not reply directly to this email.<br><br>
&copy; ${data.currentYear} Apex Bank. All rights reserved.
</div>
</div>
</div>
</div>
</body>
</html>`;
}

function generateReceiptNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'RCP-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
}) {
  if (USE_SENDGRID) {
    await sgMail.send({
      to: options.to,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@apexbank.com',
        name: process.env.SENDGRID_FROM_NAME || 'APEX BANK',
      },
      subject: options.subject,
      html: options.html,
    });
  } else {
    if (!process.env.SMTP_HOST) {
      console.log('SMTP not configured — skipping email send to', options.to);
      return;
    }
    await transporter!.sendMail({
      from: `"${process.env.SENDGRID_FROM_NAME || 'APEX BANK'}" <${process.env.SENDGRID_FROM_EMAIL || 'noreply@apexbank.com'}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });
  }
}

export async function sendWireTransferReceipt(data: {
  referenceNumber: string;
  amount: number;
  currency: string;
  senderName: string;
  senderEmail: string;
  beneficiaryName: string;
  bankName: string;
  swiftCode: string;
  beneficiaryAccountNumber: string;
  destinationCountry: string;
  fee: number;
  recipientEmail?: string | null;
}) {
  const amountFormatted = formatCurrency(data.amount, data.currency);
  const amountRaw = data.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const feeRaw = data.fee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalRaw = (data.amount + data.fee).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dateFormatted = formatDate(new Date());
  const receiptNumber = generateReceiptNumber();
  const year = new Date().getFullYear();

  const htmlData = {
    logoUrl: process.env.LOGO_URL || 'https://yourdomain.com/logo.png',
    totalPaid: amountRaw,
    currency: data.currency,
    receiptNumber,
    paymentNumber: data.referenceNumber.slice(0, 10).toUpperCase(),
    transferDate: dateFormatted,
    destinationCountry: data.destinationCountry,
    bankName: data.bankName,
    beneficiaryName: data.beneficiaryName,
    accountNumber: maskAccount(data.beneficiaryAccountNumber),
    swiftCode: data.swiftCode,
    transferAmount: amountRaw,
    transferFee: feeRaw,
    supportPhone: process.env.SUPPORT_PHONE || '+1 (302) 290-6516',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@apexbank.com',
    currentYear: year,
    receiptPdfUrl: '#',
  };

  try {
    await sendEmail({
      to: data.senderEmail,
      subject: `Wire transfer sent: ${amountFormatted} to ${data.beneficiaryName}`,
      html: generateReceiptHtml({ ...htmlData, isSender: true }),
    });

    if (data.recipientEmail) {
      await sendEmail({
        to: data.recipientEmail,
        subject: `Wire transfer received: ${amountFormatted} from ${data.senderName}`,
        html: generateReceiptHtml({ ...htmlData, isSender: false }),
      });
    }

    console.log(`Wire receipt emails sent to sender ${data.senderEmail}${data.recipientEmail ? ` and recipient ${data.recipientEmail}` : ''}`);
  } catch (err) {
    console.error('Failed to send wire receipt email(s):', err);
  }
}

export async function sendTransferReceipt(transfer: {
  id: string;
  referenceNumber: string;
  amount: number;
  currency: string;
  description: string | null;
  completedAt: Date;
  senderAccountId: string | null;
  recipientAccountId: string | null;
  sender: { firstName: string; lastName: string; email: string };
  recipient: { firstName: string; lastName: string; email: string };
}) {
  const smtpConfigured = !!process.env.SMTP_HOST;
  const sendgridConfigured = !!process.env.SENDGRID_API_KEY;

  if (!smtpConfigured && !sendgridConfigured) {
    console.log('No email transport configured — skipping receipt email');
    console.log('Would send receipt to:', transfer.recipient.email);
    return;
  }

  const senderName = `${transfer.sender.firstName} ${transfer.sender.lastName}`;
  const recipientName = `${transfer.recipient.firstName} ${transfer.recipient.lastName}`;

  let senderAccountNumber: string | undefined;
  let recipientAccountNumber: string | undefined;

  if (transfer.senderAccountId) {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const senderAcc = await prisma.account.findUnique({ where: { id: transfer.senderAccountId } });
      if (senderAcc) senderAccountNumber = senderAcc.accountNumber;
      const recipientAcc = await prisma.account.findUnique({ where: { id: transfer.recipientAccountId } });
      if (recipientAcc) recipientAccountNumber = recipientAcc.accountNumber;
    } finally {
      await prisma.$disconnect();
    }
  }

  const amountFormatted = formatCurrency(transfer.amount, transfer.currency);
  const amountRaw = transfer.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const dateFormatted = formatDate(transfer.completedAt);
  const receiptNumber = generateReceiptNumber();
  const year = new Date().getFullYear();
  const feeFormatted = '0.00';

  const baseData = {
    logoUrl: process.env.LOGO_URL || 'https://yourdomain.com/logo.png',
    totalPaid: amountRaw,
    currency: transfer.currency,
    receiptNumber,
    paymentNumber: transfer.id.slice(0, 10).toUpperCase(),
    transferDate: dateFormatted,
    destinationCountry: 'International',
    bankName: 'International Bank Transfer',
    beneficiaryName: recipientName,
    accountNumber: maskAccount(recipientAccountNumber),
    swiftCode: 'INTL-US-XXX',
    transferAmount: amountRaw,
    transferFee: feeFormatted,
    supportPhone: process.env.SUPPORT_PHONE || '+1 (302) 290-6516',
    supportEmail: process.env.SUPPORT_EMAIL || 'support@apexbank.com',
    currentYear: year,
    receiptPdfUrl: '#',
  };

  const [recipientHtml, senderHtml] = [
    { ...baseData, isSender: false },
    { ...baseData, isSender: true },
  ].map(d => generateReceiptHtml(d));

  try {
    await sendEmail({
      to: transfer.recipient.email,
      subject: `Payment received: ${amountFormatted} from ${senderName}`,
      html: recipientHtml,
    });

    await sendEmail({
      to: transfer.sender.email,
      subject: `Payment sent: ${amountFormatted} to ${recipientName}`,
      html: senderHtml,
    });

    console.log(`Receipt emails sent to ${transfer.sender.email} and ${transfer.recipient.email}`);
  } catch (err) {
    console.error('Failed to send receipt email(s):', err);
    throw err;
  }
}
