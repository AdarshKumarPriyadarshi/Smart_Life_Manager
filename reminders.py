from db import DBHelper

class ReminderManager:
    def __init__(self, db: DBHelper):
        self.db = db

    def add_reminder(self, content, date):
        self.db.execute("INSERT INTO reminders (content, date) VALUES (?, ?)", (content, date), commit=True)

    def get_all_reminders(self):
        c = self.db.execute("SELECT id, content, date FROM reminders ORDER BY date")
        return c.fetchall() if c else []

    def get_todays_reminders(self, today_date):
        c = self.db.execute("SELECT id, content FROM reminders WHERE date=?", (today_date,))
        return c.fetchall() if c else []

    def edit_reminder(self, reminder_id, content, date):
        self.db.execute("UPDATE reminders SET content=?, date=? WHERE id=?", (content, date, reminder_id), commit=True)

    def delete_reminder(self, reminder_id):
        self.db.execute("DELETE FROM reminders WHERE id=?", (reminder_id,), commit=True)

    def delete_all_reminders(self):
        self.db.execute("DELETE FROM reminders", commit=True)