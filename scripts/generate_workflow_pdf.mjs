import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'pt',
  format: 'a4',
});

const pageWidth = doc.internal.pageSize.getWidth(); // 595.28 pt
const pageHeight = doc.internal.pageSize.getHeight(); // 841.89 pt
const margin = 40;
const contentWidth = pageWidth - margin * 2; // 515.28 pt

// Color Palette
const colors = {
  primary: [30, 41, 59],       // slate-800
  primaryDark: [15, 23, 42],   // slate-900
  accent: [79, 70, 229],       // indigo-600
  accentLight: [238, 242, 255],// indigo-50
  emerald: [5, 150, 105],      // emerald-600
  emeraldBg: [236, 253, 245],  // emerald-50
  amber: [217, 119, 6],        // amber-600
  amberBg: [254, 243, 199],    // amber-100
  violet: [124, 58, 237],      // violet-600
  violetBg: [245, 243, 255],   // violet-50
  textDark: [15, 23, 42],
  textMuted: [100, 116, 139],  // slate-500
  cardBg: [248, 250, 252],     // slate-50
  border: [226, 232, 240],     // slate-200
  white: [255, 255, 255]
};

let currentY = margin;

function checkPageBreak(neededHeight) {
  if (currentY + neededHeight > pageHeight - margin - 30) {
    doc.addPage();
    currentY = margin + 20;
    renderHeaderSmall();
  }
}

