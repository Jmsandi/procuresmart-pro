-- Fix the function search path security issues
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.update_inventory_status();

-- Recreate functions with proper security definer and search path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recreate the inventory status function with proper security
CREATE OR REPLACE FUNCTION public.update_inventory_status()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.current_stock = 0 THEN
    NEW.status = 'out-of-stock';
  ELSIF NEW.current_stock <= (NEW.minimum_stock * 0.5) THEN
    NEW.status = 'critical';
  ELSIF NEW.current_stock <= NEW.minimum_stock THEN
    NEW.status = 'low-stock';
  ELSE
    NEW.status = 'in-stock';
  END IF;
  RETURN NEW;
END;
$$;