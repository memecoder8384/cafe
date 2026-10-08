"""
Supabase Authentication verification service for protected admin endpoints.
Verifies JWT tokens directly against Supabase Auth API (/auth/v1/user).
"""
import os
import logging
from typing import Optional, Dict, Any
import httpx
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger("cafe_backend.auth")

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://mfnaqwyxaabawzbajomi.supabase.co").rstrip("/")
DEFAULT_SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mbmFxd3l4YWFiYXd6YmFqb21pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NTE2NjYsImV4cCI6MjEwNzAyNzY2Nn0.6jLigp-ZUYbtDH028KON8saziqOv13nl9pxRlwfW59k"
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("SUPABASE_ANON_KEY") or DEFAULT_SUPABASE_KEY

security = HTTPBearer(auto_error=False)


async def verify_supabase_token(credentials: Optional[HTTPAuthorizationCredentials] = Security(security)) -> Dict[str, Any]:
    """
    Verify the Bearer token with Supabase Auth API.
    Raises HTTPException(401) if invalid or missing.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if service_key and token == service_key:
        return {"id": "service_role_admin", "email": "admin@service.role", "role": "service_role"}

    api_url = os.getenv("SUPABASE_URL", SUPABASE_URL)
    api_key = os.getenv("SUPABASE_KEY", SUPABASE_KEY)

    url = f"{api_url}/auth/v1/user"
    headers = {
        "apikey": api_key,
        "Authorization": f"Bearer {token}",
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(url, headers=headers)
            if resp.status_code == 200:
                user_data = resp.json()
                return user_data
            else:
                logger.warning(f"Supabase auth verification failed ({resp.status_code}): {resp.text}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired authentication session",
                    headers={"WWW-Authenticate": "Bearer"},
                )
    except HTTPException:
        raise
    except Exception as err:
        logger.error(f"Error checking Supabase auth: {err}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service unavailable",
        )