function renderHeaderSmall() {
  doc.setFillColor(...colors.primaryDark);
  doc.rect(0, 0, pageWidth, 28, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('PERFORMANCE & APPRAISAL SYSTEM | SYSTEM WORKFLOW SPECIFICATION', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('CONFIDENTIAL & PROPRIETARY', pageWidth - margin - 130, 18);
  
  currentY = margin + 15;
}

// ==========================================
// PAGE 1: TITLE & EXECUTIVE SUMMARY
// ==========================================

// Header Banner
doc.setFillColor(...colors.primaryDark);
doc.rect(0, 0, pageWidth, 110, 'F');

// Top Accent Line
doc.setFillColor(...colors.accent);
doc.rect(0, 0, pageWidth, 5, 'F');

// Brand pill
doc.setFillColor(255, 255, 255, 0.12);
doc.roundedRect(margin, 20, 95, 18, 4, 4, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(199, 210, 254);
doc.text('ENTERPRISE EDITION', margin + 8, 32);

// Title
doc.setFont('helvetica', 'bold');
doc.setFontSize(20);
doc.setTextColor(255, 255, 255);
doc.text('Application Workflow & Architecture', margin, 62);

// Subtitle
doc.setFont('helvetica', 'normal');
doc.setFontSize(10.5);
doc.setTextColor(203, 213, 225);
doc.text('Continuous 4-Quarter Reviews, 8-Cycle Staggered Cohorts & Bell-Curve Calibration', margin, 82);

currentY = 130;

// What The Application Does - Summary Box
doc.setFillColor(...colors.accentLight);
doc.setDrawColor(...colors.accent);
doc.setLineWidth(1);

const summaryText = 'The Performance & Appraisal Management System is an all-in-one enterprise platform that automates the end-to-end employee performance lifecycle—from role-based KRA goal setting and continuous 4-quarter reviews to annual salary increments and promotions. By distributing employees across 8 staggered review cohorts (Cycles A-H), it replaces stressful year-end evaluations with year-round objectivity, facilitates multi-tier approvals (Employee > Manager > HOD > HR), uses Gemini AI to synthesize peer feedback, applies bell-curve salary calibrations, and automatically generates official appraisal letters with revised CTC breakdowns.';

const splitSummary = doc.splitTextToSize(summaryText, contentWidth - 24);
const boxHeight = splitSummary.length * 11 + 28;
doc.roundedRect(margin, currentY, contentWidth, boxHeight, 6, 6, 'FD');

doc.setFont('helvetica', 'bold');
doc.setFontSize(9.5);
doc.setTextColor(...colors.accent);
doc.text('WHAT THE APPLICATION DOES (SYSTEM SUMMARY)', margin + 12, currentY + 16);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(...colors.textDark);
doc.text(splitSummary, margin + 12, currentY + 30);

currentY += boxHeight + 16;

// SECTION: 4-PHASE WORKFLOW MAP
doc.setFont('helvetica', 'bold');
doc.setFontSize(13);
doc.setTextColor(...colors.primaryDark);
doc.text('High-Level Workflow Lifecycle', margin, currentY);
currentY += 16;

const phases = [
  {
    num: '01',
    title: 'Setup & Masters',
    tag: 'HR / Admin',
    desc: 'Departments, Roles, 8 Cohort Cycles, KRA Templates, and Hierarchy-Linked Bulk Employee Onboarding.',
    color: colors.accent,
    bg: colors.accentLight
  },
  {
    num: '02',
    title: 'Quarterly Reviews',
    tag: 'Q1 - Q4 Loops',
    desc: 'Self-Reviews, Manager Ratings, HOD Moderation, 360 Peer Feedback, and Gemini AI Performance Insights.',
    color: colors.emerald,
    bg: colors.emeraldBg
  },
  {
    num: '03',
    title: 'Annual Calibration',
    tag: 'HR & Committee',
    desc: 'Score rollup, Bell-Curve Normalization, Salary Increment planning, CTC calculations, and Sign-offs.',
    color: colors.violet,
    bg: colors.violetBg
  },
  {
    num: '04',
    title: 'Release & Compliance',
    tag: 'ESS & Audit',
    desc: 'Automated Appraisal Letter generation, PDF download in My Space, Tamper-Evident Logs, and Analytics.',
    color: colors.amber,
    bg: colors.amberBg
  }
];

const boxWidth = (contentWidth - 24) / 4;
phases.forEach((p, idx) => {
  const x = margin + idx * (boxWidth + 8);
  doc.setFillColor(...p.bg);
  doc.setDrawColor(...p.color);
  doc.setLineWidth(0.8);
  doc.roundedRect(x, currentY, boxWidth, 100, 5, 5, 'FD');

  // Phase Number
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...p.color);
  doc.text(p.num, x + 10, currentY + 20);

  // Tag
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.textMuted);
  doc.text(p.tag, x + 34, currentY + 18);

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...colors.primaryDark);
  doc.text(p.title, x + 10, currentY + 38);

  // Description
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...colors.textDark);
  const pDesc = doc.splitTextToSize(p.desc, boxWidth - 18);
  doc.text(pDesc, x + 10, currentY + 52);
});

currentY += 120;

// DETAILED PHASE BREAKDOWNS
function renderPhaseDetail(phaseNumber, title, role, items, accentColor) {
  checkPageBreak(120);

  // Header pill
  doc.setFillColor(...accentColor);
  doc.roundedRect(margin, currentY, 26, 18, 4, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(phaseNumber, margin + 7, currentY + 13);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...colors.primaryDark);
  doc.text(title, margin + 34, currentY + 13);

  // Role pill
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...colors.textMuted);
  doc.text(`Primary Actors: ${role}`, pageWidth - margin - doc.getTextWidth(`Primary Actors: ${role}`), currentY + 13);

  currentY += 24;

  // Items container
  doc.setFillColor(...colors.cardBg);
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.6);
  
  const initialY = currentY;
  let textY = currentY + 14;

  items.forEach((item) => {
    // Bullet
    doc.setFillColor(...accentColor);
    doc.circle(margin + 14, textY - 3, 2.5, 'F');

    // Title & desc
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...colors.primaryDark);
    doc.text(item.name + ': ', margin + 24, textY);

    const titleWidth = doc.getTextWidth(item.name + ': ');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.textDark);

    const descLines = doc.splitTextToSize(item.desc, contentWidth - 36 - titleWidth);
    doc.text(descLines[0], margin + 24 + titleWidth, textY);

    if (descLines.length > 1) {
      for (let i = 1; i < descLines.length; i++) {
        textY += 12;
        doc.text(descLines[i], margin + 24, textY);
      }
    }
    textY += 14;
  });

  const cardHeight = textY - initialY;
  doc.roundedRect(margin, initialY, contentWidth, cardHeight, 6, 6, 'S');
  currentY = textY + 12;
}

