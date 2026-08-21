import os

from sqlalchemy import select

from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.permission import Permission, PermissionGroup
from app.models.sales import Product
from app.models.user import Role, User
from app.models.workflow import WorkflowState

DEFAULT_ADMIN_USERNAME = "admin"
DEFAULT_ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "admin123")

ROLE_SEED: list[tuple[str, str]] = [
    ("admin", "Yönetici"),
    ("support", "Teknik Destek"),
    ("sales", "Satış"),
]

WORKFLOW_SEED: list[tuple[str, str, str, str, int, bool]] = [
    ("ticket_open", "Açık", "blue", "ticket", 10, True),
    ("ticket_in_progress", "Çalışılıyor", "orange", "ticket", 20, False),
    ("ticket_waiting", "Bekliyor", "gold", "ticket", 30, False),
    ("ticket_closed", "Kapalı", "green", "ticket", 40, False),
    ("task_todo", "Yapılacak", "default", "task", 10, True),
    ("task_in_progress", "Devam Ediyor", "processing", "task", 20, False),
    ("task_done", "Tamamlandı", "success", "task", 30, False),
]

PRODUCT_SEED: list[tuple[str, str, float, float, str]] = [
    ("PRD-00001", "Yazılım Lisansı", 45000.00, 20, "adet"),
    ("PRD-00002", "Bakım / Destek Sözleşmesi", 12000.00, 20, "adet"),
    ("PRD-00003", "Kurulum Hizmeti", 8500.00, 20, "saat"),
    ("PRD-00004", "Eğitim (Günlük)", 5000.00, 20, "gün"),
    ("PRD-00005", "Özel Geliştirme (Saat)", 1500.00, 20, "saat"),
]

PERMISSION_SEED: list[tuple[str, str, str]] = [
    ("dashboard.view", "Panel Görüntüle", "panel"),
    ("customers.view", "Müşterileri Görüntüle", "musteriler"),
    ("customers.create", "Müşteri Ekle", "musteriler"),
    ("customers.update", "Müşteri Düzenle", "musteriler"),
    ("customers.delete", "Müşteri Sil", "musteriler"),
    ("tickets.view", "Destek Kayıtlarını Görüntüle", "destek"),
    ("tickets.create", "Destek Kaydı Ekle", "destek"),
    ("tickets.update", "Destek Kaydı Düzenle", "destek"),
    ("tickets.delete", "Destek Kaydı Sil", "destek"),
    ("tickets.change_status", "Destek Durumunu Değiştir", "destek"),
    ("tickets.transfer", "Destek Kaydını Devret", "destek"),
    ("tasks.view", "Görevleri Görüntüle", "gorevler"),
    ("tasks.create", "Görev Ekle", "gorevler"),
    ("tasks.update", "Görev Düzenle", "gorevler"),
    ("tasks.delete", "Görev Sil", "gorevler"),
    ("tasks.change_status", "Görev Durumunu Değiştir", "gorevler"),
    ("tasks.assign", "Görev Ata", "gorevler"),
    ("sales.view", "Satışları Görüntüle", "satis"),
    ("sales.create", "Satış Ekle", "satis"),
    ("sales.update", "Satış Düzenle", "satis"),
    ("sales.delete", "Satış Sil", "satis"),
    ("products.view", "Ürünleri Görüntüle", "satis"),
    ("products.create", "Ürün Ekle", "satis"),
    ("products.update", "Ürün Düzenle", "satis"),
    ("imports.view", "Import Geçmişini Görüntüle", "aktarim"),
    ("imports.preview", "Import Önizle", "aktarim"),
    ("imports.run", "Import Çalıştır", "aktarim"),
    ("users.view", "Kullanıcıları Görüntüle", "yonetim"),
    ("users.create", "Kullanıcı Ekle", "yonetim"),
    ("users.update", "Kullanıcı Düzenle", "yonetim"),
    ("users.deactivate", "Kullanıcı Pasifleştir", "yonetim"),
    ("groups.view", "Yetki Gruplarını Görüntüle", "yonetim"),
    ("groups.manage", "Yetki Gruplarını Yönet", "yonetim"),
]

