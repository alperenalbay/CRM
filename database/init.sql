-- Referans betik: veritabanını SQL Server Management Studio (SSMS) üzerinden manuel kurmak için.
-- Docker ile kurulumda backend ayağa kalkarken veritabanını otomatik oluşturur (app/scripts/create_database.py).

IF DB_ID(N'CRM') IS NULL
BEGIN
    CREATE DATABASE [CRM] COLLATE Turkish_CI_AS;
END
GO
USE [CRM];
GO
-- Tablolar Alembic tarafından oluşturulur: `alembic upgrade head`
