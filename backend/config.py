import os

SECRET_KEY = os.getenv("SECRET_KEY", "railsync-hackathon-secret-key-2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./railsync.db")
