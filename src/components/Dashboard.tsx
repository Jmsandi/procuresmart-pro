import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  ShoppingCart,
  Users,
  FileText,
  Plus,
  Bell
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { supabase } from "@/integrations/supabase/client";
import { useStockMonitoring } from "@/hooks/useStockMonitoring";

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockItems: [],
    recentOrders: [],
    inventoryData: [],
    categoryData: []
  });
  const [loading, setLoading] = useState(true);
  const { stockAlerts, isMonitoring } = useStockMonitoring();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch inventory summary
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory_items')
        .select(`
          *,
          categories (name),
          suppliers (name)
        `);

      if (inventoryError) throw inventoryError;

      // Fetch recent purchase orders
      const { data: purchaseOrders, error: ordersError } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers (name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (ordersError) throw ordersError;

      // Process data
      const totalItems = inventoryItems?.length || 0;
      const totalValue = inventoryItems?.reduce((sum, item) => sum + (item.current_stock * item.unit_price), 0) / 100 || 0;
      
      const lowStockItems = inventoryItems?.filter(item => 
        item.current_stock <= item.minimum_stock
      ).slice(0, 3) || [];

      // Group by category for charts
      const categoryGroups = inventoryItems?.reduce((acc, item) => {
        const category = item.categories?.name || 'Unknown';
        if (!acc[category]) {
          acc[category] = { category, stock: 0, value: 0, count: 0 };
        }
        acc[category].stock += item.current_stock;
        acc[category].value += (item.current_stock * item.unit_price) / 100;
        acc[category].count += 1;
        return acc;
      }, {}) || {};

      const inventoryData = Object.values(categoryGroups);
      const categoryData = Object.values(categoryGroups).map((item: any) => ({
        name: item.category,
        value: item.count
      }));

      setDashboardData({
        totalItems,
        totalValue,
        lowStockItems: lowStockItems.map(item => ({
          name: item.name,
          current: item.current_stock,
          minimum: item.minimum_stock,
          category: item.categories?.name || 'Unknown'
        })),
        recentOrders: purchaseOrders?.map(order => ({
          id: order.po_number,
          supplier: order.suppliers?.name || 'Unknown',
          amount: order.total_amount / 100,
          status: order.status,
          date: new Date(order.created_at).toLocaleDateString()
        })) || [],
        inventoryData,
        categoryData
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Smart Procurement Dashboard</h1>
              <div className="flex items-center gap-2">
                <p className="text-muted-foreground">Real-time inventory and procurement insights</p>
                {isMonitoring && (
                  <div className="flex items-center gap-1 text-xs text-success">
                    <div className="h-2 w-2 bg-success rounded-full animate-pulse"></div>
                    Live monitoring active
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {stockAlerts.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-warning/10 border border-warning/20 rounded-lg">
                  <Bell className="h-4 w-4 text-warning" />
                  <span className="text-sm font-medium text-warning">
                    {stockAlerts.length} stock alerts
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 shadow-medium">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Items</p>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? "..." : dashboardData.totalItems.toLocaleString()}
                </p>
              </div>
              <Package className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-success mr-1" />
                <span className="text-success">+12%</span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-medium">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-foreground">
                  Le {loading ? "..." : dashboardData.totalValue.toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-success mr-1" />
                <span className="text-success">+8%</span>
                <span className="text-muted-foreground ml-1">from last month</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-medium">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Alerts</p>
                <p className="text-2xl font-bold text-destructive">
                  {loading ? "..." : dashboardData.lowStockItems.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <span className="text-muted-foreground">Needs attention</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-medium">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recent Orders</p>
                <p className="text-2xl font-bold text-foreground">
                  {loading ? "..." : dashboardData.recentOrders.length}
                </p>
              </div>
              <ShoppingCart className="h-8 w-8 text-primary" />
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inventory by Category */}
          <Card className="p-6 shadow-medium">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Inventory by Category</h3>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardData.inventoryData}>
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
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Category Distribution */}
          <Card className="p-6 shadow-medium">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Category Distribution</h3>
            </div>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dashboardData.categoryData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {dashboardData.categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={`hsl(${index * 60}, 70%, 50%)`} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alerts */}
          <Card className="p-6 shadow-medium">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Low Stock Alerts</h3>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : dashboardData.lowStockItems.length > 0 ? (
                dashboardData.lowStockItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-warning/20">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {item.current} / {item.minimum}
                      </p>
                      <p className="text-xs text-warning">Below minimum</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No low stock items</p>
                </div>
              )}
            </div>
          </Card>

          {/* Recent Purchase Orders */}
          <Card className="p-6 shadow-medium">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">Recent Purchase Orders</h3>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Loading...</p>
                </div>
              ) : dashboardData.recentOrders.length > 0 ? (
                dashboardData.recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{order.id}</p>
                      <p className="text-sm text-muted-foreground">{order.supplier}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">Le {order.amount.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant={
                            order.status === 'received' ? 'default' : 
                            order.status === 'pending' ? 'secondary' : 'outline'
                          }
                          className="text-xs"
                        >
                          {order.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{order.date}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No recent orders</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;