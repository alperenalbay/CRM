USE [CRM];
GO

IF NOT EXISTS (SELECT 1 FROM roles WHERE code = N'admin')
    INSERT INTO roles (code, name) VALUES (N'admin', N'Yönetici');
GO

IF NOT EXISTS (SELECT 1 FROM roles WHERE code = N'support')
    INSERT INTO roles (code, name) VALUES (N'support', N'Teknik Destek');
GO

IF NOT EXISTS (SELECT 1 FROM roles WHERE code = N'sales')
    INSERT INTO roles (code, name) VALUES (N'sales', N'Satış');
GO
