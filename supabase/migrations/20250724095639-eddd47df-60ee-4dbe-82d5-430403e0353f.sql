-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create suppliers table
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create inventory_items table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.categories(id),
  supplier_id UUID REFERENCES public.suppliers(id),
  current_stock INTEGER NOT NULL DEFAULT 0,
  minimum_stock INTEGER NOT NULL DEFAULT 0,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in-stock' CHECK (status IN ('in-stock', 'low-stock', 'critical', 'out-of-stock')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_orders table
CREATE TABLE public.purchase_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES public.suppliers(id),
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'ordered', 'received', 'cancelled')),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_delivery DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purchase_order_items table
CREATE TABLE public.purchase_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_order_id UUID REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock_movements table
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_item_id UUID REFERENCES public.inventory_items(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  reference_id UUID, -- Could reference purchase_order_id or other reference
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allowing all operations for now - you can restrict based on user roles later)
CREATE POLICY "Allow all operations on categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on inventory_items" ON public.inventory_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on purchase_orders" ON public.purchase_orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on purchase_order_items" ON public.purchase_order_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stock_movements" ON public.stock_movements FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON public.purchase_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to automatically update inventory status based on stock levels
CREATE OR REPLACE FUNCTION public.update_inventory_status()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update inventory status
CREATE TRIGGER update_inventory_status_trigger BEFORE INSERT OR UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_inventory_status();

-- Insert sample data
INSERT INTO public.categories (name, description) VALUES
('Electronics', 'Electronic devices and components'),
('Office Supplies', 'Office materials and stationery'),
('Furniture', 'Office and workspace furniture');

INSERT INTO public.suppliers (name, contact_person, email, phone, address) VALUES
('TechCorp Ltd', 'John Smith', 'john@techcorp.sl', '+232-76-123456', 'Freetown, Sierra Leone'),
('Cable Co', 'Mary Johnson', 'mary@cableco.sl', '+232-77-789012', 'Bo, Sierra Leone'),
('Office Plus', 'David Wilson', 'david@officeplus.sl', '+232-78-345678', 'Kenema, Sierra Leone'),
('Furniture Pro', 'Sarah Ahmed', 'sarah@furniturepro.sl', '+232-79-901234', 'Makeni, Sierra Leone'),
('Print Solutions', 'Michael Cole', 'michael@printsol.sl', '+232-76-567890', 'Freetown, Sierra Leone');

INSERT INTO public.inventory_items (name, sku, category_id, supplier_id, current_stock, minimum_stock, unit_price) VALUES
('Laptop Dell XPS 13', 'DELL-XPS13-001', (SELECT id FROM categories WHERE name = 'Electronics'), (SELECT id FROM suppliers WHERE name = 'TechCorp Ltd'), 25, 20, 22499750.00),
('USB-C Cables (Pack of 10)', 'USB-C-10PK-001', (SELECT id FROM categories WHERE name = 'Electronics'), (SELECT id FROM suppliers WHERE name = 'Cable Co'), 45, 50, 74975.00),
('A4 Paper Reams', 'PAPER-A4-500', (SELECT id FROM categories WHERE name = 'Office Supplies'), (SELECT id FROM suppliers WHERE name = 'Office Plus'), 78, 100, 12475.00),
('Ergonomic Office Chairs', 'CHAIR-ERG-001', (SELECT id FROM categories WHERE name = 'Furniture'), (SELECT id FROM suppliers WHERE name = 'Furniture Pro'), 15, 10, 749975.00),
('Laser Toner Cartridges', 'TONER-HP-001', (SELECT id FROM categories WHERE name = 'Electronics'), (SELECT id FROM suppliers WHERE name = 'Print Solutions'), 5, 15, 224975.00),
('Wireless Mouse', 'MOUSE-WL-001', (SELECT id FROM categories WHERE name = 'Electronics'), (SELECT id FROM suppliers WHERE name = 'TechCorp Ltd'), 120, 50, 62475.00);