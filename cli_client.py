import logging
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
logging.getLogger("urllib3").setLevel(logging.ERROR)
logging.getLogger("httpx").setLevel(logging.ERROR)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("uvicorn.error").setLevel(logging.WARNING)
import requests
import datetime

BASE_URL = "http://127.0.0.1:8000"

def menu():
    print("\nSmart Life Manager CLI")
    print("1. Task Manager")
    print("2. Notes Manager")
    print("3. Weather Info")
    print("4. Reminders")
    print("5. Clear / Reset Options")
    print("6. Exit")

def task_menu():
    print("\nTask Manager")
    print("1. Add task")
    print("2. Show tasks")
    print("3. Edit task")
    print("4. Delete task")
    print("5. Back")

def notes_menu():
    print("\nNotes Manager")
    print("1. Add note")
    print("2. Show notes")
    print("3. Edit note")
    print("4. Delete note")
    print("5. Back")

def weather_menu():
    print("\nWeather Info")
    print("1. Check weather for city")
    print("2. Show weather history")
    print("3. Back")

def reminders_menu():
    print("\nReminders")
    print("1. Add reminder")
    print("2. Show all reminders")
    print("3. Show today's reminders")
    print("4. Edit reminder")
    print("5. Delete reminder")
    print("6. Back")

def clear_reset_menu():
    print("\n-- Clear / Reset Options --")
    print("1. Clear all tasks")
    print("2. Clear all notes")
    print("3. Clear all reminders")
    print("4. Reset weather history")
    print("5. Back")

def add_task():
    title = input("Title: ")
    description = input("Description: ")
    due_date = input("Due date (YYYY-MM-DD): ")
    priority = input("Priority (1-5): ")
    payload = {"title": title, "description": description, "due_date": due_date, "priority": int(priority)}
    resp = requests.post(f"{BASE_URL}/tasks", json=payload)
    print(resp.json().get("message", "Error"))

def show_tasks():
    resp = requests.get(f"{BASE_URL}/tasks")
    data = resp.json()
    if "message" in data:
        print(data["message"])
        return
    tasks = data.get("tasks", [])
    if not tasks:
        print("No tasks found.")
        return
    for t in tasks:
        print(f"ID: {t[0]} | Title: {t[1]} | Desc: {t[2]} | Due: {t[3]} | Priority: {t[4]}")

def edit_task():
    task_id = input("Task ID to edit: ")
    title = input("New title: ")
    description = input("New description: ")
    due_date = input("New due date (YYYY-MM-DD): ")
    priority = input("New priority (1-5): ")
    payload = {"title": title, "description": description, "due_date": due_date, "priority": int(priority)}
    resp = requests.put(f"{BASE_URL}/tasks/{task_id}", json=payload)
    print(resp.json().get("message", "Error"))

def delete_task():
    task_id = input("Task ID to delete: ")
    resp = requests.delete(f"{BASE_URL}/tasks/{task_id}")
    print(resp.json().get("message", "Error"))

def add_note():
    content = input("Note content: ")
    resp = requests.post(f"{BASE_URL}/notes", json={"content": content})
    print(resp.json().get("message", "Error"))

def show_notes():
    resp = requests.get(f"{BASE_URL}/notes")
    data = resp.json()
    if "message" in data:
        print(data["message"])
        return
    notes = data.get("notes", [])
    if not notes:
        print("No notes found.")
        return
    for n in notes:
        print(f"ID: {n[0]} | Note: {n[1]}")

def edit_note():
    note_id = input("Note ID to edit: ")
    content = input("New content: ")
    resp = requests.put(f"{BASE_URL}/notes/{note_id}", json={"content": content})
    print(resp.json().get("message", "Error"))

def delete_note():
    note_id = input("Note ID to delete: ")
    resp = requests.delete(f"{BASE_URL}/notes/{note_id}")
    print(resp.json().get("message", "Error"))

def check_weather():
    city = input("City name: ")
    resp = requests.get(f"{BASE_URL}/weather/{city}")
    if resp.status_code == 200:
        print(resp.json().get("weather", "No data"))
    else:
        print("Weather fetch failed:", resp.json().get("detail", "Error"))

def show_weather_history():
    resp = requests.get(f"{BASE_URL}/weather/history")
    data = resp.json()
    if "message" in data:
        print(data["message"])
        return
    history = data.get("history", [])
    if not history:
        print("Weather history is not available.")
        return
    for rec in history:
        print(f"{rec['city']} | {rec['date']} | {rec['weather']}")

