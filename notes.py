from db import DBHelper

class NotesManager:
    def __init__(self, db: DBHelper):
        self.db = db

    def add_note(self, content):
        self.db.execute("INSERT INTO notes (content) VALUES (?)", (content,), commit=True)

    def get_notes(self):
        c = self.db.execute("SELECT id, content FROM notes")
        return c.fetchall() if c else []

    def edit_note(self, note_id, content):
        self.db.execute("UPDATE notes SET content=? WHERE id=?", (content, note_id), commit=True)

    def delete_note(self, note_id):
        self.db.execute("DELETE FROM notes WHERE id=?", (note_id,), commit=True)

    def delete_all_notes(self):
        self.db.execute("DELETE FROM notes", commit=True)