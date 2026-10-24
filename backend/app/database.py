import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import Optional
from app.config import settings

logger = logging.getLogger("sanctum.database")

client: Optional[AsyncIOMotorClient] = None
db: Optional[AsyncIOMotorDatabase] = None


async def connect_to_mongodb() -> Optional[AsyncIOMotorDatabase]:
    """Connect to MongoDB cluster and ensure necessary indexes."""
    global client, db
    
    kwargs = {
        "serverSelectionTimeoutMS": settings.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
    }
    is_atlas = "mongodb+srv://" in settings.MONGODB_URI or "ssl=true" in settings.MONGODB_URI.lower()
    if is_atlas:
        try:
            import certifi
            kwargs["tlsCAFile"] = certifi.where()
        except ImportError:
            pass

    try:
        client = AsyncIOMotorClient(settings.MONGODB_URI, **kwargs)
        db = client[settings.MONGODB_DB_NAME]

        # Verify connection
        await client.admin.command("ping")
        logger.info(f"Connected to MongoDB: {settings.MONGODB_DB_NAME}")

        # Ensure indexes
        await init_db_indexes(db)
        return db
    except Exception as e:
        err_msg = str(e)
        # Handle Windows clock skew or local cert store verification failure
        if is_atlas and ("CERTIFICATE_VERIFY_FAILED" in err_msg or "certificate is not yet valid" in err_msg):
            logger.warning(
                "SSL certificate verification failed (system clock or cert store issue). "
                "Retrying with tlsAllowInvalidCertificates=True for local environment..."
            )
            try:
                client = AsyncIOMotorClient(
                    settings.MONGODB_URI,
                    serverSelectionTimeoutMS=settings.MONGODB_SERVER_SELECTION_TIMEOUT_MS,
                    tlsAllowInvalidCertificates=True,
                )
                db = client[settings.MONGODB_DB_NAME]
                await client.admin.command("ping")
                logger.info(f"Connected to MongoDB (development TLS bypass): {settings.MONGODB_DB_NAME}")
                await init_db_indexes(db)
                return db
            except Exception as retry_err:
                logger.error(f"Could not connect to MongoDB on retry: {retry_err}")
                return None

        logger.warning(f"Could not connect to MongoDB at {settings.MONGODB_URI}: {e}")
        # We don't crash the server so health endpoint can report status
        return None


async def close_mongodb_connection():
    """Close MongoDB connection gracefully."""
    global client
    if client:
        client.close()
        logger.info("Closed MongoDB connection.")


async def update_existing_student_names(database: AsyncIOMotorDatabase):
    """Ensure all existing student records have name derived strictly from email prefix."""
    try:
        cursor = database.students.find({})
        async for student in cursor:
            email = student.get("email")
            if email and "@" in email:
                derived_name = email.strip().lower().split("@")[0]
                if student.get("name") != derived_name:
                    await database.students.update_one(
                        {"_id": student["_id"]},
                        {"$set": {"name": derived_name}}
                    )
                    logger.info(f"Updated student {email} name to: {derived_name}")
    except Exception as e:
        logger.error(f"Error updating existing student names: {e}")


async def init_db_indexes(database: AsyncIOMotorDatabase):
    """Ensure unique and query indexes for students and focus_attempts collections."""
    try:
        # Students: unique index on normalized email
        await database.students.create_index("email", unique=True)
        # Leaderboard index: descending score, ascending achievement time
        await database.students.create_index([
            ("best_score_seconds", -1),
            ("best_achieved_at", 1)
        ])

        # Focus attempts: indexes for active lookups and student history
        await database.focus_attempts.create_index([
            ("student_id", 1),
            ("status", 1)
        ])
        await database.focus_attempts.create_index([
            ("student_id", 1),
            ("created_at", -1)
        ])
        logger.info("MongoDB indexes verified.")

        # Ensure all existing student records derive name from email prefix
        await update_existing_student_names(database)
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")


def get_database() -> AsyncIOMotorDatabase:
    """Dependency / helper to get database instance."""
    global client, db
    if db is None:
        is_atlas = "mongodb+srv://" in settings.MONGODB_URI or "ssl=true" in settings.MONGODB_URI.lower()
        kwargs = {"serverSelectionTimeoutMS": settings.MONGODB_SERVER_SELECTION_TIMEOUT_MS}
        if is_atlas:
            try:
                import certifi
                kwargs["tlsCAFile"] = certifi.where()
            except ImportError:
                pass
        try:
            client = AsyncIOMotorClient(settings.MONGODB_URI, **kwargs)
            db = client[settings.MONGODB_DB_NAME]
        except Exception as e:
            logger.error(f"Direct connection to MongoDB failed: {e}")
            raise RuntimeError(f"Database is not connected. Please verify your MONGODB_URI: {e}")
    return db
