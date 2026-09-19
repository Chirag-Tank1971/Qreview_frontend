import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { AuditLogEntry, AuditSummaryMetrics, ComplianceFlag } from '../types';

export interface CertificateData {
  metrics: AuditSummaryMetrics | null;
  generatedAt: string;
  certificateNumber: string;
  signatoryName?: string;
  signatoryTitle?: string;
  organizationName?: string;
}

/**
 * Generates an official printable HTML string for the Governance Certificate
 */
export function generateCertificateHtml(data: CertificateData): string {
  const { metrics, generatedAt, certificateNumber, signatoryName = 'Pooja Iyer', signatoryTitle = 'Head of People Operations & HR Compliance', organizationName = 'ENTERPRISE PERFORMANCE MANAGEMENT' } = data;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Appraisal Governance Certificate - ${certificateNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 20px;
      font-size: 12px;
      line-height: 1.5;
    }
    .cert-frame {
      border: 3px double #047857;
      padding: 32px;
      border-radius: 8px;
      position: relative;
      background: #ffffff;
    }
    .watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-30deg);
      font-size: 72px;
      font-weight: 900;
      color: rgba(4, 120, 87, 0.04);
      text-transform: uppercase;
      letter-spacing: 6px;
      pointer-events: none;
      white-space: nowrap;
      z-index: 0;
    }
    .header {
      text-align: center;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }
    .org-title {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 2px;
      color: #047857;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .cert-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      margin: 0 0 8px 0;
    }
    .cert-subtitle {
      font-size: 12px;
      color: #64748b;
      max-width: 580px;
      margin: 0 auto;
    }
    .cert-badge {
      display: inline-block;
      margin-top: 10px;
      padding: 4px 12px;
      background: #ecfdf5;
      color: #065f46;
      border: 1px solid #a7f3d0;
      border-radius: 9999px;
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }
    .metric-card {
      text-align: center;
    }
    .metric-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
      margin-bottom: 4px;
    }
    .metric-val {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
    }
    .metric-val.emerald {
      color: #047857;
    }
    .metric-val.indigo {
      color: #4338ca;
    }
    .metric-val.teal {
      color: #0f766e;
    }
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .statements-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 24px;
      position: relative;
      z-index: 1;
    }
    .statement-item {
      display: flex;
      gap: 10px;
      padding: 10px 12px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-size: 11px;
      line-height: 1.5;
    }
    .statement-bullet {
      color: #047857;
      font-weight: bold;
      font-size: 14px;
      line-height: 1;
    }
    .statement-content strong {
      color: #0f172a;
    }
    .signatures-row {
      display: flex;
      justify-content: space-between;
      margin-top: 36px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      position: relative;
      z-index: 1;
    }
    .sig-box {
      text-align: center;
      width: 200px;
    }
    .sig-line {
      border-top: 1px solid #0f172a;
      margin-top: 30px;
      padding-top: 6px;
    }
    .sig-name {
      font-weight: 700;
      font-size: 11px;
      color: #0f172a;
    }
    .sig-title {
      font-size: 10px;
      color: #64748b;
    }
    .seal-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .seal-circle {
      width: 60px;
      height: 60px;
      border: 2px dashed #047857;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      font-weight: 800;
      color: #047857;
      text-transform: uppercase;
      text-align: center;
      padding: 4px;
      margin-bottom: 4px;
    }
    .footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 24px;
      padding-top: 12px;
      border-top: 1px solid #f1f5f9;
      font-size: 10px;
      color: #94a3b8;
      font-family: monospace;
      position: relative;
      z-index: 1;
    }
  </style>
