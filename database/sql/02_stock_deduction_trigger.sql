-- ============================================================================
-- 02_stock_deduction_trigger.sql
-- Automatic stock subtraction and replenishment triggers
-- Ensures available stock decreases and sold count increases on each sale
-- ============================================================================

-- Function: Deduct stock when an item is ordered
CREATE OR REPLACE FUNCTION deduct_product_stock_on_order()
RETURNS TRIGGER AS $$
DECLARE
    current_stock NUMERIC(10, 2);
    prod_name VARCHAR(255);
BEGIN
    -- Check if product_id is associated
    IF NEW.product_id IS NOT NULL THEN
        -- Lock product row for update to prevent race conditions
        SELECT available_stock, name INTO current_stock, prod_name
        FROM products
        WHERE id = NEW.product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product with ID % not found', NEW.product_id;
        END IF;

        -- Validate stock availability
        IF current_stock < NEW.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product "%": requested %, available %', 
                prod_name, NEW.quantity, current_stock;
        END IF;

        -- Deduct stock and increment sold_count
        UPDATE products
        SET 
            available_stock = available_stock - NEW.quantity,
            sold_count = sold_count + NEW.quantity,
            is_available = CASE 
                WHEN (available_stock - NEW.quantity) <= 0 THEN FALSE 
                ELSE is_available 
            END,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Execute deduction AFTER INSERT on order_items
DROP TRIGGER IF EXISTS trigger_deduct_stock ON order_items;
CREATE TRIGGER trigger_deduct_stock
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION deduct_product_stock_on_order();

-- Function: Replenish stock when an order is cancelled or order_item deleted
CREATE OR REPLACE FUNCTION replenish_product_stock_on_cancel()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.product_id IS NOT NULL THEN
        UPDATE products
        SET 
            available_stock = available_stock + OLD.quantity,
            sold_count = GREATEST(0, sold_count - OLD.quantity),
            is_available = TRUE,
            updated_at = NOW()
        WHERE id = OLD.product_id;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Execute replenishment AFTER DELETE on order_items
DROP TRIGGER IF EXISTS trigger_replenish_stock ON order_items;
CREATE TRIGGER trigger_replenish_stock
AFTER DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION replenish_product_stock_on_cancel();
