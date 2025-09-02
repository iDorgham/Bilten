-- Event and Ticket Management Functions and Triggers
-- Task 2.2: Supporting functions for event and ticket management

-- Function to generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    order_num VARCHAR(50);
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate order number: ORD-YYYYMMDD-XXXXXX
        order_num := 'ORD-' || to_char(NOW(), 'YYYYMMDD') || '-' || 
                     LPAD(floor(random() * 999999)::text, 6, '0');
        
        -- Check if it already exists
        SELECT EXISTS(SELECT 1 FROM tickets.orders WHERE order_number = order_num) INTO exists_check;
        
        -- If unique, exit loop
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate unique ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    ticket_num VARCHAR(50);
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate ticket number: TKT-YYYYMMDD-XXXXXXXXXX
        ticket_num := 'TKT-' || to_char(NOW(), 'YYYYMMDD') || '-' || 
                      LPAD(floor(random() * 9999999999)::text, 10, '0');
        
        -- Check if it already exists
        SELECT EXISTS(SELECT 1 FROM tickets.tickets WHERE ticket_number = ticket_num) INTO exists_check;
        
        -- If unique, exit loop
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN ticket_num;
END;
$$ LANGUAGE plpgsql;

-- Function to update live metrics when tickets are sold
CREATE OR REPLACE FUNCTION update_live_metrics()
RETURNS TRIGGER AS $$
DECLARE
    event_uuid UUID;
    total_sold INTEGER;
    total_available INTEGER;
    total_revenue DECIMAL(10,2);