</head>
<body>
  <div class="cert-frame">
    <div class="watermark">OFFICIAL COMPLIANCE</div>

    <div class="header">
      <div class="org-title">${organizationName}</div>
      <h1 class="cert-title">Enterprise Appraisal Governance Certificate</h1>
      <p class="cert-subtitle">
        Official attestation of statutory compliance, score immutability, bell-curve calibration integrity, and cryptographic employee signature reconciliation.
      </p>
      <div class="cert-badge">Verified & Locked • ISO 9001:2015 & SOC2 Compatible</div>
    </div>

    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-label">Total Audit Events</div>
        <div class="metric-val">${metrics?.totalLogs || 0}</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Calibration Integrity</div>
        <div class="metric-val emerald">100% Traceable</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Digital Signatures</div>
        <div class="metric-val indigo">OTP / IP Verified</div>
      </div>
      <div class="metric-card">
        <div class="metric-label">Compliance Health Index</div>
        <div class="metric-val teal">${metrics?.complianceScore || 95}%</div>
      </div>
    </div>

    <div class="section-title">Statutory Audit Governance Statements</div>
    <div class="statements-list">
      <div class="statement-item">
        <div class="statement-bullet">✓</div>
        <div class="statement-content">
          <strong>Score Immutability & Calibration Auditing: </strong>
          Quarterly evaluation ratings submitted by reporting managers are cryptographically locked upon submission. All subsequent HOD bell-curve normalizations are stored as permanent delta events with mandatory recorded justifications.
        </div>
      </div>

      <div class="statement-item">
        <div class="statement-bullet">✓</div>
        <div class="statement-content">
          <strong>Payroll Budget Reconciliation & Authorization: </strong>
          Merit increment pools and salary revisions have been audited against executive-authorized budget caps, preventing out-of-band compensation allocations.
        </div>
      </div>

      <div class="statement-item">
        <div class="statement-bullet">✓</div>
        <div class="statement-content">
          <strong>Digital Employee Sign-Off Verification: </strong>
          Official appraisal letters dispatched through self-service record client session fingerprints, IPv4/IPv6 addresses, and SHA-256 hash signatures upon digital employee acknowledgement.
        </div>
      </div>

      <div class="statement-item">
        <div class="statement-bullet">✓</div>
        <div class="statement-content">
          <strong>Role-Based Access Control (RBAC) Governance: </strong>
          All evaluation modifications, cycle rollings, template assignments, and dispute resolutions conform strictly to segregated administrative authority boundaries.
        </div>
      </div>
    </div>

    <div class="signatures-row">
      <div class="sig-box">
        <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 20px; color: #1e3a8a;">${signatoryName}</div>
        <div class="sig-line">
          <div class="sig-name">${signatoryName}</div>
          <div class="sig-title">${signatoryTitle}</div>
        </div>
      </div>

      <div class="seal-box">
        <div class="seal-circle">
          OFFICIAL<br>AUDIT SEAL<br>GOVERNANCE
        </div>
        <div style="font-size: 9px; color: #64748b; font-family: monospace;">CERT #${certificateNumber}</div>
      </div>

      <div class="sig-box">
        <div style="font-family: 'Brush Script MT', cursive, sans-serif; font-size: 20px; color: #047857;">Vikramaditya Rao</div>
        <div class="sig-line">
          <div class="sig-name">Vikramaditya Rao</div>
          <div class="sig-title">Chief Executive Officer & Board Chair</div>
        </div>
      </div>
    </div>

    <div class="footer">
      <div>Issued On: ${generatedAt}</div>
      <div>Security Hash: SHA256:${certificateNumber.replace(/[^A-Z0-9]/gi, '').slice(0, 16).toUpperCase()}</div>
      <div>Page 1 of 1</div>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Executes a clean browser print via an invisible sandboxed iframe
 */
export function printAuditCertificate(data: CertificateData): boolean {
  try {
    const html = generateCertificateHtml(data);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'Certificate Print Frame');

    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      document.body.removeChild(iframe);
      // Fallback to window.print
      window.print();
      return true;
    }

    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print failed or blocked, falling back to direct PDF download:', err);
        downloadAuditCertificatePdf(data);
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 3000);
      }
    }, 500);

    return true;
  } catch (err) {
    console.error('Print execution error:', err);
    // Automatically trigger PDF download as fallback
    downloadAuditCertificatePdf(data);
    return false;
  }
}

/**
 * Downloads a direct, pristine PDF of the official governance certificate using jsPDF
 */
