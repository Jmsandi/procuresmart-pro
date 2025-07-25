import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Package,
  DollarSign,
  ShoppingCart,
  FileSpreadsheet
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  exportToPDF,
  exportToExcel,
  exportInventoryReport,
  exportPurchaseOrdersReport,
  exportLowStockReport,
  exportStockMovementsReport
} from "@/lib/exportUtils";

const ReportsPage = () => {
  const [reportData, setReportData] = useState({
    inventoryTrends: [],
    purchaseOrders: [],
    stockMovements: [],
    topCategories: []
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      // Fetch inventory items for trends
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory_items')
        .select(`
          *,
          categories (name),
          suppliers (name)
        `);

      if (inventoryError) throw inventoryError;

      // Fetch purchase orders for financial reports
      const { data: purchaseOrders, error: ordersError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers (name)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Process data for charts
      const categoryGroups = inventoryItems?.reduce((acc, item) => {
        const category = item.categories?.name || 'Unknown';
        if (!acc[category]) {
          acc[category] = { 
            category, 
            totalValue: 0, 
            itemCount: 0,
            lowStockItems: 0 
          };
        }
        acc[category].totalValue += (item.current_stock * item.unit_price) / 100;
        acc[category].itemCount += 1;
        if (item.current_stock <= item.minimum_stock) {
          acc[category].lowStockItems += 1;
        }
        return acc;
      }, {}) || {};

      const topCategories = Object.values(categoryGroups);

      // Monthly purchase order trends (mock data for demo)
      const inventoryTrends = [
        { month: 'Oct', purchases: 125000, stockValue: 450000 },
        { month: 'Nov', purchases: 98000, stockValue: 485000 },
        { month: 'Dec', purchases: 156000, stockValue: 520000 },
        { month: 'Jan', purchases: 134000, stockValue: 495000 },
      ];

      setReportData({
        inventoryTrends,
        purchaseOrders: purchaseOrders || [],
        stockMovements: [], // Would fetch from stock_movements table
        topCategories
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (reportType: string, format: 'pdf' | 'excel') => {
    setExporting(true);
    try {
      let exportData;

      switch (reportType) {
        case 'inventory':
          exportData = await exportInventoryReport(supabase);
          break;
        case 'purchase-orders':
          exportData = await exportPurchaseOrdersReport(supabase);
          break;
        case 'low-stock':
          exportData = await exportLowStockReport(supabase);
          break;
        case 'stock-movements':
          exportData = await exportStockMovementsReport(supabase);
          break;
        default:
          throw new Error('Unknown report type');
      }

      if (format === 'pdf') {
        exportToPDF(exportData);
      } else {
        exportToExcel(exportData);
      }

      toast({
        title: "Export Successful",
        description: `${reportType} report exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const reports = [
    {
      id: "inventory",
      title: "Inventory Valuation Report",
      description: "Complete inventory value breakdown by category",
      icon: Package
    },
    {
      id: "purchase-orders",
      title: "Purchase Order Summary",
      description: "Monthly procurement and vendor analysis",
      icon: ShoppingCart
    },
    {
      id: "stock-movements",
      title: "Stock Movement Report",
      description: "Detailed stock in/out transactions",
      icon: TrendingUp
    },
    {
      id: "low-stock",
      title: "Low Stock Alert Report",
      description: "Items requiring immediate attention",
      icon: Package
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
              <p className="text-muted-foreground">Generate and view procurement reports</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Calendar className="h-4 w-4 mr-2" />
                Date Range
              </Button>
              <Button size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 shadow-medium">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Orders This Month</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : reportData.purchaseOrders.length}
                  </p>
                </div>
                <ShoppingCart className="h-8 w-8 text-primary" />
              </div>
            </Card>

            <Card className="p-6 shadow-medium">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Procurement Value</p>
                  <p className="text-2xl font-bold text-foreground">
                    Le {loading ? "..." : reportData.purchaseOrders.reduce((sum, order) => sum + order.total_amount / 100, 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </Card>

            <Card className="p-6 shadow-medium">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Categories</p>
                  <p className="text-2xl font-bold text-foreground">
                    {loading ? "..." : reportData.topCategories.length}
                  </p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Procurement Trends */}
            <Card className="p-6 shadow-medium">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Procurement Trends</h3>
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportData.inventoryTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="month" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="purchases" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Category Analysis */}
            <Card className="p-6 shadow-medium">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-foreground">Category Value Analysis</h3>
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.topCategories}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="category" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="totalValue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Reports List */}
          <Card className="shadow-medium">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-foreground">Generated Reports</h3>
              <p className="text-muted-foreground">Download and manage your reports</p>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {reports.map((report) => {
                  const IconComponent = report.icon;
                  return (
                    <div key={report.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{report.title}</p>
                          <p className="text-sm text-muted-foreground">{report.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport(report.id, 'pdf')}
                          disabled={exporting}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExport(report.id, 'excel')}
                          disabled={exporting}
                        >
                          <FileSpreadsheet className="h-3 w-3 mr-1" />
                          Excel
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;