import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Download, 
  Plus, 
  Edit,
  AlertTriangle,
  CheckCircle,
  Package
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const InventoryTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          categories (name),
          suppliers (name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedItems = data?.map(item => ({
        id: item.id,
        name: item.name,
        category: item.categories?.name || 'Unknown',
        sku: item.sku,
        currentStock: item.current_stock,
        minimumStock: item.minimum_stock,
        unitPrice: item.unit_price / 100, // Convert from cents to leones
        totalValue: (item.current_stock * item.unit_price) / 100,
        supplier: item.suppliers?.name || 'Unknown',
        lastUpdated: new Date(item.updated_at).toLocaleDateString(),
        status: item.status
      })) || [];

      setInventoryItems(formattedItems);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = inventoryItems.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical':
        return (
          <Badge variant="destructive" className="bg-destructive/20 text-destructive border-destructive/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Critical
          </Badge>
        );
      case 'low-stock':
        return (
          <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/20">
            <Package className="h-3 w-3 mr-1" />
            Low Stock
          </Badge>
        );
      case 'in-stock':
        return (
          <Badge variant="secondary" className="bg-success/20 text-success border-success/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            In Stock
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStockLevel = (current: number, minimum: number) => {
    const percentage = (current / minimum) * 100;
    if (percentage <= 50) return 'critical';
    if (percentage <= 100) return 'low-stock';
    return 'in-stock';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
              <p className="text-muted-foreground">Track and manage your inventory items</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Card className="shadow-medium">
          {/* Search and Filters */}
          <div className="p-6 border-b bg-muted/20">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search items, categories, SKUs..."
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
                {filteredItems.length} items found
              </div>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Package className="h-8 w-8 mx-auto text-muted-foreground animate-pulse" />
                  <p className="text-muted-foreground mt-2">Loading inventory...</p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="font-semibold">Item Details</TableHead>
                    <TableHead className="font-semibold">Category</TableHead>
                    <TableHead className="font-semibold">Stock Levels</TableHead>
                    <TableHead className="font-semibold">Pricing (Leones)</TableHead>
                    <TableHead className="font-semibold">Supplier</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                        <p className="text-xs text-muted-foreground">ID: {item.id}</p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className="bg-accent/20">
                        {item.category}
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          Current: <span className="text-primary">{item.currentStock}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Min: {item.minimumStock}
                        </p>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              getStockLevel(item.currentStock, item.minimumStock) === 'critical' 
                                ? 'bg-destructive' 
                                : getStockLevel(item.currentStock, item.minimumStock) === 'low-stock'
                                ? 'bg-warning'
                                : 'bg-success'
                            }`}
                            style={{ 
                              width: `${Math.min((item.currentStock / item.minimumStock) * 100, 100)}%` 
                            }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">
                          Le {item.unitPrice.toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Total: Le {item.totalValue.toFixed(2)}
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium text-foreground">{item.supplier}</p>
                        <p className="text-xs text-muted-foreground">
                          Updated: {item.lastUpdated}
                        </p>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {getStatusBadge(getStockLevel(item.currentStock, item.minimumStock))}
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm">
                          Reorder
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
  );
};

export default InventoryTable;