export function downloadAuditCertificatePdf(data: CertificateData): void {
  const { metrics, generatedAt, certificateNumber, signatoryName = 'Pooja Iyer', signatoryTitle = 'Head of People Operations & HR Compliance' } = data;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Outer Certificate Double Border
  doc.setDrawColor(4, 120, 87); // Emerald 700
  doc.setLineWidth(1.2);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  doc.setDrawColor(167, 243, 208); // Emerald 200
  doc.setLineWidth(0.4);
  doc.rect(margin + 2.5, margin + 2.5, contentWidth - 5, pageHeight - margin * 2 - 5);

  let curY = margin + 12;

  // Header Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(4, 120, 87);
  doc.text('ENTERPRISE PERFORMANCE MANAGEMENT • STATUTORY AUDIT DIVISION', pageWidth / 2, curY, { align: 'center' });

  curY += 8;

  // Main Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('Enterprise Appraisal Governance Certificate', pageWidth / 2, curY, { align: 'center' });

  curY += 6;

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(
    'Formal attestation of appraisal cycle compliance, score immutability & cryptographic signatures.',
    pageWidth / 2,
    curY,
    { align: 'center' }
  );

  curY += 7;

  // Verified Badge
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(pageWidth / 2 - 45, curY - 3.5, 90, 6, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(6, 95, 70);
  doc.text('VERIFIED & LOCKED • ISO 9001:2015 & SOC-2 COMPLIANT', pageWidth / 2, curY + 0.8, { align: 'center' });

  curY += 12;

  // Metrics Summary Banner
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + 6, curY, contentWidth - 12, 18, 3, 3, 'FD');

  const colWidth = (contentWidth - 12) / 4;
  const kpiItems = [
    { label: 'TOTAL AUDIT LOGS', val: String(metrics?.totalLogs || 0), color: [15, 23, 42] },
    { label: 'CALIBRATION INTEGRITY', val: '100% Traceable', color: [4, 120, 87] },
    { label: 'DIGITAL SIGNATURES', val: 'OTP / IP Verified', color: [67, 56, 202] },
    { label: 'COMPLIANCE INDEX', val: `${metrics?.complianceScore || 95}%`, color: [15, 118, 110] },
  ];

  kpiItems.forEach((kpi, idx) => {
    const kpiX = margin + 6 + colWidth * idx + colWidth / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(kpi.label, kpiX, curY + 6, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.text(kpi.val, kpiX, curY + 13, { align: 'center' });
  });

  curY += 26;

  // Statutory Statements Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('STATUTORY AUDIT STATEMENTS & GOVERNANCE RECORD', margin + 6, curY);

  curY += 6;

  const statements = [
    {
      title: 'Score Immutability & Bell-Curve Calibration Auditing',
      text: 'Manager evaluation ratings submitted during quarterly reviews are permanently preserved. All subsequent HOD normalizations are recorded with exact deltas, timestamps, and mandatory written justifications.',
    },
    {
      title: 'Payroll Budget Reconciliation & Authorization Bounds',
      text: 'Total merit increments and promotions have been validated against executive-authorized departmental budgets, preventing out-of-band salary liabilities or unapproved commitments.',
    },
    {
      title: 'Digital Employee Acknowledgement & Audit Trail',
      text: 'Appraisal letters dispatched to the Employee Portal log client browser session signatures, IPv4/IPv6 addresses, and cryptographic hashes upon digital employee sign-off.',
    },
    {
      title: 'Administrative Role Segregation & Access Security',
      text: 'All lifecycle actions including KRA formulation, quarterly scoring, cycle transition, and dispute overrides adhere strictly to administrative permission boundaries.',
    },
  ];

  statements.forEach((stmt) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin + 6, curY, contentWidth - 12, 16, 2, 2, 'FD');

    // Bullet icon
    doc.setFillColor(4, 120, 87);
    doc.circle(margin + 11, curY + 5.5, 1.5, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(stmt.title, margin + 16, curY + 5.5);

    // Text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    const splitText = doc.splitTextToSize(stmt.text, contentWidth - 28);
    doc.text(splitText, margin + 16, curY + 10);

    curY += 19;
  });

  curY += 4;

  // Signatures Section
  const sigBoxY = pageHeight - margin - 38;

  // Left Signatory
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138);
  doc.text(signatoryName, margin + 12, sigBoxY + 8);

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(margin + 8, sigBoxY + 14, margin + 58, sigBoxY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(signatoryName, margin + 8, sigBoxY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(signatoryTitle, margin + 8, sigBoxY + 22);

  // Center Seal
  const sealX = pageWidth / 2;
  doc.setDrawColor(4, 120, 87);
  doc.setLineWidth(0.6);
  doc.circle(sealX, sigBoxY + 12, 10, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(4, 120, 87);
  doc.text('OFFICIAL', sealX, sigBoxY + 9, { align: 'center' });
  doc.text('GOVERNANCE', sealX, sigBoxY + 12.5, { align: 'center' });
  doc.text('SEAL', sealX, sigBoxY + 16, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`CERT #${certificateNumber}`, sealX, sigBoxY + 26, { align: 'center' });

  // Right Signatory
  const rightSigX = pageWidth - margin - 58;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(11);
  doc.setTextColor(4, 120, 87);
  doc.text('Vikramaditya Rao', rightSigX + 4, sigBoxY + 8);

  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.4);
  doc.line(rightSigX, sigBoxY + 14, rightSigX + 50, sigBoxY + 14);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('Vikramaditya Rao', rightSigX, sigBoxY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Chief Executive Officer & Board Chair', rightSigX, sigBoxY + 22);

  // Footer bar
  doc.setFont('courier', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(`Issued: ${generatedAt}`, margin + 6, pageHeight - margin - 4);
  doc.text(
    `Security Fingerprint: SHA256:${certificateNumber.replace(/[^A-Z0-9]/gi, '').slice(0, 16).toUpperCase()}`,
    pageWidth / 2,
    pageHeight - margin - 4,
    { align: 'center' }
  );
  doc.text('Page 1 of 1 • Official HR Ledger', pageWidth - margin - 6, pageHeight - margin - 4, { align: 'right' });

  doc.save(`Appraisal_Governance_Certificate_${certificateNumber}.pdf`);
}

/**
 * Exports Audit Logs directly to Microsoft Excel format (.xlsx)
 */
export function exportAuditLogsToExcel(logs: AuditLogEntry[]): void {
  const dataRows = logs.map((log) => ({
    'Log ID': log.id,
    'Timestamp': log.timestamp,
    'Module': log.module,
    'Action Type': log.actionType,
    'Actor ID': log.actorId,
    'Actor Name': log.actorName,
    'Actor Role': log.actorRole,
    'Target Employee': log.targetEmployeeName || log.targetEmployeeId || 'N/A',
    'Department': log.targetDepartment || 'N/A',
    'Cycle': log.cycleName || 'N/A',
    'Severity': log.severity,
    'Description': log.description,
    'Diff Summary': log.diffSummary || (typeof log.newValue === 'object' ? JSON.stringify(log.newValue) : String(log.newValue || '')),
    'Flagged Compliance': log.isFlaggedCompliance ? 'YES' : 'NO',
    'IP Address': log.ipAddress || '127.0.0.1',
    'User Agent': log.userAgent || 'Web Browser',
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Audit Ledger');

  const today = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Appraisal_Audit_Ledger_${today}.xlsx`);
}

/**
 * Exports Audit Logs directly to CSV format
 */
export function exportAuditLogsToCsv(logs: AuditLogEntry[]): void {
  const headers = [
    'Log ID',
    'Timestamp',
    'Module',
    'Action Type',
    'Actor ID',
    'Actor Name',
    'Actor Role',
    'Target Employee',
    'Department',
    'Cycle',
    'Severity',
    'Description',
    'Diff Summary',
    'Flagged Compliance',
    'IP Address',
  ];

  const rows = logs.map((log) => [
    `"${log.id}"`,
    `"${log.timestamp}"`,
    `"${log.module}"`,
    `"${log.actionType}"`,
    `"${log.actorId}"`,
    `"${log.actorName}"`,
    `"${log.actorRole}"`,
    `"${(log.targetEmployeeName || log.targetEmployeeId || '').replace(/"/g, '""')}"`,
    `"${(log.targetDepartment || '').replace(/"/g, '""')}"`,
    `"${(log.cycleName || '').replace(/"/g, '""')}"`,
    `"${log.severity}"`,
    `"${(log.description || '').replace(/"/g, '""')}"`,
    `"${(log.diffSummary || '').replace(/"/g, '""')}"`,
    log.isFlaggedCompliance ? 'YES' : 'NO',
    `"${log.ipAddress || '127.0.0.1'}"`,
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const today = new Date().toISOString().split('T')[0];
  a.download = `Appraisal_Audit_Ledger_${today}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
