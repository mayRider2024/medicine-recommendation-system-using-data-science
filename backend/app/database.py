from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING
import os
import logging

logger = logging.getLogger(__name__)

class Database:
    client: AsyncIOMotorClient = None

db = Database()

async def get_database():
    return db.client.medicine_recommendation

async def connect_to_mongo():
    """Connect to MongoDB Atlas"""
    try:
        mongodb_url = os.getenv("MONGODB_URL")
        if not mongodb_url:
            raise ValueError("MONGODB_URL environment variable is not set")

        logger.info("Connecting to MongoDB...")
        db.client = AsyncIOMotorClient(mongodb_url)

        # Test connection
        await db.client.admin.command('ping')
        logger.info("Successfully connected to MongoDB!")

        # Create indexes
        database = await get_database()

        # Patient collection indexes
        await database.patients.create_index([("email", ASCENDING)], unique=True)
        await database.patients.create_index([("phone", ASCENDING)])

        # Medical history indexes
        await database.medical_history.create_index([("patient_id", ASCENDING)])
        await database.medical_history.create_index([("created_at", ASCENDING)])

        logger.info("Database indexes created successfully")

    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {str(e)}")
        raise

async def close_mongo_connection():
    """Close MongoDB connection"""
    try:
        if db.client:
            db.client.close()
            logger.info("MongoDB connection closed")
    except Exception as e:
        logger.error(f"Error closing MongoDB connection: {str(e)}")
