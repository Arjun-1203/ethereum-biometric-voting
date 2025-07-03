import sqlite3
import os

def setup_admin_table():
    try:
        # Connect to the database
        conn = sqlite3.connect('evoting.db')
        cursor = conn.cursor()

        # Read and execute the SQL file
        with open('create_admin_table.sql', 'r') as sql_file:
            sql_script = sql_file.read()
            cursor.executescript(sql_script)

        # Commit the changes
        conn.commit()
        print("Admin table created successfully!")

    except Exception as e:
        print(f"Error creating admin table: {e}")
    finally:
        # Close the connection
        conn.close()

if __name__ == "__main__":
    setup_admin_table() 