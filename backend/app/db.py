import sqlite3
import os
import json
from datetime import datetime

if os.environ.get("VERCEL"):
    DB_PATH = "/tmp/db.sqlite"
else:
    DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "db.sqlite")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Create Partners
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS partners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        tier TEXT NOT NULL, -- 'Silver', 'Gold', 'Platinum'
        commission_rate REAL NOT NULL,
        email TEXT NOT NULL
    );
    """)

    # 2. Create Users
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        tier TEXT NOT NULL, -- 'Silver', 'Gold', 'Platinum'
        partner_id INTEGER,
        FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL
    );
    """)

    # 3. Create Deals
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS deals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        partner_id INTEGER,
        client_name TEXT NOT NULL,
        agent_name TEXT NOT NULL, -- keep for salesperson display
        status TEXT NOT NULL, -- 'Prepared', 'In Progress', 'Stuck', 'Rejected', 'Won', 'Lost'
        ico TEXT,
        dic TEXT,
        client_logo TEXT,
        pdf_path TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE SET NULL
    );
    """)

    # 4. Create Configurations
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS configurations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deal_id INTEGER NOT NULL UNIQUE,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        pins_json TEXT NOT NULL,
        energy_price REAL NOT NULL,
        sunny_days INTEGER NOT NULL,
        windy_days INTEGER NOT NULL,
        wind_hours INTEGER NOT NULL,
        ai_optimization INTEGER NOT NULL, -- 0 or 1
        web3_enabled INTEGER NOT NULL,     -- 0 or 1
        building_consumption REAL NOT NULL,
        discount REAL NOT NULL,
        total_price REAL NOT NULL,
        commission_forecast REAL NOT NULL,
        pdf_path TEXT,
        FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE
    );
    """)

    # 5. Create Commissions
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS commissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        deal_id INTEGER NOT NULL UNIQUE,
        partner_id INTEGER NOT NULL,
        amount_czk REAL NOT NULL,
        status TEXT NOT NULL, -- 'Forecasted', 'Pending', 'Paid', 'Cancelled'
        payout_date TEXT,
        FOREIGN KEY (deal_id) REFERENCES deals(id) ON DELETE CASCADE,
        FOREIGN KEY (partner_id) REFERENCES partners(id) ON DELETE CASCADE
    );
    """)

    conn.commit()

    # Seed mock partners if they don't exist yet
    partners_count = conn.execute("SELECT COUNT(*) FROM partners;").fetchone()[0]
    if partners_count == 0:
        partners_data = [
            ("EcoSystems s.r.o.", "Silver", 5.0, "partners@ecosystems.cz"),
            ("SolarTech Distributors", "Gold", 8.0, "deals@solartech.cz"),
            ("VoltEdge Platinum Partners", "Platinum", 12.0, "pro@voltedge.eu")
        ]
        cursor.executemany("""
            INSERT INTO partners (name, tier, commission_rate, email) 
            VALUES (?, ?, ?, ?);
        """, partners_data)
        conn.commit()

    # Seed mock user if they don't exist yet (for developer testing)
    users_count = conn.execute("SELECT COUNT(*) FROM users;").fetchone()[0]
    if users_count == 0:
        cursor.execute("""
            INSERT INTO users (username, password, tier, partner_id)
            VALUES (?, ?, ?, ?);
        """, ("jakub", "password", "Silver", 1))
        conn.commit()

    conn.close()

# ─── CRUD Functions ───

def get_partners():
    conn = get_db_connection()
    try:
        rows = conn.execute("SELECT * FROM partners").fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

def register_user(username, password, tier, partner_id=None):
    conn = get_db_connection()
    try:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO users (username, password, tier, partner_id)
            VALUES (?, ?, ?, ?);
        """, (username, password, tier, partner_id))
        conn.commit()
        return cursor.lastrowid
    except sqlite3.IntegrityError:
        raise ValueError("Uživatelské jméno již existuje")
    finally:
        conn.close()

def authenticate_user(username, password):
    conn = get_db_connection()
    try:
        row = conn.execute("""
            SELECT u.*, p.name as partner_name
            FROM users u
            LEFT JOIN partners p ON u.partner_id = p.id
            WHERE u.username = ? AND u.password = ?;
        """, (username, password)).fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def get_deals(user_id=None):
    conn = get_db_connection()
    try:
        if user_id:
            query = "SELECT * FROM deals WHERE user_id = ? ORDER BY id DESC"
            rows = conn.execute(query, (user_id,)).fetchall()
        else:
            query = "SELECT * FROM deals ORDER BY id DESC"
            rows = conn.execute(query).fetchall()
        
        deals_list = []
        for r in rows:
            deal_dict = dict(r)
            # Fetch config if exists
            cfg_row = conn.execute("SELECT * FROM configurations WHERE deal_id = ?", (deal_dict["id"],)).fetchone()
            deal_dict["config"] = dict(cfg_row) if cfg_row else None
            # Fetch commission if exists
            comm_row = conn.execute("SELECT * FROM commissions WHERE deal_id = ?", (deal_dict["id"],)).fetchone()
            deal_dict["commission"] = dict(comm_row) if comm_row else None
            
            # Fetch partner name for map tooltips
            p_name = conn.execute("""
                SELECT p.name 
                FROM users u
                LEFT JOIN partners p ON u.partner_id = p.id
                WHERE u.id = ?
            """, (deal_dict["user_id"],)).fetchone()
            deal_dict["partner_name"] = p_name["name"] if (p_name and p_name["name"]) else "Neznámý Partner"
            
            deals_list.append(deal_dict)
            
        return deals_list
    finally:
        conn.close()

