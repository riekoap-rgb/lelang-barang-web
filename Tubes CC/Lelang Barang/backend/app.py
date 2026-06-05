import os
import time
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)
CORS(app)

DB_HOST = os.environ.get('DB_HOST', 'db')
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'rootpassword')
DB_NAME = os.environ.get('DB_NAME', 'db_lelang')

def get_db_connection():
    """Establishes connection to the MySQL database."""
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )

def wait_for_db():
    """Waits for the database to become available before starting Flask application."""
    print("Connecting to database...", flush=True)
    retries = 30
    while retries > 0:
        try:
            conn = get_db_connection()
            if conn.is_connected():
                conn.close()
                print("Database is ready!", flush=True)
                return True
        except Error as e:
            print(f"Database not ready yet. Retrying in 2 seconds... (Errors: {e})", flush=True)
            time.sleep(2)
            retries -= 1
    raise Exception("Could not connect to database after several retries.")

# Helper to serialize datetimes
def serialize_datetime(obj):
    if isinstance(obj, (datetime.datetime, datetime.date)):
        return obj.isoformat()
    raise TypeError("Type not serializable")

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "healthy", "time": datetime.datetime.now().isoformat()})

# --- USER AUTHENTICATION ---

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"status": "error", "message": "Username and password are required"}), 400
    
    username = data['username']
    password = data['password']

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT id, username, password, role FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        
        if user and user['password'] == password:  # In real apps, use hashing. Plain text is used here for simplicity.
            return jsonify({
                "status": "success",
                "message": "Login successful",
                "user": {
                    "id": user['id'],
                    "username": user['username'],
                    "role": user['role']
                }
            })
        else:
            return jsonify({"status": "error", "message": "Username atau Password salah!"}), 401
    except Error as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or 'username' not in data or 'password' not in data:
        return jsonify({"status": "error", "message": "Username and password are required"}), 400
    
    username = data['username']
    password = data['password']
    role = data.get('role', 'user')

    if role not in ['admin', 'user']:
        role = 'user'

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Check if username exists
        cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
        if cursor.fetchone():
            return jsonify({"status": "error", "message": "Username sudah digunakan!"}), 400

        # Insert user
        cursor.execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
            (username, password, role)
        )
        conn.commit()
        return jsonify({"status": "success", "message": "Registrasi berhasil!"})
    except Error as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# --- AUCTION ITEMS ---

@app.route('/api/barang', methods=['GET'])
def get_barang():
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Select items along with winner's username if any
        query = """
            SELECT b.id, b.nama_barang, b.deskripsi, b.harga_awal, b.harga_sekarang, 
                   b.tanggal_mulai, b.tanggal_selesai, b.status, b.pemenang_id, u.username as pemenang_nama
            FROM barang_lelang b
            LEFT JOIN users u ON b.pemenang_id = u.id
            ORDER BY b.id DESC
        """
        cursor.execute(query)
        items = cursor.fetchall()
        
        # Convert datetime objects to string
        for item in items:
            item['tanggal_mulai'] = serialize_datetime(item['tanggal_mulai'])
            item['tanggal_selesai'] = serialize_datetime(item['tanggal_selesai'])
            item['harga_awal'] = float(item['harga_awal'])
            item['harga_sekarang'] = float(item['harga_sekarang'])
            
        return jsonify(items)
    except Error as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@app.route('/api/barang', methods=['POST'])
def tambah_barang():
    data = request.get_json()
    required = ['nama_barang', 'deskripsi', 'harga_awal', 'durasi_menit']
    if not data or not all(k in data for k in required):
        return jsonify({"status": "error", "message": "Data barang lelang tidak lengkap!"}), 400
    
    nama_barang = data['nama_barang']
    deskripsi = data['deskripsi']
    
    try:
        harga_awal = float(data['harga_awal'])
        durasi_menit = int(data['durasi_menit'])
    except ValueError:
        return jsonify({"status": "error", "message": "Harga dan durasi harus berupa angka!"}), 400

    now = datetime.datetime.now()
    tanggal_selesai = now + datetime.timedelta(minutes=durasi_menit)

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            """INSERT INTO barang_lelang 
               (nama_barang, deskripsi, harga_awal, harga_sekarang, tanggal_mulai, tanggal_selesai, status) 
               VALUES (%s, %s, %s, %s, %s, %s, 'aktif')""",
            (nama_barang, deskripsi, harga_awal, harga_awal, now, tanggal_selesai)
        )
        conn.commit()
        return jsonify({"status": "success", "message": "Barang lelang berhasil ditambahkan!"})
    except Error as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

