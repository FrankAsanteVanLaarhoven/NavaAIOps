'use client';

export interface ExportData {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  metadata?: Record<string, string>;
}

export async function exportToPDF(data: ExportData): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('PDF export is only available in the browser');
  }
  
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text(data.title, 14, 20);
  
  // Add metadata if provided
  if (data.metadata) {
    let yPos = 30;
    doc.setFontSize(10);
    Object.entries(data.metadata).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 14, yPos);
      yPos += 7;
    });
    yPos += 5;
  } else {
    doc.setFontSize(10);
  }
  
  // Add table
  autoTable(doc, {
    head: [data.headers],
    body: data.rows,
    startY: data.metadata ? 30 + (Object.keys(data.metadata).length * 7) + 10 : 30,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [99, 102, 241] },
  });
  
  // Save PDF
  doc.save(`${data.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportToCSV(data: ExportData): void {
  // Create CSV content
  const csvRows: string[] = [];
  
  // Add metadata as comments
  if (data.metadata) {
    Object.entries(data.metadata).forEach(([key, value]) => {
      csvRows.push(`# ${key}: ${value}`);
    });
    csvRows.push('');
  }
  
  // Add headers
  csvRows.push(data.headers.join(','));
  
  // Add rows
  data.rows.forEach(row => {
    csvRows.push(row.map(cell => {
      // Escape commas and quotes
      const cellStr = String(cell);
      if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
        return `"${cellStr.replace(/"/g, '""')}"`;
      }
      return cellStr;
    }).join(','));
  });
  
  // Create blob and download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${data.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export function exportToJSON(data: ExportData): void {
  const jsonData = {
    title: data.title,
    metadata: data.metadata || {},
    headers: data.headers,
    rows: data.rows,
    exportedAt: new Date().toISOString(),
  };
  
  const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${data.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
