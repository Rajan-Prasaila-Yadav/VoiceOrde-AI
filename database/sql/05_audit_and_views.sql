-- ============================================================================
-- 05_audit_and_views.sql
-- Stock Audit Logging & Dashboard Analytical Views
-- ============================================================================

-- Stock Movements Audit Table
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    change_type VARCHAR(50) NOT NULL, -- 'SALE', 'RESTOCK', 'ADJUSTMENT', 'CANCELLATION'
    quantity_changed NUMERIC(10, 2) NOT NULL,
    previous_stock NUMERIC(10, 2) NOT NULL,
    new_stock NUMERIC(10, 2) NOT NULL,
    reference_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger to log every stock change
CREATE OR REPLACE FUNCTION log_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.available_stock IS DISTINCT FROM NEW.available_stock THEN
        INSERT INTO stock_movements (
            product_id,
            change_type,
            quantity_changed,
            previous_stock,
            new_stock,
            notes
        ) VALUES (
            NEW.id,
            CASE 
                WHEN NEW.available_stock < OLD.available_stock THEN 'SALE'
                ELSE 'RESTOCK'
            END,
            NEW.available_stock - OLD.available_stock,
            OLD.available_stock,
            NEW.available_stock,
            'Automated stock update'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_stock ON products;
CREATE TRIGGER trigger_log_stock
AFTER UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION log_stock_movement();

-- Convenient view for daily dashboard stats
CREATE OR REPLACE VIEW view_today_dashboard AS
SELECT 
    o.shop_id,
    COUNT(o.id) AS total_orders,
    COALESCE(SUM(o.total_amount), 0) AS total_sales,
    COALESCE(SUM(CASE WHEN o.payment_status = 'UNPAID' THEN o.total_amount ELSE 0 END), 0) AS unpaid_amount,
    COALESCE(COUNT(CASE WHEN o.status = 'PACKING' THEN 1 END), 0) AS to_pack_count
FROM orders o
WHERE DATE(o.created_at) = CURRENT_DATE
GROUP BY o.shop_id;