# --- BIDDING TRANSITIONS ---

@app.route('/api/barang/<int:barang_id>/bid', methods=['POST'])
def place_bid(barang_id):
    data = request.get_json()
    if not data or 'user_id' not in data or 'jumlah_tawaran' not in data:
        return jsonify({"status": "error", "message": "Data bid tidak lengkap!"}), 400
    
    user_id = data['user_id']
    try:
        jumlah_tawaran = float(data['jumlah_tawaran'])
    except ValueError:
        return jsonify({"status": "error", "message": "Jumlah tawaran harus berupa angka!"}), 400

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Get current item status and price
        cursor.execute("SELECT status, harga_sekarang, tanggal_selesai FROM barang_lelang WHERE id = %s", (barang_id,))
        item = cursor.fetchone()
        
        if not item:
            return jsonify({"status": "error", "message": "Barang lelang tidak ditemukan!"}), 404
        
        if item['status'] != 'aktif':
            return jsonify({"status": "error", "message": "Lelang untuk barang ini sudah ditutup!"}), 400
        
        now = datetime.datetime.now()
        if item['tanggal_selesai'] < now:
            # Auto close check
            cursor.execute("UPDATE barang_lelang SET status = 'selesai' WHERE id = %s", (barang_id,))
            conn.commit()
            return jsonify({"status": "error", "message": "Waktu lelang barang ini sudah habis!"}), 400

        harga_sekarang = float(item['harga_sekarang'])
        if jumlah_tawaran <= harga_sekarang:
            return jsonify({"status": "error", "message": f"Tawaran harus lebih tinggi dari harga sekarang (Rp {harga_sekarang:,.0f})!"}), 400

        # Place the bid
        cursor.execute(
            "INSERT INTO tawaran_lelang (barang_id, user_id, jumlah_tawaran, waktu_tawaran) VALUES (%s, %s, %s, %s)",
            (barang_id, user_id, jumlah_tawaran, now)
        )
        
        # Update the current highest bid and winner in item details
        cursor.execute(
            "UPDATE barang_lelang SET harga_sekarang = %s, pemenang_id = %s WHERE id = %s",
            (jumlah_tawaran, user_id, barang_id)
        )
        
        conn.commit()
        return jsonify({"status": "success", "message": "Tawaran Anda berhasil diajukan!"})
    except Error as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@app.route('/api/barang/<int:barang_id>/tawaran', methods=['GET'])
def get_tawaran_history(barang_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        query = """
            SELECT t.id, t.jumlah_tawaran, t.waktu_tawaran, u.username
            FROM tawaran_lelang t
            JOIN users u ON t.user_id = u.id
            WHERE t.barang_id = %s
            ORDER BY t.jumlah_tawaran DESC
        """
        cursor.execute(query, (barang_id,))
        tawaran = cursor.fetchall()
        
        for t in tawaran:
            t['waktu_tawaran'] = serialize_datetime(t['waktu_tawaran'])
            t['jumlah_tawaran'] = float(t['jumlah_tawaran'])
            
        return jsonify(tawaran)
    except Error as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

@app.route('/api/barang/<int:barang_id>/tutup', methods=['POST'])
def tutup_lelang(barang_id):
    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        
        # Verify item exists
        cursor.execute("SELECT status FROM barang_lelang WHERE id = %s", (barang_id,))
        item = cursor.fetchone()
        if not item:
            return jsonify({"status": "error", "message": "Barang lelang tidak ditemukan!"}), 404
            
        # Update status to closed
        cursor.execute("UPDATE barang_lelang SET status = 'ditutup' WHERE id = %s", (barang_id,))
        
        # Get winner details
        cursor.execute("""
            SELECT b.harga_sekarang, u.username as pemenang_nama
            FROM barang_lelang b
            LEFT JOIN users u ON b.pemenang_id = u.id
            WHERE b.id = %s
        """, (barang_id,))
        res = cursor.fetchone()
        
        conn.commit()
        return jsonify({
            "status": "success", 
            "message": "Lelang berhasil ditutup!",
            "pemenang": res['pemenang_nama'] if res['pemenang_nama'] else "Tidak ada penawar",
            "harga_akhir": float(res['harga_sekarang'])
        })
    except Error as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    finally:
        if cursor: cursor.close()
        if conn: conn.close()

if __name__ == '__main__':
    # Initial startup block: wait for db connection
    wait_for_db()
    app.run(host='0.0.0.0', port=5000)