def create_deal(user_id, partner_id, client_name, agent_name, status="Prepared"):
    conn = get_db_connection()
    try:
        now_str = datetime.now().isoformat()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO deals (user_id, partner_id, client_name, agent_name, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        """, (user_id, partner_id, client_name, agent_name, status, now_str, now_str))
        conn.commit()
        return cursor.lastrowid
    finally:
        conn.close()

def update_deal_status(deal_id, status):
    conn = get_db_connection()
    try:
        now_str = datetime.now().isoformat()
        conn.execute("""
            UPDATE deals 
            SET status = ?, updated_at = ? 
            WHERE id = ?;
        """, (status, now_str, deal_id))
        
        # Commission status triggers
        comm_status = "Forecasted"
        payout_date = None
        if status == "Won":
            comm_status = "Pending"
        elif status in ["Lost", "Rejected"]:
            comm_status = "Cancelled"
            
        # Update commission status if it exists and is not already Paid
        conn.execute("""
            UPDATE commissions
            SET status = ?
            WHERE deal_id = ? AND status != 'Paid';
        """, (comm_status, deal_id))
        
        conn.commit()
    finally:
        conn.close()

def update_deal_metadata(deal_id, ico, dic, client_logo, pdf_path):
    conn = get_db_connection()
    try:
        now_str = datetime.now().isoformat()
        conn.execute("""
            UPDATE deals
            SET ico = ?, dic = ?, client_logo = ?, pdf_path = ?, updated_at = ?
            WHERE id = ?;
        """, (ico, dic, client_logo, pdf_path, now_str, deal_id))
        conn.commit()
    finally:
        conn.close()

def save_deal_config(deal_id, lat, lon, pins_json, energy_price, sunny_days, windy_days, wind_hours, 
                     ai_optimization, web3_enabled, building_consumption, discount, total_price, 
                     commission_forecast, pdf_path=None):
    conn = get_db_connection()
    try:
        now_str = datetime.now().isoformat()
        cursor = conn.cursor()
        
        # Check if config exists
        exists = conn.execute("SELECT 1 FROM configurations WHERE deal_id = ?", (deal_id,)).fetchone()
        
        if exists:
            cursor.execute("""
                UPDATE configurations
                SET lat=?, lon=?, pins_json=?, energy_price=?, sunny_days=?, windy_days=?, wind_hours=?, 
                    ai_optimization=?, web3_enabled=?, building_consumption=?, discount=?, total_price=?, 
                    commission_forecast=?, pdf_path=COALESCE(?, pdf_path)
                WHERE deal_id=?;
            """, (lat, lon, pins_json, energy_price, sunny_days, windy_days, wind_hours, 
                  ai_optimization, web3_enabled, building_consumption, discount, total_price, 
                  commission_forecast, pdf_path, deal_id))
        else:
            cursor.execute("""
                INSERT INTO configurations (
                    deal_id, lat, lon, pins_json, energy_price, sunny_days, windy_days, wind_hours, 
                    ai_optimization, web3_enabled, building_consumption, discount, total_price, 
                    commission_forecast, pdf_path
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
            """, (deal_id, lat, lon, pins_json, energy_price, sunny_days, windy_days, wind_hours, 
                  ai_optimization, web3_enabled, building_consumption, discount, total_price, 
                  commission_forecast, pdf_path or ""))
            
        # Update status to Configured if it was Prepared
        deal_row = conn.execute("SELECT partner_id, status FROM deals WHERE id=?", (deal_id,)).fetchone()
        deal_status = deal_row["status"]
        if deal_status == "Prepared":
            cursor.execute("UPDATE deals SET status='In Progress', updated_at=? WHERE id=?", (now_str, deal_id))
            deal_status = "In Progress"
        else:
            cursor.execute("UPDATE deals SET updated_at=? WHERE id=?", (now_str, deal_id))
        
        partner_id = deal_row["partner_id"]
        
        # Update/Create commission entry
        comm_status = "Forecasted"
        if deal_status == "Won":
            comm_status = "Pending"
        elif deal_status in ["Lost", "Rejected"]:
            comm_status = "Cancelled"
            
        comm_exists = conn.execute("SELECT 1 FROM commissions WHERE deal_id = ?", (deal_id,)).fetchone()
        if comm_exists:
            cursor.execute("""
                UPDATE commissions
                SET amount_czk = ?, status = ?
                WHERE deal_id = ? AND status != 'Paid';
            """, (commission_forecast, comm_status, deal_id))
        else:
            cursor.execute("""
                INSERT INTO commissions (deal_id, partner_id, amount_czk, status)
                VALUES (?, ?, ?, ?);
            """, (deal_id, partner_id, commission_forecast, comm_status))
            
        conn.commit()
    finally:
        conn.close()

def get_commissions_summary():
    conn = get_db_connection()
    try:
        summary = conn.execute("""
            SELECT status, SUM(amount_czk) as total
            FROM commissions
            GROUP BY status;
        """).fetchall()
        return {r["status"]: r["total"] for r in summary}
    finally:
        conn.close()
