CREATE TABLE accommodations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    tipo TEXT NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guest_name TEXT NOT NULL,
    document TEXT,
    phone TEXT,
    email TEXT,
    vehicle_plate TEXT,
    accommodation_id UUID NOT NULL REFERENCES accommodations(id) ON DELETE CASCADE,
    check_in DATE NOT NULL,
    check_out DATE NOT NULL,
    total_value DECIMAL(10,2) NOT NULL,
    notes TEXT,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE settings (
    id INT PRIMARY KEY DEFAULT 1,
    inn_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    address TEXT NOT NULL,
    default_checkin_time TEXT NOT NULL,
    default_checkout_time TEXT NOT NULL
);

-- Insert default settings
INSERT INTO settings (id, inn_name, phone, whatsapp, address, default_checkin_time, default_checkout_time)
VALUES (1, 'Pousada Paraíso', '(00) 0000-0000', '(00) 90000-0000', 'Rua das Flores, 123', '14:00', '12:00');
;
