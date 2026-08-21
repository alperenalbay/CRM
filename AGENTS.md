# AGENTS.md

Bu dosya, CRM/ERP monoreposu içinde çalışan tüm agent'lar için yol göstericidir.

## Proje Yapısı

- `frontend/` — React 19 + Vite + TypeScript + Ant Design (React Router, TanStack Query, Zustand, Axios)
- `backend/` — FastAPI + SQLAlchemy 2.0 + Pydantic v2 + Alembic (SQL Server, pyodbc)
- `database/` — SQL Server referans betikleri ve seed verileri
- `docker-compose.yml` — db (SQL Server 2022), backend, frontend (nginx)

## Komutlar

Frontend (`frontend/`):
- `npm run dev` — geliştirme sunucusu (port 5173, `/api` → `localhost:8000` proxy)
- `npm run build` — typecheck (tsc -b) + production build
- `npm run lint` — oxlint

Backend (`backend/`):
- `.venv\Scripts\python.exe -m uvicorn app.main:app --reload` — geliştirme sunucusu (port 8000)
- `.venv\Scripts\python.exe -m pytest` — testler
- `.venv\Scripts\python.exe -m alembic revision --autogenerate -m "mesaj"` — yeni migrasyon
- `.venv\Scripts\python.exe -m alembic upgrade head` — migrasyon uygula
- `.venv\Scripts\python.exe -m app.scripts.create_database` — SQL Server'da veritabanını oluştur

Tümü (kök):
- `docker compose up --build` — tam yığını ayağa kaldırır (SQL Server 1433, backend 8000, frontend 8080)

## Kod Kuralları

- Kod İngilizce yazılır; değişken/sınıf/veritabanı adları İngilizce ve tutarlı olur.
- SQLAlchemy modelleri `backend/app/models/`, Pydantic şemaları `backend/app/schemas/`, iş mantığı `backend/app/services/`, router'lar `backend/app/api/v1/` altında tutulur.
- ORM modelleri API yanıtı olarak doğrudan döndürülmez; daima Pydantic şemasına dönüştürülür.
- Silme işlemleri hard-delete yerine soft-delete (`is_active`) olarak yapılır.
- Tablolarda `created_at` / `updated_at` zorunludur.
- Frontend bileşenleri `frontend/src/features/<modul>/` altında modülerdir; ortak bileşenler `frontend/src/components/ui/` altındadır.
- Açık kayıtların sekmeleri `frontend/src/stores/tabs.ts` (Zustand) üzerinden yönetilir; bu store'a dokunulmadan kırılmaz.
- İsteğe bağlı yorum Türkçe değil İngilizce olur; gereksiz yorum eklenmez.
