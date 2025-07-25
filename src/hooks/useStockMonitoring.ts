import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StockAlert {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  minimum_stock: number;
  status: 'critical' | 'low-stock';
  supplier_name?: string;
}

export const useStockMonitoring = () => {
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { toast } = useToast();

  const checkStockLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          id,
          name,
          sku,
          current_stock,
          minimum_stock,
          status,
          suppliers (name)
        `)
        .lte('current_stock', supabase.raw('minimum_stock'));

      if (error) throw error;

      const alerts: StockAlert[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        sku: item.sku,
        current_stock: item.current_stock,
        minimum_stock: item.minimum_stock,
        status: item.current_stock === 0 ? 'critical' : 
                item.current_stock <= (item.minimum_stock * 0.5) ? 'critical' : 'low-stock',
        supplier_name: item.suppliers?.name
      }));

      // Check for new alerts
      const newAlerts = alerts.filter(alert => 
        !stockAlerts.some(existing => existing.id === alert.id)
      );

      if (newAlerts.length > 0) {
        newAlerts.forEach(alert => {
          toast({
            title: `${alert.status === 'critical' ? 'Critical' : 'Low'} Stock Alert`,
            description: `${alert.name} (${alert.sku}) is ${alert.status === 'critical' ? 'critically low' : 'running low'} - Current: ${alert.current_stock}, Minimum: ${alert.minimum_stock}`,
            variant: alert.status === 'critical' ? 'destructive' : 'default',
          });
        });
      }

      setStockAlerts(alerts);
      return alerts;
    } catch (error) {
      console.error('Error checking stock levels:', error);
      return [];
    }
  };

  const updateStockLevel = async (itemId: string, newStock: number, reason: string = 'Manual adjustment') => {
    try {
      // Get current item data
      const { data: currentItem, error: fetchError } = await supabase
        .from('inventory_items')
        .select('current_stock')
        .eq('id', itemId)
        .single();

      if (fetchError) throw fetchError;

      const previousStock = currentItem.current_stock;

      // Update inventory item
      const { error: updateError } = await supabase
        .from('inventory_items')
        .update({ current_stock: newStock })
        .eq('id', itemId);

      if (updateError) throw updateError;

      // Log stock movement
      const { error: movementError } = await supabase
        .from('stock_movements')
        .insert([{
          inventory_item_id: itemId,
          movement_type: newStock > previousStock ? 'in' : newStock < previousStock ? 'out' : 'adjustment',
          quantity: Math.abs(newStock - previousStock),
          previous_stock: previousStock,
          new_stock: newStock,
          reason: reason
        }]);

      if (movementError) throw movementError;

      // Recheck stock levels after update
      await checkStockLevels();

      return true;
    } catch (error) {
      console.error('Error updating stock level:', error);
      toast({
        title: "Error",
        description: "Failed to update stock level",
        variant: "destructive",
      });
      return false;
    }
  };

  const startMonitoring = (intervalMs: number = 30000) => { // Check every 30 seconds by default
    if (isMonitoring) return;

    setIsMonitoring(true);
    
    // Initial check
    checkStockLevels();

    // Set up interval for periodic checks
    const interval = setInterval(() => {
      checkStockLevels();
    }, intervalMs);

    // Set up real-time subscription for inventory changes
    const subscription = supabase
      .channel('inventory_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_items'
        },
        (payload) => {
          console.log('Inventory change detected:', payload);
          // Recheck stock levels when inventory changes
          setTimeout(checkStockLevels, 1000); // Small delay to ensure DB consistency
        }
      )
      .subscribe();

    // Cleanup function
    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
      setIsMonitoring(false);
    };
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  // Auto-start monitoring when hook is used
  useEffect(() => {
    const cleanup = startMonitoring();
    return cleanup;
  }, []);

  return {
    stockAlerts,
    isMonitoring,
    checkStockLevels,
    updateStockLevel,
    startMonitoring,
    stopMonitoring
  };
};