renderPhaseDetail('P1', 'Phase 1: Master Setup & Employee Hierarchy', 'HR Manager & Super Admin', [
  { name: 'Organization Structure', desc: 'Define departments, designations, salary bands, and hierarchy levels.' },
  { name: '8-Cycle Staggered Cohorts', desc: 'Employees are assigned across Cycles A to H so reviews are distributed smoothly across quarters.' },
  { name: 'KRA & Goal Library', desc: 'Create role-specific Key Result Areas with defined weightages (summing to 100%) and scoring rubrics.' },
  { name: 'Bulk Import & Auto-Hierarchy', desc: 'Import Excel files with employee codes; the system automatically binds reporting managers and HODs.' }
], colors.accent);

renderPhaseDetail('P2', 'Phase 2: Continuous 4-Quarter Review Cycle', 'Employee, Manager, HOD & AI', [
  { name: 'Step 1 - Self Evaluation', desc: 'Employees rate their achievements against assigned KRAs and provide reflection notes.' },
  { name: 'Step 2 - Manager Scoring', desc: 'Direct reporting manager scores employee performance and provides constructive coaching feedback.' },
  { name: 'Step 3 - HOD Moderation', desc: 'Department Head calibrates ratings across teams to prevent manager grading skew.' },
  { name: 'Gemini AI & 360 Feedback', desc: 'Generates objective performance summaries and tracks peer recognition kudos.' }
], colors.emerald);

renderPhaseDetail('P3', 'Phase 3: Annual Appraisal, Normalization & Increments', 'HR Leadership & HOD', [
  { name: 'Score Rollup', desc: 'System automatically aggregates Q1-Q4 scores into an annualized composite rating.' },
  { name: 'Bell-Curve Normalization', desc: 'Enforces distribution guidelines (e.g., Top 15%, Exceeds 30%, Meets 45%, Improvement 10%).' },
  { name: 'Compensation Revision', desc: 'Propose % increment, calculate revised CTC, apply promotion designations, and compute bonuses.' },
  { name: 'Multi-Tier Approvals', desc: 'Sequential sign-offs by Manager, HOD, and HR Director with audit verification.' }
], colors.violet);

renderPhaseDetail('P4', 'Phase 4: Closure, Appraisal Letters & Compliance', 'Employee & HR Operations', [
  { name: 'Appraisal Letters', desc: 'Automatic generation of branded letters detailing revised CTC, effective date, and sign-offs.' },
  { name: 'Employee Self-Service (ESS)', desc: 'Employees view final ratings, access growth roadmaps, and download appraisal PDFs.' },
  { name: 'Compliance & Audit Trail', desc: 'Immutable logging of all rating modifications, salary adjustments, and approval actions.' },
  { name: 'Executive Dashboards', desc: 'Real-time attrition risk indicators, department averages, and historical analytics.' }
], colors.amber);

// ==========================================
// ROLE & PERMISSIONS MATRIX TABLE
// ==========================================
checkPageBreak(160);

doc.setFont('helvetica', 'bold');
doc.setFontSize(13);
doc.setTextColor(...colors.primaryDark);
doc.text('Role & Access Matrix', margin, currentY);
currentY += 14;

const tableCols = [
  { header: 'Role', width: 90 },
  { header: 'Primary Responsibilities', width: 235 },
  { header: 'Key Permissions in Workflow', width: 190 }
];

// Table Header
doc.setFillColor(...colors.primaryDark);
doc.rect(margin, currentY, contentWidth, 20, 'F');
doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(255, 255, 255);

