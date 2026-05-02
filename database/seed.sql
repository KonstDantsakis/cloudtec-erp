-- Demo seed data for two separate companies.
insert into companies (id, name, tax_number) values
('11111111-1111-1111-1111-111111111111', 'Acropolis Foods', 'GR123456789'),
('22222222-2222-2222-2222-222222222222', 'Ionian Services', 'GR987654321');

-- Users table maps to auth.users IDs from Supabase Auth.
insert into users (id, company_id, full_name, email, role) values
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', null, 'Global Admin', 'super@erp.local', 'super_admin'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'Company A Admin', 'admin@acropolis.local', 'company_admin'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222222', 'Company B Employee', 'employee@ionian.local', 'employee');

insert into customers (company_id, name, email, phone, address, tax_number, notes) values
('11111111-1111-1111-1111-111111111111', 'Aegean Market', 'contact@aegean.example', '+30-210000001', 'Athens', 'EL100200300', 'Priority customer'),
('22222222-2222-2222-2222-222222222222', 'Corfu Traders', 'sales@corfu.example', '+30-266100111', 'Corfu', 'EL400500600', 'Seasonal business');

insert into products (company_id, name, type, price, vat_rate, stock_quantity, description) values
('11111111-1111-1111-1111-111111111111', 'Olive Oil 1L', 'product', 12.00, 13, 150, 'Premium extra virgin olive oil'),
('11111111-1111-1111-1111-111111111111', 'Consulting Hour', 'service', 45.00, 24, 0, 'Business advisory service'),
('22222222-2222-2222-2222-222222222222', 'Maintenance Package', 'service', 120.00, 24, 0, 'Monthly maintenance plan');

insert into expenses (company_id, supplier, category, amount, vat, date, notes) values
('11111111-1111-1111-1111-111111111111', 'OfficeRent SA', 'Rent', 900.00, 24, current_date, 'Main office'),
('22222222-2222-2222-2222-222222222222', 'Power Utility', 'Utilities', 230.00, 24, current_date, 'Electricity bill');

insert into tasks (company_id, title, description, status, due_date) values
('11111111-1111-1111-1111-111111111111', 'Call overdue customers', 'Follow up by email and phone', 'pending', current_date + 3),
('22222222-2222-2222-2222-222222222222', 'Review stock valuation', 'Prepare monthly inventory report', 'in_progress', current_date + 5);
