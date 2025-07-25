import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Phone,
  Mail,
  MapPin,
  Building,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const VendorsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    email: "",
    phone: "",
    address: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      contact_person: "",
      email: "",
      phone: "",
      address: ""
    });
  };

  const handleAddVendor = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert([formData])
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor added successfully",
      });

      setIsAddDialogOpen(false);
      resetForm();
      fetchVendors();
    } catch (error) {
      console.error('Error adding vendor:', error);
      toast({
        title: "Error",
        description: "Failed to add vendor",
        variant: "destructive",
      });
    }
  };

  const handleEditVendor = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update(formData)
        .eq('id', editingVendor.id)
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingVendor(null);
      resetForm();
      fetchVendors();
    } catch (error) {
      console.error('Error updating vendor:', error);
      toast({
        title: "Error",
        description: "Failed to update vendor",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVendor = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', vendorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Vendor deleted successfully",
      });

      fetchVendors();
    } catch (error) {
      console.error('Error deleting vendor:', error);
      toast({
        title: "Error",
        description: "Failed to delete vendor",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (vendor: any) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      contact_person: vendor.contact_person || "",
      email: vendor.email || "",
      phone: vendor.phone || "",
      address: vendor.address || ""
    });
    setIsEditDialogOpen(true);
  };

  const filteredVendors = vendors.filter(vendor =>
    vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Vendor Management</h1>
              <p className="text-muted-foreground">Manage your suppliers and vendors</p>
            </div>
            <div className="flex items-center gap-3">
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vendor
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
                  placeholder="Search vendors..."
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
                {filteredVendors.length} vendors found
              </div>
            </div>
          </div>

          {/* Vendors Table */}
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Building className="h-8 w-8 mx-auto text-muted-foreground animate-pulse" />
                  <p className="text-muted-foreground mt-2">Loading vendors...</p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20">
                    <TableHead className="font-semibold">Vendor Details</TableHead>
                    <TableHead className="font-semibold">Contact Person</TableHead>
                    <TableHead className="font-semibold">Contact Info</TableHead>
                    <TableHead className="font-semibold">Address</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor) => (
                    <TableRow key={vendor.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">{vendor.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Added: {new Date(vendor.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground">
                            {vendor.contact_person || 'Not specified'}
                          </p>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-2">
                          {vendor.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm text-foreground">{vendor.email}</span>
                            </div>
                          )}
                          {vendor.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm text-foreground">{vendor.phone}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-foreground">
                            {vendor.address || 'Not specified'}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant="secondary" className="bg-success/20 text-success border-success/20">
                          Active
                        </Badge>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(vendor)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteVendor(vendor.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button variant="outline" size="sm">
                            View Orders
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

      {/* Add Vendor Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
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
              <Label htmlFor="contact_person" className="text-right">Contact Person</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData(prev => ({...prev, contact_person: e.target.value}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="address" className="text-right">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVendor}>
              Add Vendor
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
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
              <Label htmlFor="edit_contact_person" className="text-right">Contact Person</Label>
              <Input
                id="edit_contact_person"
                value={formData.contact_person}
                onChange={(e) => setFormData(prev => ({...prev, contact_person: e.target.value}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_email" className="text-right">Email</Label>
              <Input
                id="edit_email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_phone" className="text-right">Phone</Label>
              <Input
                id="edit_phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_address" className="text-right">Address</Label>
              <Input
                id="edit_address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({...prev, address: e.target.value}))}
                className="col-span-3"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditVendor}>
              Update Vendor
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorsPage;