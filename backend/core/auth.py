from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import bcrypt
import jwt
import uuid
from datetime import datetime, timezone, timedelta
from core import db, master_db, get_tenant_db, JWT_SECRET, JWT_ALGORITHM

security = HTTPBearer()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def generate_id() -> str:
    return uuid.uuid4().hex[:8]

def generate_order_no(prefix: str = "SO") -> str:
    return f"{prefix}{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}{uuid.uuid4().hex[:4].upper()}"

def create_token(user_id: str, username: str, role: str, tenant_id: str = None) -> str:
    payload = {
        "user_id": user_id,
        "username": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=7)
    }
    if tenant_id:
        payload["tenant_id"] = tenant_id
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if "tenant_id" in payload and payload["tenant_id"]:
            payload["_db"] = get_tenant_db(payload["tenant_id"])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def log_audit(user_id, username, action, target_type, target_id="", detail="", audit_db=None):
    doc = {
        "id": generate_id(),
        "user_id": user_id,
        "username": username,
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "detail": detail,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    target_db = audit_db if audit_db is not None else db
    await target_db.audit_logs.insert_one(doc)
