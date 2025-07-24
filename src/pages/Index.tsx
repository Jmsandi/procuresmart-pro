import { useState } from "react";
import Navigation from "@/components/Navigation";
import Dashboard from "@/components/Dashboard"; 
import InventoryTable from "@/components/InventoryTable";

const Index = () => {
  const [activeView, setActiveView] = useState('dashboard');

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />;
      case 'inventory':
        return <InventoryTable />;
      case 'vendors':
        return (
          <div className="min-h-screen bg-background p-8">
            <div className="container mx-auto">
              <h1 className="text-2xl font-bold mb-4">Vendor Management</h1>
              <p className="text-muted-foreground">Vendor management interface coming soon...</p>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div className="min-h-screen bg-background p-8">
            <div className="container mx-auto">
              <h1 className="text-2xl font-bold mb-4">Reports & Analytics</h1>
              <p className="text-muted-foreground">Advanced reporting interface coming soon...</p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="min-h-screen bg-background p-8">
            <div className="container mx-auto">
              <h1 className="text-2xl font-bold mb-4">System Settings</h1>
              <p className="text-muted-foreground">Settings interface coming soon...</p>
            </div>
          </div>
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