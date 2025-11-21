-- Add alias columns to tables for public-facing IDs
-- Aliases are URL-safe strings generated from names

-- Add alias to canteens table
ALTER TABLE public.canteens
ADD COLUMN IF NOT EXISTS alias TEXT UNIQUE;

-- Add alias to items table
ALTER TABLE public.items
ADD COLUMN IF NOT EXISTS alias TEXT;

-- Add alias to order_templates table
ALTER TABLE public.order_templates
ADD COLUMN IF NOT EXISTS alias TEXT;

-- Add alias to orders table (can use token, but adding alias for consistency)
-- Orders already have token, but we can add an alias for search purposes
-- ALTER TABLE public.orders
-- ADD COLUMN IF NOT EXISTS alias TEXT UNIQUE;

-- Create function to generate alias from name
CREATE OR REPLACE FUNCTION generate_alias_from_name(name_text TEXT)
RETURNS TEXT AS $$
DECLARE
  base_alias TEXT;
  final_alias TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase, remove special chars, replace spaces with hyphens
  base_alias := lower(trim(name_text));
  base_alias := regexp_replace(base_alias, '[^a-z0-9\s-]', '', 'g');
  base_alias := regexp_replace(base_alias, '\s+', '-', 'g');
  base_alias := regexp_replace(base_alias, '-+', '-', 'g');
  base_alias := regexp_replace(base_alias, '^-|-$', '', 'g');
  base_alias := left(base_alias, 50); -- Limit length
  
  final_alias := base_alias;
  
  -- Check for uniqueness and append counter if needed
  -- This will be handled by application logic for better control
  
  RETURN final_alias;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate unique alias with random suffix
CREATE OR REPLACE FUNCTION generate_unique_alias(name_text TEXT, table_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_alias TEXT;
  final_alias TEXT;
  random_suffix TEXT;
  exists_check BOOLEAN;
BEGIN
  base_alias := generate_alias_from_name(name_text);
  random_suffix := substring(md5(random()::text || clock_timestamp()::text) from 1 for 8);
  final_alias := base_alias || '-' || random_suffix;
  
  RETURN final_alias;
END;
$$ LANGUAGE plpgsql;

-- Create indexes for alias columns
CREATE INDEX IF NOT EXISTS idx_canteens_alias ON public.canteens(alias) WHERE alias IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_alias ON public.items(alias) WHERE alias IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_templates_alias ON public.order_templates(alias) WHERE alias IS NOT NULL;

-- Create trigger to auto-generate alias for canteens
CREATE OR REPLACE FUNCTION set_canteen_alias()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.alias IS NULL OR NEW.alias = '' THEN
    -- Try base alias first
    NEW.alias := generate_alias_from_name(NEW.name);
    
    -- Check if it exists and add suffix if needed
    WHILE EXISTS (
      SELECT 1 FROM public.canteens 
      WHERE alias = NEW.alias AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) LOOP
      NEW.alias := NEW.alias || '-' || substring(md5(random()::text) from 1 for 6);
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS canteen_alias_trigger ON public.canteens;

-- Create trigger for INSERT
CREATE TRIGGER canteen_alias_trigger_insert
  BEFORE INSERT ON public.canteens
  FOR EACH ROW
  WHEN (NEW.alias IS NULL OR NEW.alias = '')
  EXECUTE FUNCTION set_canteen_alias();

-- Create trigger for UPDATE
CREATE TRIGGER canteen_alias_trigger_update
  BEFORE UPDATE OF name ON public.canteens
  FOR EACH ROW
  WHEN (NEW.alias IS NULL OR NEW.alias = '' OR (OLD.name IS DISTINCT FROM NEW.name AND NEW.alias = OLD.alias))
  EXECUTE FUNCTION set_canteen_alias();

-- Create trigger to auto-generate alias for items
CREATE OR REPLACE FUNCTION set_item_alias()
RETURNS TRIGGER AS $$
DECLARE
  canteen_name TEXT;
BEGIN
  IF NEW.alias IS NULL OR NEW.alias = '' THEN
    -- Get canteen name for composite alias
    SELECT alias INTO canteen_name FROM public.canteens WHERE id = NEW.canteen_id;
    
    IF canteen_name IS NOT NULL THEN
      NEW.alias := generate_alias_from_name(canteen_name || '-' || NEW.name);
    ELSE
      NEW.alias := generate_alias_from_name(NEW.name);
    END IF;
    
    -- Check uniqueness within canteen
    WHILE EXISTS (
      SELECT 1 FROM public.items 
      WHERE canteen_id = NEW.canteen_id 
      AND alias = NEW.alias 
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) LOOP
      NEW.alias := NEW.alias || '-' || substring(md5(random()::text) from 1 for 6);
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS item_alias_trigger ON public.items;

-- Create trigger for INSERT
CREATE TRIGGER item_alias_trigger_insert
  BEFORE INSERT ON public.items
  FOR EACH ROW
  WHEN (NEW.alias IS NULL OR NEW.alias = '')
  EXECUTE FUNCTION set_item_alias();

-- Create trigger for UPDATE
CREATE TRIGGER item_alias_trigger_update
  BEFORE UPDATE OF name, canteen_id ON public.items
  FOR EACH ROW
  WHEN (NEW.alias IS NULL OR NEW.alias = '' OR (OLD.name IS DISTINCT FROM NEW.name AND NEW.alias = OLD.alias) OR OLD.canteen_id IS DISTINCT FROM NEW.canteen_id)
  EXECUTE FUNCTION set_item_alias();

-- Create trigger to auto-generate alias for order_templates
CREATE OR REPLACE FUNCTION set_order_template_alias()
RETURNS TRIGGER AS $$
DECLARE
  canteen_name TEXT;
BEGIN
  IF NEW.alias IS NULL OR NEW.alias = '' THEN
    -- Get canteen alias
    SELECT alias INTO canteen_name FROM public.canteens WHERE id = NEW.canteen_id;
    
    IF canteen_name IS NOT NULL THEN
      NEW.alias := generate_alias_from_name(canteen_name || '-' || NEW.name);
    ELSE
      NEW.alias := generate_alias_from_name(NEW.name);
    END IF;
    
    -- Add timestamp suffix for uniqueness
    NEW.alias := NEW.alias || '-' || substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS order_template_alias_trigger ON public.order_templates;

CREATE TRIGGER order_template_alias_trigger
  BEFORE INSERT ON public.order_templates
  FOR EACH ROW
  WHEN (NEW.alias IS NULL OR NEW.alias = '')
  EXECUTE FUNCTION set_order_template_alias();

-- Update existing records to have aliases
UPDATE public.canteens 
SET alias = generate_alias_from_name(name) || '-' || substring(replace(id::text, '-', '') from 1 for 8)
WHERE alias IS NULL OR alias = '';

UPDATE public.items i
SET alias = generate_alias_from_name(
  COALESCE((SELECT alias FROM public.canteens WHERE id = i.canteen_id), 'item') || '-' || i.name
) || '-' || substring(replace(i.id::text, '-', '') from 1 for 8)
WHERE alias IS NULL OR alias = '';

UPDATE public.order_templates ot
SET alias = generate_alias_from_name(
  COALESCE((SELECT alias FROM public.canteens WHERE id = ot.canteen_id), 'template') || '-' || ot.name
) || '-' || substring(replace(ot.id::text, '-', '') from 1 for 8)
WHERE alias IS NULL OR alias = '';

