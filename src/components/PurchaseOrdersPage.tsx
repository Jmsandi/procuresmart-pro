import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Search, 
  Filter, 
  Plus, 
  Edit,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Clock,
  Package
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const PurchaseOrdersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAutoOrderDialogOpen, setIsAutoOrderDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPurchaseOrders();
    fetchLowStockItems();
    fetchSuppliers();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          suppliers (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPurchaseOrders(data || []);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    }
  };

  const fetchLowStockItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          categories (name),
          suppliers (name, id)
        `)
        .lte('current_stock', supabase.raw('minimum_stock'));

      if (error) throw error;
      setLowStockItems(data || []);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const generatePONumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PO-${year}${month}${day}-${random}`;
  };

  const handleAutoGenerateOrders = async () => {
    if (selectedItems.length === 0) {
      toast({
        title: "No items selected",
        description: "Please select items to generate purchase orders for",
        variant: "destructive",
      });
      return;
    }

    try {
      // Group items by supplier
      const itemsBySupplier = lowStockItems
        .filter(item => selectedItems.includes(item.id))
        .reduce((acc, item) => {
          const supplierId = item.supplier_id;
          if (!acc[supplierId]) {
            acc[supplierId] = {
              supplier: item.suppliers,
              items: []
            };
          }
          acc[supplierId].items.push(item);
          return acc;
        }, {} as any);

      // Create purchase orders for each supplier
      for (const [supplierId, group] of Object.entries(itemsBySupplier) as any) {
        const orderItems = group.items.map((item: any) => ({
          inventory_item_id: item.id,
          quantity: Math.max(item.minimum_stock * 2 - item.current_stock, item.minimum_stock), // Order enough to reach 2x minimum
          unit_price: item.unit_price,
          total_price: item.unit_price * Math.max(item.minimum_stock * 2 - item.current_stock, item.minimum_stock)
        }));

        const totalAmount = orderItems.reduce((sum: number, item: any) => sum + item.total_price, 0);

        // Create purchase order
        const { data: poData, error: poError } = await supabase
          .from('purchase_orders')
          .insert([{
            po_number: generatePONumber(),
            supplier_id: supplierId,
            total_amount: totalAmount,
            status: 'pending',
            order_date: new Date().toISOString().split('T')[0]
          }])
          .select()
          .single();

        if (poError) throw poError;

        // Create purchase order items
        const orderItemsWithPOId = orderItems.map((item: any) => ({
          ...item,
          purchase_order_id: poData.id
        }));

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(orderItemsWithPOId);

        if (itemsError) throw itemsError;
      }

      toast({
        title: "Success",
        description: `Generated ${Object.keys(itemsBySupplier).length} purchase orders`,
      });

      setIsAutoOrderDialogOpen(false);
      setSelectedItems([]);
      fetchPurchaseOrders();
      fetchLowStockItems();
    } catch (error) {
      console.error('Error generating purchase orders:', error);
      toast({
        title: "Error",
        description: "Failed to generate purchase orders",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-500 border-blue-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'ordered':
        return (
          <Badge variant="secondary" className="bg-purple-500/20 text-purple-500 border-purple-500/20">
            <ShoppingCart className="h-3 w-3 mr-1" />
            Ordered
          </Badge>
        );
      case 'received':
        return (
          <Badge variant="secondary" className="bg-success/20 text-success border-success/20">
            <Package className="h-3 w-3 mr-1" />
            Received
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/20">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredOrders = purchaseOrders.filter(order =>
    order.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.suppliers?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Purchase Orders</h1>
              <p className="text-muted-foreground">Manage purchase orders and auto-ordering</p>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={isAutoOrderDialogOpen} onOpenChange={setIsAutoOrderDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Auto-Order ({lowStockItems.length})
                  </Button>
                </DialogTrigger>
              </Dialog>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Manual Order
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <Card className="p-4 border-warning/20 bg-warning/5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium text-foreground">
                    {lowStockItems.length} items are running low on stock
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Consider generating purchase orders to restock these items
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-auto"
                  onClick={() => setIsAutoOrderDialogOpen(true)}
                >
                  Generate Orders
                </Button>
              </div>
            </Card>
          )}

          {/* Purchase Orders Table */}
          <Card className="shadow-medium">
            <div className="p-6 border-b bg-muted/20">
              <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search purchase orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <div className="text-sm text-muted-foreground">
                  {filteredOrders.length} orders found
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <ShoppingCart className="h-8 w-8 mx-auto text-muted-foreground animate-pulse" />
                    <p className="text-muted-foreground mt-2">Loading purchase orders...</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/20">
                      <TableHead className="font-semibold">PO Number</TableHead>
                      <TableHead className="font-semibold">Supplier</TableHead>
                      <TableHead className="font-semibold">Order Date</TableHead>
                      <TableHead className="font-semibold">Total Amount</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order) => (
                      <TableRow key={order.id} className="hover:bg-muted/20 transition-colors">
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{order.po_number}</p>
                            <p className="text-xs text-muted-foreground">
                              Created: {new Date(order.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <p className="font-medium text-foreground">
                            {order.suppliers?.name || 'Unknown'}
                          </p>
                        </TableCell>
                        
                        <TableCell>
                          <p className="text-foreground">
                            {new Date(order.order_date).toLocaleDateString()}
                          </p>
                        </TableCell>
                        
                        <TableCell>
                          <p className="font-medium text-foreground">
                            Le {(order.total_amount / 100).toLocaleString()}
                          </p>
                        </TableCell>
                        
                        <TableCell>
                          {getStatusBadge(order.status)}
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Auto-Order Dialog */}
      <Dialog open={isAutoOrderDialogOpen} onOpenChange={setIsAutoOrderDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Auto-Generate Purchase Orders</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              Select items below minimum stock to automatically generate purchase orders:
            </p>

            <div className="max-h-[400px] overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === lowStockItems.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(lowStockItems.map(item => item.id));
                          } else {
                            setSelectedItems([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Minimum</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Suggested Qty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((item) => {
                    const suggestedQty = Math.max(item.minimum_stock * 2 - item.current_stock, item.minimum_stock);
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems(prev => [...prev, item.id]);
                              } else {
                                setSelectedItems(prev => prev.filter(id => id !== item.id));
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-destructive font-medium">{item.current_stock}</span>
                        </TableCell>
                        <TableCell>{item.minimum_stock}</TableCell>
                        <TableCell>{item.suppliers?.name || 'Unknown'}</TableCell>
                        <TableCell>
                          <span className="font-medium text-success">{suggestedQty}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {selectedItems.length} items selected
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsAutoOrderDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAutoGenerateOrders}>
                Generate Orders
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchaseOrdersPage;
