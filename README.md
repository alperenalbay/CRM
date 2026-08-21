<div align="center">

# CRM/ERP

**Modern, tam yığın (full-stack) Müşteri İlişkileri Yönetimi ve Kurumsal Kaynak Planlama Sistemi**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white&labelColor=20232a)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![SQL Server](https://img.shields.io/badge/SQL%20Server-2022-CC2927?logo=microsoftsqlserver&logoColor=white)](https://www.microsoft.com/sql-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[GitHub Deposu](https://github.com/alperenalbay/CRM.git) · [Hata Bildir](https://github.com/alperenalbay/CRM/issues)

</div>

---

## 📖 Hakkında

**CRM/ERP**, müşteri ilişkileri yönetimi ve kurumsal kaynak planlamasını tek bir platformda birleştiren, modern web teknolojileriyle geliştirilmiş açık kaynaklı bir **tam yığın uygulamadır**. Proje; müşteri yönetimi, satış süreçleri, görev takibi ve destek (ticket) operasyonlarını tek çatı altında toplar.

Proje **5 geliştirme fazının (Faz 0–5) tamamı tamamlanarak** üretime hazır hale getirilmiştir:

| Faz | Kapsam | Durum |
|-----|--------|-------|
| Faz 0 | Proje altyapısı, ortam kurulumu, CI/CD | ✅ Tamamlandı |
| Faz 1 | Kimlik doğrulama, RBAC, kullanıcı yönetimi | ✅ Tamamlandı |
| Faz 2 | Müşteri yönetimi, otomatik doldurma, geçmiş paneli | ✅ Tamamlandı |
| Faz 3 | Ticket sistemi, transfer ve durum yönetimi | ✅ Tamamlandı |
| Faz 4 | Kanban görev panosu, satış ve sipariş modülleri | ✅ Tamamlandı |
| Faz 5 | Dashboard, CSV içe aktarma, üretim dağıtımı | ✅ Tamamlandı |

## ✨ Özellikler

- 👥 **Müşteri Yönetimi** — Otomatik doldurma (auto-fill) ile hızlı müşteri kaydı
- 🕘 **Geçmiş Paneli (History Panel)** — Tüm müşteri etkileşimlerinin zaman çizelgesi görünümü
- 🗂️ **Sekme Desteği (Tab Support)** — Aynı anda birden fazla kayıt üzerinde çalışma imkânı
- 🎫 **Ticket Sistemi** — Destek talepleri için aktarım (transfer) ve durum (status) yönetimi
- 📋 **Kanban Görev Panosu** — Sürükle-bırak görev yönetimi
- 💰 **Satış ve Siparişler** — Uçtan uca satış süreci takibi
- 📊 **Dashboard** — Gerçek zamanlı özet metrikler ve grafikler
- 📥 **CSV İçe Aktarma** — Toplu veri taşıma desteği
- 🔐 **RBAC Yetkilendirme** — Rol tabanlı erişim kontrolü
- 🪙 **JWT Kimlik Doğrulama** — Güvenli token tabanlı oturum yönetimi

## 🛠️ Teknoloji Yığını

### Frontend

| Teknoloji | Amaç |
|-----------|------|
| [React 19](https://react.dev/) | Kullanıcı arayüzü |
| [Vite 8](https://vitejs.dev/) | Geliştirme sunucusu ve derleme |
| [TypeScript 6](https://www.typescriptlang.org/) | Tip güvenliği |
| [Ant Design 6](https://ant.design/) | Bileşen kütüphanesi |
| [TanStack Query](https://tanstack.com/query) | Sunucu durumu yönetimi |
| [Zustand](https://zustand.docs.pmnd.rs/) | İstemci durumu yönetimi |
| [React Router](https://reactrouter.com/) | Sayfa yönlendirme |
| [Axios](https://axios-http.com/) | HTTP istemcisi |

### Backend

| Teknoloji | Amaç |
|-----------|------|
| [FastAPI](https://fastapi.tiangolo.com/) | Web API çerçevesi |
| [SQLAlchemy 2.0](https://www.sqlalchemy.org/) | ORM |
| [Pydantic v2](https://docs.pydantic.dev/) | Veri doğrulama |
| [Alembic](https://alembic.sqlalchemy.org/) | Veritabanı migrasyonları |
| [SQL Server 2022](https://www.microsoft.com/sql-server) | İlişkisel veritabanı |

### DevOps

- 🐳 **Docker Compose** — Çok kapsayıcılı dağıtım
- 🔀 **Caddy** — Ters proxy (reverse proxy) ve otomatik HTTPS
- ⚙️ **GitHub Actions** — Sürekli entegrasyon / sürekli dağıtım (CI/CD)

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Python 3.11+
- Node.js 20+
- SQL Server 2022 (veya erişilebilir bir örnek)

### Backend Kurulumu

```bash
git clone https://github.com/alperenalbay/CRM.git
cd CRM/backend

python -m venv .venv
# Windows
.venv\Scripts\activate
# Linux / macOS
source .venv/bin/activate

pip install -r requirements.txt

# Ortam değişkenlerini ayarlayın
cp .env.example .env

# Veritabanı migrasyonlarını çalıştırın
alembic upgrade head

# Geliştirme sunucusunu başlatın
uvicorn app.main:app --reload --port 8000
```

API dokümantasyonu: <http://localhost:8000/docs>

### Frontend Kurulumu

```bash
cd frontend
npm install
npm run dev
```

Uygulama: <http://localhost:5173>

### Varsayılan Giriş Bilgileri

> ⚠️ **ÖNEMLİ:** Bu bilgiler yalnızca geliştirme amaçlıdır. Üretim ortamında **kesinlikle değiştirilmelidir!**

```
Kullanıcı adı: admin
Şifre:         admin123
```

## 🐳 Docker

Tüm sistemi tek komutla ayağa kaldırın:

```bash
docker compose up --build
```

| Servis | Adres / Port |
|--------|--------------|
| Frontend | <http://localhost:8080> |
| Backend API | <http://localhost:8000> |
| SQL Server | `localhost:1433` |

Servisleri durdurmak için:

```bash
docker compose down
```

## 📁 Proje Yapısı

```
CRM/
├── backend/               # FastAPI uygulaması
│   ├── app/
│   │   ├── api/           # API uç noktaları (router'lar)
│   │   ├── core/          # Yapılandırma, güvenlik, JWT
│   │   ├── models/        # SQLAlchemy modelleri
│   │   ├── schemas/       # Pydantic şemaları
│   │   └── services/      # İş mantığı servisleri
│   ├── alembic/           # Veritabanı migrasyonları
│   └── tests/             # pytest testleri
├── frontend/              # React + Vite uygulaması
│   ├── src/
│   │   ├── components/    # Yeniden kullanılabilir bileşenler
│   │   ├── pages/         # Sayfa bileşenleri
│   │   ├── stores/        # Zustand store'ları
│   │   ├── hooks/         # Özel React hook'ları
│   │   └── api/           # Axios istemci katmanı
│   └── e2e/               # Playwright E2E testleri
├── scripts/               # Dağıtım ve yedekleme betikleri
│   ├── deploy.sh          # Dağıtım betiği
│   └── backup.sh          # Yedekleme betiği
├── .github/workflows/     # GitHub Actions CI/CD
├── docker-compose.yml     # Docker Compose yapılandırması
├── Caddyfile              # Caddy ters proxy yapılandırması
├── AGENTS.md              # AI ajan rehberi
└── README.md
```

## 🔌 API Uçları (Özet)

| Metot | Uç Noktası | Açıklama |
|-------|------------|----------|
| `POST` | `/api/auth/login` | Giriş yap, JWT token al |
| `GET` | `/api/customers` | Müşteri listesi (sayfalama, filtreleme) |
| `POST` | `/api/customers` | Yeni müşteri oluştur |
| `GET` | `/api/customers/{id}/history` | Müşteri geçmiş kayıtları |
| `GET` | `/api/tickets` | Ticket listesi |
| `POST` | `/api/tickets/{id}/transfer` | Ticket'ı başka kullanıcıya aktar |
| `PATCH` | `/api/tickets/{id}/status` | Ticket durumu güncelle |
| `GET/POST` | `/api/tasks` | Kanban görevleri |
| `GET/POST` | `/api/orders` | Satış ve sipariş işlemleri |
| `POST` | `/api/import/csv` | CSV içe aktarma |
| `GET` | `/api/dashboard/stats` | Dashboard özet metrikleri |

Tam ve interaktif API dokümantasyonu için: <http://localhost:8000/docs> (Swagger UI)

## 🔒 Güvenlik

- **JWT tabanlı kimlik doğrulama** — Kısa ömürlü access token + refresh token
- **RBAC (Rol Tabanlı Erişim Kontrolü)** — Kullanıcı rollerine göre uç nokta bazlı yetkilendirme
- **Şifre hash'leme** — Güvenli parola saklama (bcrypt)
- **Pydantic doğrulama** — Tüm giriş verilerinin şema bazlı doğrulanması
- **Caddy ile otomatik HTTPS** — Üretimde uçtan uca şifreleme

> ⚠️ Üretim dağıtımı öncesinde mutlaka varsayılan `admin/admin123` kimlik bilgilerini değiştirin, güçlü bir `SECRET_KEY` tanımlayın ve `.env` dosyasını asla depoya commit etmeyin.

## 🧪 Testler

### Backend (pytest)

```bash
cd backend
pytest
```

### Frontend E2E (Playwright)

```bash
cd frontend
npx playwright install
npx playwright test
```

Her push ve pull request üzerinde **GitHub Actions** pipeline'ı testleri otomatik olarak çalıştırır.

## 📦 Üretim Dağıtımı

1. Sunucuda depoyu klonlayın:
   ```bash
   git clone https://github.com/alperenalbay/CRM.git
   cd CRM
   ```
2. Üretim ortam değişkenlerini yapılandırın (`.env.production`)
3. Dağıtım betiğini çalıştırın:
   ```bash
   ./scripts/deploy.sh
   ```
4. Düzenli yedekleme için cron job oluşturun:
   ```bash
   ./scripts/backup.sh
   ```

Caddy, alan adınız için **otomatik SSL/TLS sertifikası** sağlar.

## 🤝 Katkı Sağlama

Katkılarınız memnuniyetle karşılanır!

1. Depoyu fork'layın
2. Özellik dalınızı oluşturun (`git checkout -b feature/harika-ozellik`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: harika özellik eklendi'`)
4. Dalınızı push edin (`git push origin feature/harika-ozellik`)
5. Bir Pull Request açın

> 🤖 AI ajanları ve kod asistanları için geliştirme kuralları [`AGENTS.md`](AGENTS.md) dosyasında tanımlanmıştır.

## 📄 Lisans

Bu proje **MIT Lisansı** altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

---

<div align="center">

⭐ Projeyi faydalı bulduysanız yıldız vermeyi unutmayın!

</div>
