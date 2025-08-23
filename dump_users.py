import sqlite3
import os

DB_PATH = os.path.abspath("data/users.db")
print(f"[INFO] Dump-Skript verwendet Datenbank: {DB_PATH}")

conn = sqlite3.connect(DB_PATH)
cursor = conn.cursor()

print(f"Alle Einträge in der Tabelle 'users' aus {DB_PATH}:")
try:
    cursor.execute("SELECT * FROM users")
    rows = cursor.fetchall()
    for row in rows:
        print(row)
    if not rows:
        print("Keine Einträge gefunden.")
except Exception as e:
    print(f"Fehler beim Auslesen: {e}")

print("\nTabellenstruktur von 'users':")
try:
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()
    for col in columns:
        print(col)
    if not columns:
        print("Tabelle 'users' existiert nicht.")
except Exception as e:
    print(f"Fehler beim Auslesen der Struktur: {e}")
finally:
    conn.close()
