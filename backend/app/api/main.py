from fastapi import APIRouter

from app.api.routes import budgets, dashboard, login, summary, transactions, users, utils
from app.core.config import settings

api_router = APIRouter()
api_router.include_router(login.router, tags=["login"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(utils.router, tags=["utils"])
api_router.include_router(transactions.router)
api_router.include_router(dashboard.router)
api_router.include_router(summary.router)
api_router.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
