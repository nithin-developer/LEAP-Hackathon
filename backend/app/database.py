from pymongo import AsyncMongoClient
from beanie import init_beanie
from app.config import settings
from app.models.user import User
from app.models.batch import Batch

async def init_db():
    client = AsyncMongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    await init_beanie(database=db, document_models=[User, Batch])
