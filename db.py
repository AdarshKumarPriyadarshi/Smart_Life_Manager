import sqlite3
import logging

class DBHelper:
    def __init__(self, db_path):
        self.db_path = db_path
        self.conn = None

    def connect(self):
        try:
            self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        except sqlite3.Error as e:
            logging.error(f"DB connection error: {e}")
        return self.conn

    def execute(self, query, params=(), commit=False):
        try:
            c = self.conn.cursor()
            c.execute(query, params)
            if commit:
                self.conn.commit()
            return c
        except sqlite3.Error as e:
            logging.error(f"DB query error: {e}")
            return None

    def close(self):
        if self.conn:
            self.conn.close()

def init_db(db_path):
    db = DBHelper(db_path)
    db.connect()
    schema = [
        '''CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT,
            description TEXT,
            due_date TEXT,
            priority INTEGER)''',
        '''CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT)''',
        '''CREATE TABLE IF NOT EXISTS reminders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT,
            date TEXT)''',
        '''CREATE TABLE IF NOT EXISTS weather_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            city TEXT,
            date TEXT,
            weather TEXT)'''
            ]
    for q in schema:
        db.execute(q, commit=True)
    return db