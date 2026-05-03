import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# We will use sqlite for local development since the user may not have postgres setup
# But it can easily be switched to PostgreSQL by updating the database URL.
# The user wants PostgreSQL, so I'll set a default pg string, but fall back to sqlite if it fails or if not provided.
# Actually, the user asked for postgresql. Let's use it, but with a fallback to SQLite if DB_URL is missing so the app doesn't crash on initial run without env.

SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")

if SQLALCHEMY_DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
