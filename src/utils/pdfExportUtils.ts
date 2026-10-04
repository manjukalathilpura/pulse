/**
 * PDF Document Export Engine for FieldPulse
 * Generates formatted PDF documents for Employee Attendance and Payroll data.
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AttendanceRecord, PayrollRecord, StaffMember } from '../types';

export interface AttendancePdfFilter {
  startDate?: string;
  endDate?: string;
  staffId?: string;
  status?: string;
}

export interface PayrollPdfFilter {
  month?: string;
  year?: number;
  staffId?: string;
  status?: string;
}

/**
 * Generate and download formatted Attendance Report PDF
 */
export function exportAttendancePdf(
  records: AttendanceRecord[],
  staffList: StaffMember[],
  filters?: AttendancePdfFilter
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Filter records
  let filtered = [...records];
  if (filters?.staffId && filters.staffId !== 'all') {
    filtered = filtered.filter((r) => r.staffId === filters.staffId);
  }
  if (filters?.startDate) {
    filtered = filtered.filter((r) => r.date >= filters.startDate!);
  }
  if (filters?.endDate) {
    filtered = filtered.filter((r) => r.date <= filters.endDate!);
  }

  const selectedStaff = filters?.staffId && filters.staffId !== 'all'
    ? staffList.find((s) => s.id === filters.staffId)?.name
    : 'All Workforce Staff';

  // Header Banner
  doc.setFillColor(15, 23, 42); // Midnight slate #0f172a
  doc.rect(0, 0, 297, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('FIELDPULSE OPERATIONS', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text('Secure Mobile Workforce Management · Official Attendance Audit', 14, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`CONFIDENTIAL · Generated: ${dateStr} ${timeStr}`, 283, 15, { align: 'right' });

  // Report Meta Section
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Workforce Attendance & Location Tracking Report', 14, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Personnel Filter: ${selectedStaff}  |  Total Shift Logs: ${filtered.length} entries`, 14, 40);

  // Summary Metrics Bar
  const verifiedCount = filtered.filter((r) => r.geofenceVerified).length;
  const verifiedPercent = filtered.length > 0 ? Math.round((verifiedCount / filtered.length) * 100) : 0;
  const totalHours = filtered.reduce((acc, curr) => acc + (curr.totalHoursWorked || 8), 0);
  const onTimeCount = filtered.filter((r) => r.status === 'present').length;

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 44, 269, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL HOURS LOGGED:', 20, 52);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalHours.toFixed(1)} hrs`, 57, 52);

  doc.setTextColor(71, 85, 105);
  doc.text('GEOFENCE VERIFIED:', 95, 52);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(`${verifiedCount} / ${filtered.length} (${verifiedPercent}%)`, 133, 52);

  doc.setTextColor(71, 85, 105);
  doc.text('ON-TIME PRESENT RATE:', 185, 52);
  doc.setTextColor(37, 99, 235); // Blue
  doc.text(`${onTimeCount} shifts`, 228, 52);

  // Table Data Preparation
  const tableRows = filtered.map((r, index) => {
    const checkInFormatted = r.checkInTime
      ? new Date(r.checkInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : '--';
    const checkOutFormatted = r.checkOutTime
      ? new Date(r.checkOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : 'In Progress';
    const hours = r.totalHoursWorked ? `${r.totalHoursWorked.toFixed(1)} h` : '8.0 h';
    const geoStatus = r.geofenceVerified ? 'Verified (Within 250m)' : 'Outside Radius';
    const coords = `${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}`;

    return [
      String(index + 1),
      r.staffName,
      r.date,
      checkInFormatted,
      checkOutFormatted,
      hours,
      r.status.toUpperCase(),
      `${r.locationName}\n(${coords})`,
      geoStatus,
    ];
  });

  // Render Table
  autoTable(doc, {
    startY: 63,
    head: [
      [
        '#',
        'Staff Member',
        'Date',
        'Check-In',
        'Check-Out',
        'Hours',
        'Status',
        'Site / GPS Coordinates',
        'Geofence Audit',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 20 },
      3: { cellWidth: 18 },
      4: { cellWidth: 20 },
      5: { cellWidth: 15, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 20 },
      7: { cellWidth: 80 },
      8: { cellWidth: 40 },
    },
    didParseCell: (data) => {
      // Highlight status column
      if (data.section === 'body' && data.column.index === 6) {
        const text = String(data.cell.raw);
        if (text === 'PRESENT') {
          data.cell.styles.textColor = [5, 150, 105]; // Emerald
        } else if (text === 'LATE') {
          data.cell.styles.textColor = [217, 119, 6]; // Amber
        }
      }
      // Highlight geofence verification
      if (data.section === 'body' && data.column.index === 8) {
        const text = String(data.cell.raw);
        if (text.includes('Verified')) {
          data.cell.styles.textColor = [5, 150, 105];
        } else {
          data.cell.styles.textColor = [220, 38, 38];
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Footer & Signature Block
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 180;
  const signatureY = Math.min(finalY + 12, 185);

  if (signatureY < 195) {
    doc.setDrawColor(203, 213, 225);
    doc.line(14, signatureY, 80, signatureY);
    doc.line(210, signatureY, 280, signatureY);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Prepared by: Operations Supervisor', 14, signatureY + 4);
    doc.text('Authorized by: HR & Compliance Officer', 210, signatureY + 4);
  }

  // Page numbering on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `FieldPulse Cloud Mobile Reporting · Page ${i} of ${pageCount}`,
      297 / 2,
      205,
      { align: 'center' }
    );
  }

  doc.save(`Attendance_Report_${now.toISOString().split('T')[0]}.pdf`);
}

/**
 * Generate and download formatted Payroll & Compensation Report PDF
 */
export function exportPayrollPdf(
  records: PayrollRecord[],
  staffList: StaffMember[],
  filters?: PayrollPdfFilter
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  // Filter records
  let filtered = [...records];
  if (filters?.staffId && filters.staffId !== 'all') {
    filtered = filtered.filter((r) => r.staffId === filters.staffId);
  }
  if (filters?.month && filters.month !== 'all') {
    filtered = filtered.filter((r) => r.month === filters.month);
  }

  const periodLabel = filtered[0]?.month || 'September 2026';

  // Header Banner
  doc.setFillColor(15, 23, 42); // Midnight slate #0f172a
  doc.rect(0, 0, 297, 24, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('FIELDPULSE OPERATIONS', 14, 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Secure Mobile Workforce Management · Official Payroll & Compensation Ledger', 14, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`CONFIDENTIAL · Generated: ${dateStr} ${timeStr}`, 283, 15, { align: 'right' });

  // Title Section
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`Workforce Payroll & Wage Ledger (${periodLabel})`, 14, 34);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text('Automated salary calculations based on verified GPS attendance, overtime tiers, and statutory deductions.', 14, 40);

  // Financial Summary Cards
  const totalGross = filtered.reduce((acc, curr) => acc + curr.grossSalary, 0);
  const totalNet = filtered.reduce((acc, curr) => acc + curr.netSalary, 0);
  const totalOvertimePay = filtered.reduce((acc, curr) => acc + curr.overtimePay, 0);
  const totalDeductions = filtered.reduce(
    (acc, curr) => acc + curr.deductions.tax + curr.deductions.pf + curr.deductions.other,
    0
  );

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 44, 269, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL GROSS WAGES:', 20, 52);
  doc.setTextColor(15, 23, 42);
  doc.text(`$${totalGross.toLocaleString()}`, 60, 52);

  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL OVERTIME PAY:', 95, 52);
  doc.setTextColor(37, 99, 235);
  doc.text(`$${totalOvertimePay.toLocaleString()}`, 137, 52);

  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL DEDUCTIONS:', 170, 52);
  doc.setTextColor(220, 38, 38);
  doc.text(`$${totalDeductions.toLocaleString()}`, 207, 52);

  doc.setTextColor(71, 85, 105);
  doc.text('NET DISBURSEMENTS:', 235, 52);
  doc.setTextColor(5, 150, 105);
  doc.text(`$${totalNet.toLocaleString()}`, 272, 52);

  // Table Data Preparation
  const tableRows = filtered.map((p, index) => {
    const staff = staffList.find((s) => s.id === p.staffId);
    const allowancesTotal = p.allowances.transport + p.allowances.meal;
    const deductionsTotal = p.deductions.tax + p.deductions.pf + p.deductions.other;

    return [
      String(index + 1),
      p.staffName,
      staff?.department || 'Field Ops',
      `$${p.baseSalary.toLocaleString()}`,
      `${p.regularHours}h`,
      `${p.overtimeHours}h ($${p.overtimePay})`,
      `$${allowancesTotal}`,
      `$${deductionsTotal} (Tax/PF)`,
      `$${p.grossSalary.toLocaleString()}`,
      `$${p.netSalary.toLocaleString()}`,
      p.status.toUpperCase(),
    ];
  });

  // Append Grand Totals Row
  tableRows.push([
    '',
    'GRAND TOTALS',
    `${filtered.length} Employees`,
    `$${filtered.reduce((a, c) => a + c.baseSalary, 0).toLocaleString()}`,
    `${filtered.reduce((a, c) => a + c.regularHours, 0)}h`,
    `$${totalOvertimePay.toLocaleString()}`,
    `$${filtered.reduce((a, c) => a + c.allowances.transport + c.allowances.meal, 0).toLocaleString()}`,
    `$${totalDeductions.toLocaleString()}`,
    `$${totalGross.toLocaleString()}`,
    `$${totalNet.toLocaleString()}`,
    'AUDITED',
  ]);

  autoTable(doc, {
    startY: 63,
    head: [
      [
        '#',
        'Staff Member',
        'Department',
        'Base Salary',
        'Reg Hours',
        'Overtime (1.5x)',
        'Allowances',
        'Deductions',
        'Gross Wage',
        'Net Payable',
        'Status',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 2.5,
      textColor: [51, 65, 85],
      valign: 'middle',
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 38, fontStyle: 'bold' },
      2: { cellWidth: 26 },
      3: { cellWidth: 22 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 28 },
      6: { cellWidth: 20 },
      7: { cellWidth: 28 },
      8: { cellWidth: 24, fontStyle: 'bold' },
      9: { cellWidth: 26, fontStyle: 'bold', textColor: [5, 150, 105] },
      10: { cellWidth: 23, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      // Bold grand totals row
      if (data.section === 'body' && data.row.index === tableRows.length - 1) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.textColor = [15, 23, 42];
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Footer & Signature Block
  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 180;
  const signatureY = Math.min(finalY + 14, 185);

  if (signatureY < 195) {
    doc.setDrawColor(203, 213, 225);
    doc.line(14, signatureY, 80, signatureY);
    doc.line(210, signatureY, 280, signatureY);

    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Prepared by: Payroll Officer', 14, signatureY + 4);
    doc.text('Approved by: Finance Director / General Manager', 210, signatureY + 4);
  }

  // Page numbering on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `FieldPulse Cloud Mobile Reporting · Page ${i} of ${pageCount}`,
      297 / 2,
      205,
      { align: 'center' }
    );
  }

  doc.save(`Payroll_Ledger_${periodLabel.replace(/\s+/g, '_')}_${now.toISOString().split('T')[0]}.pdf`);
}
