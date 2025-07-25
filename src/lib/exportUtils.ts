import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

export interface ExportData {
  title: string;
  headers: string[];
  data: any[][];
  filename: string;
}

export const exportToPDF = (exportData: ExportData) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(exportData.title, 14, 22);
  
  // Add generation date
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
  
  // Add table
  autoTable(doc, {
    head: [exportData.headers],
    body: exportData.data,
    startY: 40,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });
  
  // Save the PDF
  doc.save(`${exportData.filename}.pdf`);
};

export const exportToExcel = (exportData: ExportData) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Create worksheet data with headers
  const wsData = [exportData.headers, ...exportData.data];
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  const colWidths = exportData.headers.map(() => ({ wch: 15 }));
  ws['!cols'] = colWidths;
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  
  // Save the file
  XLSX.writeFile(wb, `${exportData.filename}.xlsx`);
};

export const exportInventoryReport = async (supabase: any) => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        name,
        sku,
        current_stock,
        minimum_stock,
        unit_price,
        status,
        categories (name),
        suppliers (name)
      `)
      .order('name');

    if (error) throw error;

    const exportData: ExportData = {
      title: 'Inventory Report',
      headers: [
        'Item Name',
        'SKU',
        'Category',
        'Current Stock',
        'Minimum Stock',
        'Unit Price (Le)',
        'Total Value (Le)',
        'Status',
        'Supplier'
      ],
      data: data.map(item => [
        item.name,
        item.sku,
        item.categories?.name || 'Unknown',
        item.current_stock.toString(),
        item.minimum_stock.toString(),
        (item.unit_price / 100).toFixed(2),
        ((item.current_stock * item.unit_price) / 100).toFixed(2),
        item.status,
        item.suppliers?.name || 'Unknown'
      ]),
      filename: `inventory_report_${new Date().toISOString().split('T')[0]}`
    };

    return exportData;
  } catch (error) {
    console.error('Error preparing inventory report:', error);
    throw error;
  }
};

export const exportPurchaseOrdersReport = async (supabase: any) => {
  try {
    const { data, error } = await supabase
      .from('purchase_orders')
      .select(`
        po_number,
        order_date,
        total_amount,
        status,
        expected_delivery,
        suppliers (name),
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const exportData: ExportData = {
      title: 'Purchase Orders Report',
      headers: [
        'PO Number',
        'Supplier',
        'Order Date',
        'Total Amount (Le)',
        'Status',
        'Expected Delivery',
        'Created Date'
      ],
      data: data.map(order => [
        order.po_number,
        order.suppliers?.name || 'Unknown',
        new Date(order.order_date).toLocaleDateString(),
        (order.total_amount / 100).toFixed(2),
        order.status,
        order.expected_delivery ? new Date(order.expected_delivery).toLocaleDateString() : 'Not set',
        new Date(order.created_at).toLocaleDateString()
      ]),
      filename: `purchase_orders_report_${new Date().toISOString().split('T')[0]}`
    };

    return exportData;
  } catch (error) {
    console.error('Error preparing purchase orders report:', error);
    throw error;
  }
};

export const exportLowStockReport = async (supabase: any) => {
  try {
    const { data, error } = await supabase
      .from('inventory_items')
      .select(`
        name,
        sku,
        current_stock,
        minimum_stock,
        unit_price,
        status,
        categories (name),
        suppliers (name)
      `)
      .lte('current_stock', supabase.raw('minimum_stock'))
      .order('current_stock');

    if (error) throw error;

    const exportData: ExportData = {
      title: 'Low Stock Alert Report',
      headers: [
        'Item Name',
        'SKU',
        'Category',
        'Current Stock',
        'Minimum Stock',
        'Stock Deficit',
        'Unit Price (Le)',
        'Reorder Value (Le)',
        'Status',
        'Supplier'
      ],
      data: data.map(item => {
        const deficit = item.minimum_stock - item.current_stock;
        const reorderValue = (deficit * item.unit_price) / 100;
        return [
          item.name,
          item.sku,
          item.categories?.name || 'Unknown',
          item.current_stock.toString(),
          item.minimum_stock.toString(),
          deficit.toString(),
          (item.unit_price / 100).toFixed(2),
          reorderValue.toFixed(2),
          item.status,
          item.suppliers?.name || 'Unknown'
        ];
      }),
      filename: `low_stock_report_${new Date().toISOString().split('T')[0]}`
    };

    return exportData;
  } catch (error) {
    console.error('Error preparing low stock report:', error);
    throw error;
  }
};

export const exportStockMovementsReport = async (supabase: any, startDate?: string, endDate?: string) => {
  try {
    let query = supabase
      .from('stock_movements')
      .select(`
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        reason,
        created_at,
        inventory_items (name, sku)
      `)
      .order('created_at', { ascending: false });

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data, error } = await query;

    if (error) throw error;

    const exportData: ExportData = {
      title: 'Stock Movements Report',
      headers: [
        'Date',
        'Item Name',
        'SKU',
        'Movement Type',
        'Quantity',
        'Previous Stock',
        'New Stock',
        'Reason'
      ],
      data: data.map(movement => [
        new Date(movement.created_at).toLocaleDateString(),
        movement.inventory_items?.name || 'Unknown',
        movement.inventory_items?.sku || 'Unknown',
        movement.movement_type,
        movement.quantity.toString(),
        movement.previous_stock.toString(),
        movement.new_stock.toString(),
        movement.reason || 'Not specified'
      ]),
      filename: `stock_movements_report_${new Date().toISOString().split('T')[0]}`
    };

    return exportData;
  } catch (error) {
    console.error('Error preparing stock movements report:', error);
    throw error;
  }
};
