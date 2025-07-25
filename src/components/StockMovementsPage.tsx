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
  TrendingUp,
  TrendingDown,
  RotateCcw,
  Package,
  Calendar
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useStockMonitoring } from "@/hooks/useStockMonitoring";

const StockMovementsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [movements, setMovements] = useState<any[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddMovementDialogOpen, setIsAddMovementDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    inventory_item_id: "",
    movement_type: "",
    quantity: 0,
    reason: ""
  });
  const { toast } = useToast();
  const { updateStockLevel } = useStockMonitoring();

  useEffect(() => {
    fetchMovements();
    fetchInventoryItems();
  }, []);

  const fetchMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_movements')
        .select(`
          *,
          inventory_items (name, sku, current_stock)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error fetching stock movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, name, sku, current_stock')
        .order('name');
      
      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      inventory_item_id: "",
      movement_type: "",
      quantity: 0,
      reason: ""
    });
  };

  const handleAddMovement = async () => {
    if (!formData.inventory_item_id || !formData.movement_type || formData.quantity <= 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current stock
      const selectedItem = inventoryItems.find(item => item.id === formData.inventory_item_id);
      if (!selectedItem) throw new Error('Item not found');

      let newStock = selectedItem.current_stock;
      
      switch (formData.movement_type) {
        case 'in':
          newStock += formData.quantity;
          break;
        case 'out':
          newStock -= formData.quantity;
          if (newStock < 0) {
            toast({
              title: "Invalid Quantity",
              description: "Cannot remove more stock than available",
              variant: "destructive",
            });
            return;
          }
          break;
        case 'adjustment':
          newStock = formData.quantity; // For adjustments, quantity is the new total
          break;
      }

      // Update stock level using the monitoring hook
      const success = await updateStockLevel(
        formData.inventory_item_id, 
        newStock, 
        formData.reason || 'Manual stock movement'
      );

      if (success) {
        toast({
          title: "Success",
          description: "Stock movement recorded successfully",
        });

        setIsAddMovementDialogOpen(false);
        resetForm();
        fetchMovements();
        fetchInventoryItems();
      }
    } catch (error) {
      console.error('Error adding stock movement:', error);
      toast({
        title: "Error",
        description: "Failed to record stock movement",
        variant: "destructive",
      });
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'out':
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      case 'adjustment':
        return <RotateCcw className="h-4 w-4 text-warning" />;
      default:
        return <Package className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'in':
        return (
          <Badge variant="secondary" className="bg-success/20 text-success border-success/20">
            Stock In
          </Badge>
        );
      case 'out':
        return (
          <Badge variant="secondary" className="bg-destructive/20 text-destructive border-destructive/20">
            Stock Out
          </Badge>
        );
      case 'adjustment':
        return (
          <Badge variant="secondary" className="bg-warning/20 text-warning border-warning/20">
            Adjustment
          </Badge>
        );
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const filteredMovements = movements.filter(movement =>
    movement.inventory_items?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movement.inventory_items?.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movement.reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Stock Movements</h1>
              <p className="text-muted-foreground">Track all inventory stock changes and movements</p>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={isAddMovementDialogOpen} onOpenChange={setIsAddMovementDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Record Movement
                  </Button>
                </DialogTrigger>
              </Dialog>
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
                  placeholder="Search movements..."
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
                {filteredMovements.length} movements found
              </div>
            </div>
          </div>

          {/* Movements Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Package className="h-8 w-8 mx-auto text-muted-foreground animate-pulse" />
                  <p className="text-muted-foreground mt-2">Loading stock movements...</p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="font-semibold">Date & Time</TableHead>
                    <TableHead className="font-semibold">Item</TableHead>
                    <TableHead className="font-semibold">Movement Type</TableHead>
                    <TableHead className="font-semibold">Quantity</TableHead>
                    <TableHead className="font-semibold">Stock Levels</TableHead>
                    <TableHead className="font-semibold">Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.map((movement) => (
                    <TableRow key={movement.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {new Date(movement.created_at).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(movement.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {movement.inventory_items?.name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            SKU: {movement.inventory_items?.sku || 'Unknown'}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getMovementIcon(movement.movement_type)}
                          {getMovementBadge(movement.movement_type)}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <p className="font-medium text-foreground">
                          {movement.movement_type === 'out' ? '-' : '+'}{movement.quantity}
                        </p>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">
                            Before: {movement.previous_stock}
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            After: {movement.new_stock}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <p className="text-sm text-foreground">
                          {movement.reason || 'No reason specified'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </Card>
      </div>

      {/* Add Movement Dialog */}
      <Dialog open={isAddMovementDialogOpen} onOpenChange={setIsAddMovementDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Record Stock Movement</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="item" className="text-right">Item</Label>
              <Select
                value={formData.inventory_item_id}
                onValueChange={(value) => setFormData(prev => ({...prev, inventory_item_id: value}))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {inventoryItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.sku}) - Current: {item.current_stock}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="movement_type" className="text-right">Type</Label>
              <Select
                value={formData.movement_type}
                onValueChange={(value) => setFormData(prev => ({...prev, movement_type: value}))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select movement type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Stock In</SelectItem>
                  <SelectItem value="out">Stock Out</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                {formData.movement_type === 'adjustment' ? 'New Total' : 'Quantity'}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({...prev, quantity: parseInt(e.target.value) || 0}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">Reason</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({...prev, reason: e.target.value}))}
                className="col-span-3"
                placeholder="Optional reason for movement"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddMovementDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMovement}>
              Record Movement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StockMovementsPage;
