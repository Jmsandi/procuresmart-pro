import { useState } from "react";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard";
import InventoryTable from "@/components/InventoryTable";
import VendorsPage from "@/components/VendorsPage";
import ReportsPage from "@/components/ReportsPage";
import SettingsPage from "@/components/SettingsPage";

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <InventoryTable />;
      case 'vendors':
        return <VendorsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
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