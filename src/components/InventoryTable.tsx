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
  Download,
  Plus,
  Edit,
  AlertTriangle,
  CheckCircle,
  Package,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { exportToPDF, exportToExcel, exportInventoryReport } from "@/lib/exportUtils";

const InventoryTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category_id: "",
    supplier_id: "",
    current_stock: 0,
    minimum_stock: 0,
    unit_price: 0
  });
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchInventoryItems();
    fetchCategories();
    fetchSuppliers();
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
        category_id: item.category_id,
        supplier_id: item.supplier_id,
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

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
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

  const resetForm = () => {
    setFormData({
      name: "",
      sku: "",
      category_id: "",
      supplier_id: "",
      current_stock: 0,
      minimum_stock: 0,
      unit_price: 0
    });
  };

  const handleAddItem = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert([{
          ...formData,
          unit_price: Math.round(formData.unit_price * 100) // Convert to cents
        }])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchInventoryItems();
    } catch (error) {
      console.error('Error adding item:', error);
      toast({
        title: "Error",
        description: "Failed to add inventory item",
        variant: "destructive",
      });
    }
  };

  const handleEditItem = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .update({
          ...formData,
          unit_price: Math.round(formData.unit_price * 100) // Convert to cents
        })
        .eq('id', editingItem.id)
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingItem(null);
      resetForm();
      fetchInventoryItems();
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Inventory item deleted successfully",
      });

      fetchInventoryItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Error",
        description: "Failed to delete inventory item",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      sku: item.sku,
      category_id: item.category_id || "",
      supplier_id: item.supplier_id || "",
      current_stock: item.currentStock,
      minimum_stock: item.minimumStock,
      unit_price: item.unitPrice
    });
    setIsEditDialogOpen(true);
  };

  const handleExport = async (format: 'pdf' | 'excel') => {
    setExporting(true);
    try {
      const exportData = await exportInventoryReport(supabase);

      if (format === 'pdf') {
        exportToPDF(exportData);
      } else {
        exportToExcel(exportData);
      }

      toast({
        title: "Export Successful",
        description: `Inventory exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export inventory. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
                disabled={exporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('excel')}
                disabled={exporting}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
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

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="sku" className="text-right">SKU</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({...prev, sku: e.target.value}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="category" className="text-right">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData(prev => ({...prev, category_id: value}))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="supplier" className="text-right">Supplier</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData(prev => ({...prev, supplier_id: value}))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="current_stock" className="text-right">Current Stock</Label>
              <Input
                id="current_stock"
                type="number"
                value={formData.current_stock}
                onChange={(e) => setFormData(prev => ({...prev, current_stock: parseInt(e.target.value) || 0}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minimum_stock" className="text-right">Minimum Stock</Label>
              <Input
                id="minimum_stock"
                type="number"
                value={formData.minimum_stock}
                onChange={(e) => setFormData(prev => ({...prev, minimum_stock: parseInt(e.target.value) || 0}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="unit_price" className="text-right">Unit Price (Le)</Label>
              <Input
                id="unit_price"
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData(prev => ({...prev, unit_price: parseFloat(e.target.value) || 0}))}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddItem}>
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_name" className="text-right">Name</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_sku" className="text-right">SKU</Label>
              <Input
                id="edit_sku"
                value={formData.sku}
                onChange={(e) => setFormData(prev => ({...prev, sku: e.target.value}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_category" className="text-right">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData(prev => ({...prev, category_id: value}))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_supplier" className="text-right">Supplier</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData(prev => ({...prev, supplier_id: value}))}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_current_stock" className="text-right">Current Stock</Label>
              <Input
                id="edit_current_stock"
                type="number"
                value={formData.current_stock}
                onChange={(e) => setFormData(prev => ({...prev, current_stock: parseInt(e.target.value) || 0}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_minimum_stock" className="text-right">Minimum Stock</Label>
              <Input
                id="edit_minimum_stock"
                type="number"
                value={formData.minimum_stock}
                onChange={(e) => setFormData(prev => ({...prev, minimum_stock: parseInt(e.target.value) || 0}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_unit_price" className="text-right">Unit Price (Le)</Label>
              <Input
                id="edit_unit_price"
                type="number"
                step="0.01"
                value={formData.unit_price}
                onChange={(e) => setFormData(prev => ({...prev, unit_price: parseFloat(e.target.value) || 0}))}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditItem}>
              Update Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InventoryTable;