DEFAULT_GROUPS: list[dict] = [
    {
        "code": "satis_temsilcisi",
        "name": "Satış Temsilcisi",
        "description": "Müşteri ve satış işlemleri yapabilen kullanıcılar",
        "permissions": [
            "dashboard.view",
            "customers.view",
            "customers.create",
            "customers.update",
            "tickets.view",
            "tickets.create",
            "tickets.update",
            "sales.view",
            "sales.create",
            "sales.update",
            "products.view",
            "products.create",
            "products.update",
            "imports.view",
            "imports.preview",
        ],
    },
    {
        "code": "destek_uzmani",
        "name": "Destek Uzmanı",
        "description": "Destek kayıtlarını yöneten kullanıcılar",
        "permissions": [
            "dashboard.view",
            "customers.view",
            "customers.create",
            "customers.update",
            "tickets.view",
            "tickets.create",
            "tickets.update",
            "tickets.change_status",
            "tickets.transfer",
            "tasks.view",
            "tasks.create",
            "tasks.update",
            "tasks.change_status",
            "tasks.assign",
            "users.view",
            "imports.view",
            "imports.preview",
        ],
    },
    {
        "code": "salt_okunur",
        "name": "Salt Okunur",
        "description": "Yalnızca görüntüleme yetkisine sahip kullanıcılar",
        "permissions": [
            "dashboard.view",
            "customers.view",
            "tickets.view",
            "tasks.view",
            "sales.view",
            "products.view",
            "imports.view",
        ],
    },
]


def seed_products() -> None:
    with SessionLocal() as db:
        existing = {code for (code,) in db.execute(select(Product.code)).all()}
        for code, name, unit_price, vat_rate, unit in PRODUCT_SEED:
            if code in existing:
                print(f"Ürün zaten mevcut: {code}")
                continue
            db.add(
                Product(
                    code=code,
                    name=name,
                    unit_price=unit_price,
                    vat_rate=vat_rate,
                    unit=unit,
                )
            )
            print(f"Ürün eklendi: {code} ({name})")
        db.commit()


def seed_roles() -> None:
    with SessionLocal() as db:
        existing = {code for (code,) in db.execute(select(Role.code)).all()}
        for code, name in ROLE_SEED:
            if code in existing:
                print(f"Rol zaten mevcut: {code}")
                continue
            db.add(Role(code=code, name=name))
            print(f"Rol eklendi: {code} ({name})")
        db.commit()


def seed_workflow_states() -> None:
    with SessionLocal() as db:
        existing = {code for (code,) in db.execute(select(WorkflowState.code)).all()}
        for code, name, color, category, sort_order, is_default in WORKFLOW_SEED:
            if code in existing:
                print(f"Durum zaten mevcut: {code}")
                continue
            db.add(
                WorkflowState(
                    code=code,
                    name=name,
                    color=color,
                    category=category,
                    sort_order=sort_order,
                    is_default=is_default,
                )
            )
            print(f"Durum eklendi: {code} ({name})")
        db.commit()


def seed_permissions() -> None:
    with SessionLocal() as db:
        existing = {code for (code,) in db.execute(select(Permission.code)).all()}
        added = 0
        for code, name, module in PERMISSION_SEED:
            if code in existing:
                continue
            db.add(Permission(code=code, name=name, module=module))
            added += 1
        db.commit()
        print(f"Permission eklendi: {added} (toplam {len(PERMISSION_SEED)})")


def seed_permission_groups() -> None:
    with SessionLocal() as db:
        permissions = {
            p.code: p for p in db.scalars(select(Permission)).all()
        }
        existing = {g.code for g in db.scalars(select(PermissionGroup)).all()}
        for spec in DEFAULT_GROUPS:
            if spec["code"] in existing:
                print(f"Yetki grubu zaten mevcut: {spec['code']}")
                continue
            group = PermissionGroup(
                code=spec["code"],
                name=spec["name"],
                description=spec["description"],
                permissions=[
                    permissions[c] for c in spec["permissions"] if c in permissions
                ],
            )
            db.add(group)
            print(f"Yetki grubu eklendi: {spec['code']} ({spec['name']})")
        db.commit()


def seed_admin_user() -> None:
    with SessionLocal() as db:
        existing = db.scalar(select(User).where(User.username == DEFAULT_ADMIN_USERNAME))
        if existing:
            print(f"Kullanıcı zaten mevcut: {DEFAULT_ADMIN_USERNAME}")
            return
        admin_role = db.scalar(select(Role).where(Role.code == "admin"))
        if admin_role is None:
            print("admin rolü bulunamadı; önce rolleri seed edin.")
            return
        db.add(
            User(
                username=DEFAULT_ADMIN_USERNAME,
                email="admin@crm.local",
                full_name="Sistem Yöneticisi",
                hashed_password=hash_password(DEFAULT_ADMIN_PASSWORD),
                role_id=admin_role.id,
            )
        )
        print(f"Kullanıcı eklendi: {DEFAULT_ADMIN_USERNAME}")
        db.commit()


if __name__ == "__main__":
    seed_roles()
    seed_workflow_states()
    seed_products()
    seed_permissions()
    seed_permission_groups()
    seed_admin_user()
