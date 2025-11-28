from db import DBHelper
import logging

class TaskManager:
    def __init__(self, db: DBHelper):
        self.db = db

    def add_task(self, title, description, due_date, priority):
        query = "INSERT INTO tasks (title, description, due_date, priority) VALUES (?, ?, ?, ?)"
        self.db.execute(query, (title, description, due_date, priority), commit=True)

    def get_tasks(self):
        c = self.db.execute("SELECT id, title, description, due_date, priority FROM tasks")
        return c.fetchall() if c else []

    def edit_task(self, task_id, title, description, due_date, priority):
        query = "UPDATE tasks SET title=?, description=?, due_date=?, priority=? WHERE id=?"
        self.db.execute(query, (title, description, due_date, priority, task_id), commit=True)

    def delete_task(self, task_id):
        self.db.execute("DELETE FROM tasks WHERE id=?", (task_id,), commit=True)

    def delete_all_tasks(self):
        self.db.execute("DELETE FROM tasks", commit=True)