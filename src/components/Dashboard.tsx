import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Users, 
  DollarSign,
  Download,
  Bell,
  Search
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  TooltipProps
} from "recharts";

const Dashboard = () => {
  // Mock data for demonstration
  const inventoryData = [
    { month: 'Jan', value: 45000, orders: 23 },
    { month: 'Feb', value: 52000, orders: 28 },
    { month: 'Mar', value: 48000, orders: 25 },
    { month: 'Apr', value: 61000, orders: 32 },
    { month: 'May', value: 55000, orders: 29 },
    { month: 'Jun', value: 67000, orders: 35 }
  ];

  const categoryData = [
    { name: 'Electronics', value: 35, color: 'hsl(var(--primary))' },
    { name: 'Office Supplies', value: 25, color: 'hsl(var(--success))' },
    { name: 'Manufacturing', value: 20, color: 'hsl(var(--warning))' },
    { name: 'Raw Materials', value: 20, color: 'hsl(var(--accent))' }
  ];

  const lowStockItems = [
    { name: "Laptop Batteries", current: 12, minimum: 20, status: "critical" },
    { name: "USB Cables", current: 45, minimum: 50, status: "low" },
    { name: "Paper Reams", current: 78, minimum: 100, status: "low" },
    { name: "Toner Cartridges", current: 5, minimum: 15, status: "critical" }
  ];

  const recentOrders = [
    { id: "PO-2024-001", vendor: "TechCorp Ltd", amount: 12500, status: "pending", date: "2024-01-15" },
    { id: "PO-2024-002", vendor: "Office Plus", amount: 3200, status: "delivered", date: "2024-01-14" },
    { id: "PO-2024-003", vendor: "Manufacturing Co", amount: 8900, status: "processing", date: "2024-01-13" }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'low':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Low</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-warning text-warning-foreground">Pending</Badge>;
      case 'delivered':
        return <Badge variant="secondary" className="bg-success text-success-foreground">Delivered</Badge>;
      case 'processing':
        return <Badge variant="outline">Processing</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
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
              <p className="text-muted-foreground">Real-time inventory and procurement insights</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Reports
              </Button>
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6 bg-gradient-to-br from-card to-accent/20 border shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Inventory Value</p>
                <p className="text-3xl font-bold text-foreground">$248,500</p>
                <p className="text-sm text-success flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% from last month
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-success/10 border shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Items in Stock</p>
                <p className="text-3xl font-bold text-foreground">1,247</p>
                <p className="text-sm text-muted-foreground mt-1">Across 8 categories</p>
              </div>
              <div className="h-12 w-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-success" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-warning/10 border shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Low Stock Alerts</p>
                <p className="text-3xl font-bold text-foreground">4</p>
                <p className="text-sm text-warning mt-1">Requires immediate attention</p>
              </div>
              <div className="h-12 w-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-card to-primary/10 border shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Vendors</p>
                <p className="text-3xl font-bold text-foreground">23</p>
                <p className="text-sm text-muted-foreground mt-1">Verified partners</p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inventory Trends */}
          <Card className="p-6 lg:col-span-2 shadow-medium">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Inventory Value Trends</h3>
                <p className="text-muted-foreground text-sm">Monthly inventory value and order frequency</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={inventoryData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" className="text-muted-foreground" />
                <YAxis className="text-muted-foreground" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          {/* Category Distribution */}
          <Card className="p-6 shadow-medium">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground">Category Distribution</h3>
              <p className="text-muted-foreground text-sm">Inventory by category</p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                  labelLine={false}
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Low Stock Alerts */}
          <Card className="p-6 shadow-medium">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Low Stock Alerts</h3>
                <p className="text-muted-foreground text-sm">Items requiring restock</p>
              </div>
              <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/20">
                {lowStockItems.length} alerts
              </Badge>
            </div>
            <div className="space-y-4">
              {lowStockItems.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Current: {item.current} | Minimum: {item.minimum}
                    </p>
                  </div>
                  {getStatusBadge(item.status)}
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Orders */}
          <Card className="p-6 shadow-medium">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Recent Purchase Orders</h3>
                <p className="text-muted-foreground text-sm">Latest procurement activity</p>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </div>
            <div className="space-y-4">
              {recentOrders.map((order, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.vendor}</p>
                    <p className="text-sm text-primary font-medium">${order.amount.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(order.status)}
                    <p className="text-xs text-muted-foreground mt-1">{order.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;