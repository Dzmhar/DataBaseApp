import mysql.connector
from app.config import DB_CONFIG


def get_db():
    conn = mysql.connector.connect(**DB_CONFIG)
    try:
        yield conn
    finally:
        conn.close()
