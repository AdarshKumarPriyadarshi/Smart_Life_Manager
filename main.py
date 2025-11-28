import logging
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logging.getLogger("urllib3").setLevel(logging.ERROR)
from pydantic import BaseModel
import datetime
import uvicorn
from db import init_db
from utils import load_config, setup_logging
from tasks import TaskManager
from notes import NotesManager
from reminders import ReminderManager
from weather import WeatherManager
from fastapi import FastAPI
from fastapi import HTTPException

config = load_config()
setup_logging(config['app']['debug'])
db = init_db(config["database"])
task_mgr = TaskManager(db)
notes_mgr = NotesManager(db)
reminder_mgr = ReminderManager(db)
weather_mgr = WeatherManager(db)
app = FastAPI()

class Task(BaseModel):
    title: str
    description: str
    due_date: str
    priority: int

class Note(BaseModel):
    content: str

class Reminder(BaseModel):
    content: str
    date: str

@app.post("/tasks")
def create_task(task: Task):
    task_mgr.add_task(task.title, task.description, task.due_date, task.priority)
    return {"message": "Task added"}

@app.get("/tasks")
def read_tasks():
    tasks = task_mgr.get_tasks()
    if not tasks:
        return {"message": "No tasks found."}
    return {"tasks": tasks}

@app.put("/tasks/{task_id}")
def update_task(task_id: int, task: Task):
    task_mgr.edit_task(task_id, task.title, task.description, task.due_date, task.priority)
    return {"message": "Task updated"}

@app.delete("/tasks/clear_all")
def delete_all_tasks():
    task_mgr.delete_all_tasks()
    return {"message": "All tasks cleared."}

@app.delete("/tasks/{task_id}")
def delete_task(task_id: int):
    task_mgr.delete_task(task_id)
    return {"message": "Task deleted"}

@app.post("/notes")
def create_note(note: Note):
    notes_mgr.add_note(note.content)
    return {"message": "Note added"}

@app.get("/notes")
def read_notes():
    notes = notes_mgr.get_notes()
    if not notes:
        return {"message": "No notes found."}
    return {"notes": notes}

@app.put("/notes/{note_id}")
def update_note(note_id: int, note: Note):
    notes_mgr.edit_note(note_id, note.content)
    return {"message": "Note updated"}

@app.delete("/notes/clear_all")
def delete_all_notes():
    notes_mgr.delete_all_notes()
    return {"message": "All notes cleared."}

@app.delete("/notes/{note_id}")
def delete_note(note_id: int):
    notes_mgr.delete_note(note_id)
    return {"message": "Note deleted"}

@app.post("/reminders")
def create_reminder(reminder: Reminder):
    reminder_mgr.add_reminder(reminder.content, reminder.date)
    return {"message": "Reminder added"}

@app.get("/reminders")
def read_reminders():
    reminders = reminder_mgr.get_all_reminders()
    if not reminders:
        return {"message": "No reminders found."}
    return {"reminders": reminders}

@app.get("/reminders/today")
def read_todays_reminders():
    today = datetime.date.today().isoformat()
    today_reminders = reminder_mgr.get_todays_reminders(today)
    if not today_reminders:
        return {"message": "No reminders for today."}
    return {"today_reminders": today_reminders}

@app.put("/reminders/{reminder_id}")
def update_reminder(reminder_id: int, reminder: Reminder):
    reminder_mgr.edit_reminder(reminder_id, reminder.content, reminder.date)
    return {"message": "Reminder updated"}

@app.delete("/reminders/clear_all")
def delete_all_reminders():
    reminder_mgr.delete_all_reminders()
    return {"message": "All reminders cleared."}

@app.delete("/reminders/{reminder_id}")
def delete_reminder(reminder_id: int):
    reminder_mgr.delete_reminder(reminder_id)
    return {"message": "Reminder deleted"}

@app.get("/weather/history")
def weather_history():
    rows = weather_mgr.get_weather_history()
    logging.debug(f"Raw DB rows: {rows}")
    if not rows:
        return {"message": "Weather history is not available."}
    history = [{"id": r[0], "city": r[1], "date": r[2], "weather": r[3]} for r in rows]
    logging.debug(f"Formatted response: {history}")
    return {"history": history}

@app.get("/weather/{city}")
def get_weather(city: str):
    weather = weather_mgr.check_weather(city)
    if "Failed" in weather:
        raise HTTPException(status_code=400, detail=weather)
    return {"weather": weather}

@app.delete("/weather/history/reset")
def clear_weather_history():
    weather_mgr.clear_weather_history()
    return {"message": "Weather history reset."}

@app.get("/")
def welcome():
    return {"message": "Welcome to Smart Life Manager API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, log_level="debug" if config['app']['debug'] else "info")