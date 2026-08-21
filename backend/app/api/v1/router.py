from fastapi import APIRouter

from app.api.v1 import (
    auth,
    customers,
    dashboard,
    groups,
    health,
    import_data,
    permissions,
    sales,
    tasks,
    tickets,
    users,
    workflow,
)

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(customers.router)
api_router.include_router(tickets.router)
api_router.include_router(tasks.router)
api_router.include_router(sales.router)
api_router.include_router(users.router)
api_router.include_router(workflow.router)
api_router.include_router(dashboard.router)
api_router.include_router(import_data.router)
api_router.include_router(groups.router)
api_router.include_router(permissions.router)