def add_reminder():
    content = input("Reminder content: ")
    date = input("Date (YYYY-MM-DD): ")
    resp = requests.post(f"{BASE_URL}/reminders", json={"content": content, "date": date})
    print(resp.json().get("message", "Error"))

def show_all_reminders():
    resp = requests.get(f"{BASE_URL}/reminders")
    data = resp.json()
    if "message" in data:
        print(data["message"])
        return
    reminders = data.get("reminders", [])
    if not reminders:
        print("No reminders found.")
        return
    for r in reminders:
        print(f"ID: {r[0]} | {r[2]} | {r[1]}")

def show_todays_reminders():
    resp = requests.get(f"{BASE_URL}/reminders/today")
    data = resp.json()
    if "message" in data:
        print(data["message"])
        return
    reminders = data.get("today_reminders", [])
    if not reminders:
        print("No reminders for today.")
        return
    for r in reminders:
        print(f"ID: {r[0]} | {r[1]}")

def edit_reminder():
    reminder_id = input("Reminder ID to edit: ")
    content = input("New content: ")
    date = input("New date (YYYY-MM-DD): ")
    payload = {"content": content, "date": date}
    resp = requests.put(f"{BASE_URL}/reminders/{reminder_id}", json=payload)
    print(resp.json().get("message", "Error"))

def delete_reminder():
    reminder_id = input("Reminder ID to delete: ")
    resp = requests.delete(f"{BASE_URL}/reminders/{reminder_id}")
    print(resp.json().get("message", "Error"))

def clear_all_tasks():
    confirm = input("Confirm clearing all tasks? (y/n): ")
    if confirm.lower() == 'y':
        resp = requests.delete(f"{BASE_URL}/tasks/clear_all")
        print(f"Status code: {resp.status_code}")
        print(f"Response: {resp.text}")
        try:
            print(resp.json().get("message", "Error"))
        except:
            print("Failed to parse JSON response.")

def clear_all_notes():
    confirm = input("Confirm clearing all notes? (y/n): ")
    if confirm.lower() == 'y':
        resp = requests.delete(f"{BASE_URL}/notes/clear_all")
        print(resp.json().get("message", "Error"))

def clear_all_reminders():
    confirm = input("Confirm clearing all reminders? (y/n): ")
    if confirm.lower() == 'y':
        resp = requests.delete(f"{BASE_URL}/reminders/clear_all")
        print(resp.json().get("message", "Error"))

def reset_weather_history():
    confirm = input("Confirm resetting weather history? (y/n): ")
    if confirm.lower() == 'y':
        resp = requests.delete(f"{BASE_URL}/weather/history/reset")
        print(resp.json().get("message", "Error"))


def main():
    while True:
        menu()
        choice = input("Select option: ")
        if choice == '1':
            while True:
                task_menu()
                c = input("Select task option: ")
                if c == '1':
                    add_task()
                elif c == '2':
                    show_tasks()
                elif c == '3':
                    edit_task()
                elif c == '4':
                    delete_task()
                elif c == '5':
                    break
        elif choice == '2':
            while True:
                notes_menu()
                c = input("Select notes option: ")
                if c == '1':
                    add_note()
                elif c == '2':
                    show_notes()
                elif c == '3':
                    edit_note()
                elif c == '4':
                    delete_note()
                elif c == '5':
                    break
        elif choice == '3':
            while True:
                weather_menu()
                c = input("Select weather option: ")
                if c == '1':
                    check_weather()
                elif c == '2':
                    show_weather_history()
                elif c == '3':
                    break
        elif choice == '4':
            while True:
                reminders_menu()
                c = input("Select reminders option: ")
                if c == '1':
                    add_reminder()
                elif c == '2':
                    show_all_reminders()
                elif c == '3':
                    show_todays_reminders()
                elif c == '4':
                    edit_reminder()
                elif c == '5':
                    delete_reminder()
                elif c == '6':
                    break
        elif choice == '5':
            while True:
                clear_reset_menu()
                c = input("Select clear/reset option: ")
                if c == '1':
                    clear_all_tasks()
                elif c == '2':
                    clear_all_notes()
                elif c == '3':
                    clear_all_reminders()
                elif c == '4':
                    reset_weather_history()
                elif c == '5':
                    break
                else:
                    print("Invalid selection.")
        elif choice == '6':
            print("Exiting CLI client.")
            break
        else:
            print("Invalid choice.")

if __name__ == "__main__":
    main()