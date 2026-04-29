-- 建立資料表
CREATE TABLE IF NOT EXISTS rooms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    floor VARCHAR(20) NOT NULL,
    capacity INT NOT NULL,
    amenities TEXT,
    color VARCHAR(20) DEFAULT '#007A5E',
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    room_id INT REFERENCES rooms(id),
    title VARCHAR(200) NOT NULL,
    booker_name VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    start_hour INT NOT NULL,
    end_hour INT NOT NULL,
    checked_in BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入預設會議室資料
INSERT INTO rooms (name, floor, capacity, amenities, color) VALUES
('台北101', '12F', 20, '投影機、視訊設備、白板', '#007A5E'),
('信義廳', '12F', 10, '電視螢幕、白板', '#007A5E'),
('大安室', '11F', 6, '電視螢幕、視訊設備', '#007A5E'),
('松山小間', '11F', 4, '白板', '#007A5E'),
('南港會議室', '13F', 30, '投影機、視訊設備、白板、麥克風', '#007A5E');
