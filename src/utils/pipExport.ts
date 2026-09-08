import jsPDF from 'jspdf';
import { PipRecord } from '../types';

export function downloadPipDossierPdf(pip: PipRecord): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Outer Border
  doc.setDrawColor(225, 29, 72); // Rose 600
  doc.setLineWidth(1.0);
  doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

  doc.setDrawColor(254, 205, 211); // Rose 200
  doc.setLineWidth(0.4);
  doc.rect(margin + 2, margin + 2, contentWidth - 4, pageHeight - margin * 2 - 4);

  let curY = margin + 10;

  // Header Banner
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(225, 29, 72);
  doc.text('LEGAL COMPLIANCE & TALENT GOVERNANCE DIVISION', pageWidth / 2, curY, { align: 'center' });

  curY += 6;
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('Performance Improvement Plan (PIP) Legal Dossier', pageWidth / 2, curY, { align: 'center' });

  curY += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139); // Slate 500
  const cycleText = pip.cycleNumber && pip.cycleNumber > 1 ? `Cycle ${pip.cycleNumber} (Repeat PIP)` : 'Initial PIP Cycle';
  doc.text(`Official Document ID: ${pip.id} • ${cycleText} • Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, curY, { align: 'center' });

  curY += 8;

  // Employee Credentials Box
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.rect(margin + 4, curY, contentWidth - 8, 24, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  // Row 1
  doc.text(`Employee: ${pip.employeeName} (${pip.employeeCode})`, margin + 8, curY + 6);
  doc.text(`Department: ${pip.department}`, margin + 80, curY + 6);
  doc.text(`Duration: ${pip.durationDays} Days`, margin + 140, curY + 6);

  // Row 2
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Reporting Manager: ${pip.managerName}`, margin + 8, curY + 13);
  doc.text(`Designation: ${pip.designation}`, margin + 80, curY + 13);
  doc.text(`Target Completion: ${pip.targetEndDate}`, margin + 140, curY + 13);

  // Row 3 (Status)
  doc.setFont('helvetica', 'bold');
  const statusLabel = pip.status === 'completed_successfully'
    ? 'PASSED & RESTORED TO ACTIVE STATUS'
    : pip.status === 'escalated_action'
    ? 'SEPARATED (FAILED PIP CRITERIA)'
    : pip.status === 'extended'
    ? 'EXTENDED (+30 DAYS)'
    : 'ACTIVE IN PROGRESS';

  doc.setTextColor(pip.status === 'completed_successfully' ? 4 : 225, pip.status === 'completed_successfully' ? 120 : 29, pip.status === 'completed_successfully' ? 87 : 72);
  doc.text(`Governance Status: ${statusLabel} (${pip.overallProgress}% Completed)`, margin + 8, curY + 20);

  curY += 30;

  // Section: Core Performance Gaps
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('1. Core Performance Gaps & Areas of Concern', margin + 4, curY);

  curY += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);

  if (!pip.coreGaps || pip.coreGaps.length === 0) {
    doc.text('• Operational targets not met during preceding quarterly review cycle.', margin + 8, curY);
    curY += 5;
  } else {
    pip.coreGaps.forEach((gap) => {
      doc.text(`• ${gap}`, margin + 8, curY);
      curY += 5;
    });
  }

  curY += 4;

  // Section: SMART Milestones
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('2. Structured Coaching Milestones & Success Criteria', margin + 4, curY);

  curY += 5;
  (pip.milestones || []).forEach((m, idx) => {
    doc.setFillColor(m.status === 'met' ? 240 : 255, m.status === 'met' ? 253 : 251, m.status === 'met' ? 244 : 235); // Emerald 50 vs Amber 50
    doc.rect(margin + 4, curY, contentWidth - 8, 11, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${idx + 1}. ${m.title} [Target Due: ${m.dueDate}]`, margin + 6, curY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Target: ${m.targetMetric} | Verification: ${m.notes || 'Under review'}`, margin + 6, curY + 8.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(m.status === 'met' ? 4 : 180, m.status === 'met' ? 120 : 83, m.status === 'met' ? 87 : 9);
    doc.text(m.status.toUpperCase(), margin + contentWidth - 25, curY + 6);

    curY += 13;
  });

  curY += 2;

  // Section: Bi-Weekly Check-in Logs
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('3. Bi-Weekly Manager Check-in Logs & Coaching History', margin + 4, curY);

  curY += 5;
  if (!pip.checkins || pip.checkins.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No bi-weekly check-ins recorded yet.', margin + 8, curY);
    curY += 8;
  } else {
    pip.checkins.forEach((chk) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`Week ${chk.weekNumber} (${chk.date}) — Coaching Rating: ${chk.ratingOutOf5}/5.00`, margin + 8, curY);

      curY += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(`Manager Notes: ${chk.managerNotes}`, margin + 12, curY);

      if (chk.actionItems) {
        curY += 4;
        doc.text(`Action Items: ${chk.actionItems}`, margin + 12, curY);
      }
      curY += 6;
    });
  }

  // Section: Legal Signatures & Digital Audit Stamps
  curY = Math.max(curY + 4, pageHeight - margin - 35);
  doc.setDrawColor(203, 213, 225);
  doc.line(margin + 4, curY, margin + contentWidth - 4, curY);
  curY += 5;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('4. Tri-Party Governance Signatures & Digital Audit Stamps', margin + 4, curY);

  curY += 6;
  const colW = (contentWidth - 8) / 3;

  // Manager Signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Reporting Manager Sign-off', margin + 4, curY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const mgrSign = pip.signatures?.managerSign;
  doc.text(mgrSign ? `Signed: ${mgrSign.signedBy}` : `Manager: ${pip.managerName}`, margin + 4, curY + 4);
  doc.text(mgrSign ? `Timestamp: ${new Date(mgrSign.signedAt).toLocaleDateString()}` : 'Status: Formal Plan Initiated', margin + 4, curY + 8);

  // HR Signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('HR Compliance Sign-off', margin + 4 + colW, curY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const hrSign = pip.signatures?.hrSign;
  doc.text(hrSign ? `Signed: ${hrSign.signedBy}` : 'HR Compliance Division', margin + 4 + colW, curY + 4);
  doc.text(hrSign ? `Timestamp: ${new Date(hrSign.signedAt).toLocaleDateString()}` : 'Status: Approved for Governance', margin + 4 + colW, curY + 8);

  // Employee Acknowledgment
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Employee Acknowledgment', margin + 4 + colW * 2, curY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const empAck = pip.signatures?.employeeAck;
  doc.text(empAck ? `Acknowledged: ${empAck.signedBy}` : 'Pending Digital Ack', margin + 4 + colW * 2, curY + 4);
  doc.text(empAck ? `Timestamp: ${new Date(empAck.signedAt).toLocaleDateString()}` : 'Mandatory employee sign-off', margin + 4 + colW * 2, curY + 8);

  // Save the PDF
  const filename = `PIP_Legal_Dossier_${pip.employeeCode}_${pip.startDate}.pdf`;
  doc.save(filename);
}
