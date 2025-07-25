import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Users,
  FileText,
  Settings,
  Menu,
  X,
  ChevronDown,
  ShoppingCart,
  TrendingUp,
  LogOut,
  User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface NavigationProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const Navigation = ({ activeView, onViewChange }: NavigationProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { profile, signOut, hasPermission } = useAuth();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'procurement_officer', 'auditor'] },
    { id: 'inventory', label: 'Inventory', icon: Package, roles: ['admin', 'procurement_officer'] },
    { id: 'vendors', label: 'Vendors', icon: Users, roles: ['admin', 'procurement_officer'] },
    { id: 'purchase-orders', label: 'Purchase Orders', icon: ShoppingCart, roles: ['admin', 'procurement_officer'] },
    { id: 'stock-movements', label: 'Stock Movements', icon: TrendingUp, roles: ['admin', 'procurement_officer'] },
    { id: 'reports', label: 'Reports', icon: FileText, roles: ['admin', 'procurement_officer', 'auditor'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  ];

  const visibleNavigationItems = navigationItems.filter(item =>
    hasPermission(item.roles as any)
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-card shadow-medium"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen w-64 bg-card border-r shadow-medium z-40 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo/Header */}
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">SmartProcure</h2>
              <p className="text-xs text-muted-foreground">Inventory Management</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {visibleNavigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={`w-full justify-start h-10 ${
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-sm" 
                    : "hover:bg-accent/50 text-foreground"
                }`}
                onClick={() => {
                  onViewChange(item.id);
                  setIsMobileMenuOpen(false);
                }}
              >
                <Icon className="h-4 w-4 mr-3" />
                {item.label}
              </Button>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-muted/20">
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-card border">
              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground capitalize">
                  {profile?.role?.replace('_', ' ') || 'User'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={signOut}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Navigation;