import sqlite3
import os

DATABASE = os.environ.get('MEDSAFE_DB_PATH', os.path.join(os.path.dirname(__file__), '..', 'backend', 'data', 'medsafe.db'))
os.makedirs(os.path.dirname(DATABASE), exist_ok=True)

conn = sqlite3.connect(DATABASE)
with open(os.path.join(os.path.dirname(__file__), 'schema.sql'), 'r') as f:
    conn.executescript(f.read())
conn.commit()
conn.close()
print(f"MedSafe SQLite Database initialized successfully at {DATABASE}")
