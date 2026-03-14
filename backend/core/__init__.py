from motor.motor_asyncio import AsyncIOMotorClient
from pathlib import Path
from dotenv import load_dotenv
import os

ROOT_DIR = Path(__file__).parent.parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
master_db = db

JWT_SECRET = os.environ.get('JWT_SECRET', 'pos-system-secret-key-2024')
JWT_ALGORITHM = "HS256"

def get_tenant_db(tenant_id: str):
    return client[f"tenant_{tenant_id}"]

def get_user_db(current_user: dict):
    return current_user.get("_db", db)

__all__ = ['db', 'master_db', 'client', 'get_tenant_db', 'get_user_db', 'JWT_SECRET', 'JWT_ALGORITHM', 'ROOT_DIR']
