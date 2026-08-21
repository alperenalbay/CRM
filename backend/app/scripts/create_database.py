from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url

from app.core.config import settings


def create_database() -> None:
    url = make_url(settings.database_url)
    database = url.database
    if not database:
        raise SystemExit("DATABASE_URL bir veritabanı adı içermelidir.")

    master_url = url.set(database="master")
    engine = create_engine(master_url, isolation_level="AUTOCOMMIT")
    with engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM sys.databases WHERE name = :name"),
            {"name": database},
        ).scalar()
        if exists:
            print(f"Veritabanı zaten mevcut: {database}")
            return
        conn.execute(text(f'CREATE DATABASE "{database}" COLLATE Turkish_CI_AS'))
        print(f"Veritabanı oluşturuldu: {database} (Turkish_CI_AS)")


if __name__ == "__main__":
    create_database()
