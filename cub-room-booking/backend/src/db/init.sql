CREATE TABLE IF NOT EXISTS rooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    floor VARCHAR(50) NOT NULL,
    capacity INT NOT NULL,
    amenities TEXT NOT NULL,
    color VARCHAR(20) DEFAULT '#007A5E',
    is_active BOOLEAN DEFAULT 1
);

CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    booker_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    checked_in BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(room_id) REFERENCES rooms(id)
);

-- 預設會議室資料
INSERT INTO rooms (name, floor, capacity, amenities, color) 
SELECT '台北101', '12F', 20, '投影機,視訊設備,白板', '#007A5E'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE name = '台北101');

INSERT INTO rooms (name, floor, capacity, amenities, color) 
SELECT '信義廳', '12F', 10, '電視螢幕,白板', '#007A5E'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE name = '信義廳');

INSERT INTO rooms (name, floor, capacity, amenities, color) 
SELECT '大安室', '11F', 6, '電視螢幕,視訊設備', '#007A5E'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE name = '大安室');

INSERT INTO rooms (name, floor, capacity, amenities, color) 
SELECT '松山小間', '11F', 4, '白板', '#007A5E'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE name = '松山小間');

INSERT INTO rooms (name, floor, capacity, amenities, color) 
SELECT '南港會議室', '13F', 30, '投影機,視訊設備,白板,麥克風', '#007A5E'
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE name = '南港會議室');