let colX = margin + 8;
tableCols.forEach(col => {
  doc.text(col.header, colX, currentY + 13);
  colX += col.width;
});
currentY += 20;

const rolesData = [
  {
    role: 'Employee',
    resp: 'Complete quarterly self-reviews, track personal goals, give 360 kudos.',
    perms: 'View personal KRAs, submit self-rating, download appraisal letter.'
  },
  {
    role: 'Manager',
    resp: 'Evaluate direct reports, review goals, provide quarterly scores & feedback.',
    perms: 'Score team members, request revisions, recommend increments.'
  },
  {
    role: 'HOD',
    resp: 'Department-wide calibration, approve manager ratings, oversee promotions.',
    perms: 'Moderate scores, approve department increments, sign off appraisals.'
  },
  {
    role: 'HR Manager',
    resp: 'Manage cohorts, run normalization, execute salary hikes, publish letters.',
    perms: 'Bulk uploads, bell-curve tuning, master data setup, letter issuance.'
  },
  {
    role: 'Super Admin',
    resp: 'System configuration, role assignments, security, compliance oversight.',
    perms: 'Full administrative access, audit trail logs, schema/cycle overrides.'
  }
];

rolesData.forEach((row, rIdx) => {
  const isEven = rIdx % 2 === 0;
  doc.setFillColor(...(isEven ? colors.cardBg : colors.white));
  doc.rect(margin, currentY, contentWidth, 22, 'F');
  
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY + 22, margin + contentWidth, currentY + 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...colors.primaryDark);
  doc.text(row.role, margin + 8, currentY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.8);
  doc.setTextColor(...colors.textDark);
  doc.text(row.resp, margin + 8 + tableCols[0].width, currentY + 14);
  doc.text(row.perms, margin + 8 + tableCols[0].width + tableCols[1].width, currentY + 14);

  currentY += 22;
});

currentY += 15;

// KEY SYSTEM ADVANTAGES BOX
checkPageBreak(85);
doc.setFillColor(...colors.cardBg);
doc.setDrawColor(...colors.border);
doc.roundedRect(margin, currentY, contentWidth, 68, 6, 6, 'FD');

doc.setFont('helvetica', 'bold');
doc.setFontSize(9.5);
doc.setTextColor(...colors.accent);
doc.text('Key Technical & Operational Highlights', margin + 12, currentY + 16);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(...colors.textDark);
const highlights = [
  '• 8-Cycle Staggered System: Prevents HR and manager burnout by distributing evaluations throughout the year.',
  '• Auto-Linked Hierarchy: Bulk Excel imports automatically cross-reference employee codes to link managers and HODs.',
  '• Built-in Gemini AI: Synthesizes quarterly feedback to eliminate recency bias and accelerate review drafting.',
  '• Audit Trail: Every rating adjustment and salary edit is permanently logged with timestamps and actor IDs.'
];
let hY = currentY + 28;
highlights.forEach(h => {
  doc.text(h, margin + 12, hY);
  hY += 10;
});

// ==========================================
// FOOTERS ON ALL PAGES
// ==========================================
const totalPages = doc.internal.getNumberOfPages();
for (let p = 1; p <= totalPages; p++) {
  doc.setPage(p);

  // Footer Line
  doc.setDrawColor(...colors.border);
  doc.setLineWidth(0.6);
  doc.line(margin, pageHeight - 32, pageWidth - margin, pageHeight - 32);

  // Footer text
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...colors.textMuted);
  doc.text('Performance & Appraisal Management System — Operational Workflow Guide', margin, pageHeight - 18);
  doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin - 50, pageHeight - 18);
}

// Write PDF to root folder
const outputPath = path.resolve('..', 'Performance_Appraisal_System_Workflow.pdf');
const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
fs.writeFileSync(outputPath, pdfBuffer);

console.log(`Successfully generated PDF at: ${outputPath} (${pdfBuffer.length} bytes, ${totalPages} pages)`);
