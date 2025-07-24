import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  Settings, 
  Bell, 
  Shield,
  User,
  Building,
  Mail,
  Phone,
  Save
} from "lucide-react";

const SettingsPage = () => {
  const [notifications, setNotifications] = useState({
    lowStock: true,
    orderUpdates: true,
    systemAlerts: false,
    emailReports: true
  });

  const [companyInfo, setCompanyInfo] = useState({
    name: "SmartProcure Solutions Ltd",
    address: "12 Siaka Stevens Street, Freetown, Sierra Leone",
    phone: "+232-76-123456",
    email: "admin@smartprocure.sl",
    taxId: "SL-TAX-123456"
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Manage your system preferences and configuration</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              Company
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card className="shadow-medium">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-foreground">General Settings</h3>
                <p className="text-muted-foreground">Manage your basic system preferences</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Input id="currency" value="Sierra Leonean Leone (SLE)" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input id="timezone" value="GMT (Greenwich Mean Time)" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Input id="dateFormat" value="DD/MM/YYYY" readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Input id="language" value="English" readOnly />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">Stock Management</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold (%)</Label>
                      <Input id="lowStockThreshold" type="number" defaultValue="20" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="criticalStockThreshold">Critical Stock Alert Threshold (%)</Label>
                      <Input id="criticalStockThreshold" type="number" defaultValue="10" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card className="shadow-medium">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-foreground">Notification Preferences</h3>
                <p className="text-muted-foreground">Configure how you receive alerts and updates</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="lowStock">Low Stock Alerts</Label>
                      <p className="text-sm text-muted-foreground">Get notified when items are running low</p>
                    </div>
                    <Switch 
                      id="lowStock"
                      checked={notifications.lowStock}
                      onCheckedChange={(checked) => setNotifications(prev => ({...prev, lowStock: checked}))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="orderUpdates">Purchase Order Updates</Label>
                      <p className="text-sm text-muted-foreground">Receive updates on order status changes</p>
                    </div>
                    <Switch 
                      id="orderUpdates"
                      checked={notifications.orderUpdates}
                      onCheckedChange={(checked) => setNotifications(prev => ({...prev, orderUpdates: checked}))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="systemAlerts">System Alerts</Label>
                      <p className="text-sm text-muted-foreground">Important system notifications and updates</p>
                    </div>
                    <Switch 
                      id="systemAlerts"
                      checked={notifications.systemAlerts}
                      onCheckedChange={(checked) => setNotifications(prev => ({...prev, systemAlerts: checked}))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="emailReports">Email Reports</Label>
                      <p className="text-sm text-muted-foreground">Weekly inventory and procurement summaries</p>
                    </div>
                    <Switch 
                      id="emailReports"
                      checked={notifications.emailReports}
                      onCheckedChange={(checked) => setNotifications(prev => ({...prev, emailReports: checked}))}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Company Information */}
          <TabsContent value="company">
            <Card className="shadow-medium">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-foreground">Company Information</h3>
                <p className="text-muted-foreground">Update your organization details</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input 
                      id="companyName" 
                      value={companyInfo.name}
                      onChange={(e) => setCompanyInfo(prev => ({...prev, name: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID</Label>
                    <Input 
                      id="taxId" 
                      value={companyInfo.taxId}
                      onChange={(e) => setCompanyInfo(prev => ({...prev, taxId: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      value={companyInfo.address}
                      onChange={(e) => setCompanyInfo(prev => ({...prev, address: e.target.value}))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="phone" 
                        className="pl-10"
                        value={companyInfo.phone}
                        onChange={(e) => setCompanyInfo(prev => ({...prev, phone: e.target.value}))}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="email" 
                        className="pl-10"
                        type="email"
                        value={companyInfo.email}
                        onChange={(e) => setCompanyInfo(prev => ({...prev, email: e.target.value}))}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Update Company Info
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security">
            <Card className="shadow-medium">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-foreground">Security Settings</h3>
                <p className="text-muted-foreground">Manage your account security and authentication</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <Input id="currentPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input id="newPassword" type="password" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input id="confirmPassword" type="password" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">Authentication</h4>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Enable 2FA
                    </Button>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button>
                    <Save className="h-4 w-4 mr-2" />
                    Update Security
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;