BEGIN
    -- Get event_id from the ticket
    IF TG_TABLE_NAME = 'tickets' THEN
        event_uuid := COALESCE(NEW.event_id, OLD.event_id);
    ELSIF TG_TABLE_NAME = 'orders' THEN
        event_uuid := COALESCE(NEW.event_id, OLD.event_id);
    END IF;

    -- Calculate current metrics
    SELECT 
        COALESCE(SUM(tt.sold), 0),
        COALESCE(SUM(tt.quantity - tt.sold - tt.reserved), 0),
        COALESCE(SUM(o.total_amount), 0)
    INTO total_sold, total_available, total_revenue
    FROM tickets.ticket_types tt
    LEFT JOIN tickets.orders o ON o.event_id = tt.event_id AND o.status = 'confirmed'
    WHERE tt.event_id = event_uuid;

    -- Update or insert live metrics
    INSERT INTO events.live_metrics (
        event_id, 
        tickets_sold, 
        tickets_available, 
        revenue_total,
        last_updated
    ) VALUES (
        event_uuid, 
        total_sold, 
        total_available, 
        total_revenue,
        NOW()
    )
    ON CONFLICT (event_id) DO UPDATE SET
        tickets_sold = EXCLUDED.tickets_sold,
        tickets_available = EXCLUDED.tickets_available,
        revenue_total = EXCLUDED.revenue_total,
        last_updated = NOW();

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to validate ticket availability before purchase
CREATE OR REPLACE FUNCTION check_ticket_availability(
    p_ticket_type_id UUID,
    p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    available_count INTEGER;
BEGIN
    SELECT (quantity - sold - reserved) 
    INTO available_count
    FROM tickets.ticket_types
    WHERE id = p_ticket_type_id;

    RETURN available_count >= p_quantity;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve tickets temporarily during checkout
CREATE OR REPLACE FUNCTION reserve_tickets(
    p_ticket_type_id UUID,
    p_quantity INTEGER,
    p_reservation_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN AS $$
DECLARE
    available_count INTEGER;
BEGIN
    -- Check availability
    SELECT (quantity - sold - reserved) 
    INTO available_count
    FROM tickets.ticket_types
    WHERE id = p_ticket_type_id;

    IF available_count >= p_quantity THEN
        -- Reserve the tickets
        UPDATE tickets.ticket_types
        SET reserved = reserved + p_quantity
        WHERE id = p_ticket_type_id;
        
        -- Schedule unreservation (this would typically be handled by a background job)
        -- For now, we'll just return success
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to confirm ticket purchase
CREATE OR REPLACE FUNCTION confirm_ticket_purchase(
    p_order_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    order_rec RECORD;
    item_rec RECORD;
    ticket_uuid UUID;
BEGIN
    -- Get order details
    SELECT * INTO order_rec
    FROM tickets.orders
    WHERE id = p_order_id AND status = 'pending';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Process each order item
    FOR item_rec IN 
        SELECT * FROM tickets.order_items 
        WHERE order_id = p_order_id
    LOOP
        -- Create individual tickets
        FOR i IN 1..item_rec.quantity LOOP
            INSERT INTO tickets.tickets (
                ticket_type_id,
                event_id,
                buyer_id,
                order_id,
                ticket_number,
                price,
                currency,
                status,
                metadata
            ) VALUES (
                item_rec.ticket_type_id,
                order_rec.event_id,
                order_rec.buyer_id,
                p_order_id,
                generate_ticket_number(),
                item_rec.unit_price,
                item_rec.currency,
                'sold',
                jsonb_build_object('attendee_info', item_rec.attendee_info)
            ) RETURNING id INTO ticket_uuid;

            -- Update order item with ticket reference
            UPDATE tickets.order_items
            SET ticket_id = ticket_uuid
            WHERE id = item_rec.id;
        END LOOP;

        -- Update ticket type sold count and reduce reserved
        UPDATE tickets.ticket_types
        SET sold = sold + item_rec.quantity,
            reserved = GREATEST(0, reserved - item_rec.quantity)
        WHERE id = item_rec.ticket_type_id;
    END LOOP;

    -- Update order status
    UPDATE tickets.orders
    SET status = 'confirmed',
        confirmed_at = NOW()
    WHERE id = p_order_id;

    -- Record analytics event
    INSERT INTO events.event_analytics (
        event_id,
        metric_name,
        metric_value,
        metric_type,
        dimensions
    ) VALUES (
        order_rec.event_id,
        'ticket_purchase',
        order_rec.total_amount,
        'counter',
        jsonb_build_object('order_id', p_order_id, 'buyer_id', order_rec.buyer_id)
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to process check-in
CREATE OR REPLACE FUNCTION process_check_in(
    p_ticket_id UUID,
    p_checked_in_by UUID DEFAULT NULL,
    p_check_in_method VARCHAR(50) DEFAULT 'qr_code',
    p_location VARCHAR(255) DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    ticket_rec RECORD;
    existing_checkin UUID;
BEGIN
    -- Get ticket details
    SELECT t.*, e.id as event_id, e.title as event_title
    INTO ticket_rec
    FROM tickets.tickets t
    JOIN events.events e ON t.event_id = e.id
    WHERE t.id = p_ticket_id AND t.status = 'sold';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check if already checked in
    SELECT id INTO existing_checkin
    FROM events.check_ins
    WHERE ticket_id = p_ticket_id;

    IF existing_checkin IS NOT NULL THEN
        RETURN FALSE; -- Already checked in
    END IF;

    -- Create check-in record
    INSERT INTO events.check_ins (
        event_id,
        ticket_id,
        attendee_name,
        attendee_email,
        check_in_method,
        check_in_location,
        checked_in_by
    ) VALUES (
        ticket_rec.event_id,
        p_ticket_id,
        ticket_rec.metadata->>'attendee_name',
        ticket_rec.metadata->>'attendee_email',
        p_check_in_method,
        p_location,
        p_checked_in_by
    );

    -- Update live metrics
    UPDATE events.live_metrics
    SET check_in_count = check_in_count + 1,
        last_updated = NOW()
    WHERE event_id = ticket_rec.event_id;

    -- Record analytics
    INSERT INTO events.event_analytics (
        event_id,
        metric_name,
        metric_value,
        metric_type,
        dimensions
    ) VALUES (
        ticket_rec.event_id,
        'check_in',
        1,
        'counter',
        jsonb_build_object('ticket_id', p_ticket_id, 'method', p_check_in_method)
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate event statistics
CREATE OR REPLACE FUNCTION get_event_statistics(p_event_id UUID)
RETURNS TABLE (
    total_tickets INTEGER,
    sold_tickets INTEGER,
    available_tickets INTEGER,
    reserved_tickets INTEGER,
    total_revenue DECIMAL(10,2),
    check_in_count INTEGER,
    check_in_rate DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(tt.quantity), 0)::INTEGER as total_tickets,
        COALESCE(SUM(tt.sold), 0)::INTEGER as sold_tickets,
        COALESCE(SUM(tt.quantity - tt.sold - tt.reserved), 0)::INTEGER as available_tickets,
        COALESCE(SUM(tt.reserved), 0)::INTEGER as reserved_tickets,
        COALESCE(SUM(o.total_amount), 0) as total_revenue,
        COALESCE(lm.check_in_count, 0)::INTEGER as check_in_count,
        CASE 
            WHEN COALESCE(SUM(tt.sold), 0) > 0 THEN 
                (COALESCE(lm.check_in_count, 0)::DECIMAL / SUM(tt.sold) * 100)
            ELSE 0 
        END as check_in_rate
    FROM tickets.ticket_types tt
    LEFT JOIN tickets.orders o ON o.event_id = tt.event_id AND o.status = 'confirmed'
    LEFT JOIN events.live_metrics lm ON lm.event_id = tt.event_id
    WHERE tt.event_id = p_event_id;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired reservations
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
    cleanup_count INTEGER := 0;
BEGIN
    -- This would typically be called by a background job
    -- For now, we'll implement basic cleanup logic
    
    -- Cancel pending orders older than 30 minutes
    UPDATE tickets.orders
    SET status = 'cancelled',
        cancelled_at = NOW()
    WHERE status = 'pending' 
    AND created_at < NOW() - INTERVAL '30 minutes';

    GET DIAGNOSTICS cleanup_count = ROW_COUNT;

    -- Reset reservations for cancelled orders
    UPDATE tickets.ticket_types tt
    SET reserved = GREATEST(0, reserved - COALESCE(
        (SELECT SUM(oi.quantity) 
         FROM tickets.order_items oi 
         JOIN tickets.orders o ON oi.order_id = o.id
         WHERE oi.ticket_type_id = tt.id 
         AND o.status = 'cancelled' 
         AND o.cancelled_at > NOW() - INTERVAL '1 hour'), 0
    ));

    RETURN cleanup_count;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER trigger_event_details_updated_at
    BEFORE UPDATE ON events.event_details
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_event_media_updated_at
    BEFORE UPDATE ON events.event_media
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_event_schedule_updated_at
    BEFORE UPDATE ON events.event_schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_event_speakers_updated_at
    BEFORE UPDATE ON events.event_speakers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ticket_configurations_updated_at
    BEFORE UPDATE ON tickets.ticket_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pricing_tiers_updated_at
    BEFORE UPDATE ON tickets.pricing_tiers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_discount_codes_updated_at
    BEFORE UPDATE ON tickets.discount_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON tickets.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_order_items_updated_at
    BEFORE UPDATE ON tickets.order_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_refund_requests_updated_at
    BEFORE UPDATE ON tickets.refund_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_event_feedback_updated_at
    BEFORE UPDATE ON events.event_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create triggers for live metrics updates
CREATE TRIGGER trigger_tickets_live_metrics
    AFTER INSERT OR UPDATE OR DELETE ON tickets.tickets
    FOR EACH ROW EXECUTE FUNCTION update_live_metrics();

CREATE TRIGGER trigger_orders_live_metrics
    AFTER INSERT OR UPDATE OR DELETE ON tickets.orders
    FOR EACH ROW EXECUTE FUNCTION update_live_metrics();

-- Automatically set order number on insert
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_orders_set_number
    BEFORE INSERT ON tickets.orders
    FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- Automatically set ticket number on insert
CREATE OR REPLACE FUNCTION set_ticket_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.ticket_number IS NULL THEN
        NEW.ticket_number := generate_ticket_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tickets_set_number
    BEFORE INSERT ON tickets.tickets
    FOR EACH ROW EXECUTE FUNCTION set_ticket_number();