import { useState } from "react";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";
import InventoryTable from "@/components/InventoryTable";
import VendorsPage from "@/components/VendorsPage";
import PurchaseOrdersPage from "@/components/PurchaseOrdersPage";
import StockMovementsPage from "@/components/StockMovementsPage";
import ReportsPage from "@/components/ReportsPage";
import SettingsPage from "@/components/SettingsPage";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');
  const { hasPermission } = useAuth();

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return (
          <ProtectedRoute requiredRole={['admin', 'procurement_officer']}>
            <InventoryTable />
          </ProtectedRoute>
        );
      case 'vendors':
        return (
          <ProtectedRoute requiredRole={['admin', 'procurement_officer']}>
            <VendorsPage />
          </ProtectedRoute>
        );
      case 'purchase-orders':
        return (
          <ProtectedRoute requiredRole={['admin', 'procurement_officer']}>
            <PurchaseOrdersPage />
          </ProtectedRoute>
        );
      case 'stock-movements':
        return (
          <ProtectedRoute requiredRole={['admin', 'procurement_officer']}>
            <StockMovementsPage />
          </ProtectedRoute>
        );
      case 'reports':
        return <ReportsPage />; // All roles can view reports
      case 'settings':
        return (
          <ProtectedRoute requiredRole="admin">
            <SettingsPage />
          </ProtectedRoute>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Navigation activeView={activeView} onViewChange={setActiveView} />
      
      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {renderContent()}
      </main>
    </div>
  );
};

export default Index;