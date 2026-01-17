-- PostgreSQL LISTEN/NOTIFY trigger for real-time inventory updates
-- Run this script against your PostgreSQL database to enable real-time notifications

-- Create function to send notifications on inventory changes
CREATE OR REPLACE FUNCTION notify_inventory_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSON;
BEGIN
  -- Build payload based on operation type
  IF (TG_OP = 'DELETE') THEN
    payload = json_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'id', OLD.id,
      'timestamp', CURRENT_TIMESTAMP
    );
  ELSE
    payload = json_build_object(
      'operation', TG_OP,
      'table', TG_TABLE_NAME,
      'id', NEW.id,
      'itemName', NEW.item_name,
      'vendorName', NEW.vendor_name,
      'timestamp', CURRENT_TIMESTAMP
    );
  END IF;

  -- Send notification to 'inventory_changes' channel
  PERFORM pg_notify('inventory_changes', payload::text);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS inventory_notify_trigger ON inventory_items;

-- Create trigger for INSERT, UPDATE, DELETE operations
CREATE TRIGGER inventory_notify_trigger
AFTER INSERT OR UPDATE OR DELETE ON inventory_items
FOR EACH ROW EXECUTE FUNCTION notify_inventory_change();

-- Verify the trigger was created
SELECT
  trigger_name,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'inventory_notify_trigger';
