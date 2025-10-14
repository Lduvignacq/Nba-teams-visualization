import sqlite3
import pandas as pd

# Connexion à la base de données
conn = sqlite3.connect('data/nba.sqlite')

# Lister toutes les tables
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()

print("Tables disponibles dans la base de données:")
for table in tables:
    print(f"- {table[0]}")

print("\n" + "="*50 + "\n")

# Pour chaque table, afficher la structure et quelques exemples
for table in tables:
    table_name = table[0]
    print(f"Structure de la table '{table_name}':")
    
    # Obtenir les colonnes
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
    
    # Compter les lignes
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    print(f"  Nombre de lignes: {count}")
    
    # Afficher quelques exemples si la table n'est pas trop grande
    if count > 0 and count < 1000:
        print(f"  Premiers exemples:")
        df = pd.read_sql_query(f"SELECT * FROM {table_name} LIMIT 3", conn)
        print(df.to_string(index=False))
    elif count >= 1000:
        print(f"  Premiers exemples (table volumineuse):")
        df = pd.read_sql_query(f"SELECT * FROM {table_name} LIMIT 3", conn)
        print(df.to_string(index=False))
    
    print("\n" + "-"*40 + "\n")

conn.close()