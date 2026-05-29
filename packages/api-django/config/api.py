"""Root API instance. Mount each domain's router here."""
from ninja import NinjaAPI

from common.api import router as health_router
from domains.accounts.api import router as accounts_router
from domains.churn.api import router as churn_router

api = NinjaAPI(
    title="Domain API",
    version="1.0.0",
    description="Domain-oriented HTTP API.",
)

@api.get("/", tags=["root"])
def root(request):
    return {"message": "Hello World!"}


api.add_router("/health", health_router)
api.add_router("/churn", churn_router)
api.add_router("/accounts", accounts_router)
