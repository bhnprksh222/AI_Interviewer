from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://postgres.jjrqfeakultthtffhmgd:POIFGoRDFSgsYR2s@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# Create engine
engine = create_engine(DATABASE_URL)

# Create session
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# Test connection
try:
    db = SessionLocal()
    with engine.connect() as conn:
        print("Database connection successful!")
except Exception as e:
    print(f"Database connection failed: {e}")
finally:
    db.close()
