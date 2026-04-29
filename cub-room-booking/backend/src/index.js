require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { query } = require('./db');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ==========================================
// 1. 會議室 API
// ==========================================

// 取得所有會議室
app.get('/api/rooms', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM rooms WHERE is_active = 1 ORDER BY id ASC');
    // Parse amenities string to array for frontend
    const parsedRows = rows.map(r => ({
      ...r,
      amenities: r.amenities.split(',')
    }));
    res.json(parsedRows);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: '取得會議室失敗' });
  }
});

// ==========================================
// 2. 預約 API
// ==========================================

// 取得某日的預約
app.get('/api/bookings', async (req, res) => {
  try {
    const { date } = req.query;
    let sql = 'SELECT * FROM bookings';
    const params = [];

    if (date) {
      sql += ' WHERE date = ?';
      params.push(date);
    }

    sql += ' ORDER BY start_time ASC';
    const { rows } = await query(sql, params);

    const parsedRows = rows.map(r => ({
      ...r,
      checked_in: r.checked_in === 1
    }));
    res.json(parsedRows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: '取得預約清單失敗' });
  }
});

// 新增預約
app.post('/api/bookings', async (req, res) => {
  try {
    const { room_id, title, booker_name, date, start_time, end_time } = req.body;

    // 檢查是否有時間衝突
    const conflictQuery = \`
      SELECT id FROM bookings 
      WHERE room_id = ? 
        AND date = ? 
        AND (
          (start_time < ? AND end_time > ?)
        )
    \`;
    const conflictResult = await query(conflictQuery, [room_id, date, end_time, start_time]);
    
    if (conflictResult.rows.length > 0) {
      return res.status(400).json({ error: '該時段已被預約' });
    }

    const insertQuery = \`
      INSERT INTO bookings (room_id, title, booker_name, date, start_time, end_time, checked_in) 
      VALUES (?, ?, ?, ?, ?, ?, 0) 
      RETURNING *
    \`;
    const { rows } = await query(insertQuery, [room_id, title, booker_name, date, start_time, end_time]);
    
    const inserted = { ...rows[0], checked_in: rows[0].checked_in === 1 };
    res.status(201).json(inserted);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: '新增預約失敗' });
  }
});

// 更新預約 (報到/取消)
app.put('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // action: 'check_in'

    if (action === 'check_in') {
      const { rows } = await query(
        'UPDATE bookings SET checked_in = 1 WHERE id = ? RETURNING *',
        [id]
      );
      if (rows.length === 0) return res.status(404).json({ error: '找不到該預約' });
      
      return res.json({ ...rows[0], checked_in: true });
    }

    res.status(400).json({ error: '無效的操作' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: '更新預約失敗' });
  }
});

// 取消預約 (刪除)
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM bookings WHERE id = ?', [id]);
    res.json({ message: '已取消預約' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: '取消預約失敗' });
  }
});

// 釋放幽靈預訂 (超過開始時間 15 分鐘未報到者)
app.post('/api/bookings/release-ghosts', async (req, res) => {
  try {
    const { date, current_time } = req.body; 
    
    // SQLite doesn't have an easy interval subtraction in TIME comparison like Postgres,
    // so we'll fetch them, check in JS, and delete.
    const { rows } = await query('SELECT id, start_time FROM bookings WHERE date = ? AND checked_in = 0', [date]);
    
    let releasedCount = 0;
    
    for (const booking of rows) {
      // Create full datetime strings to compare easily using standard JS Date or simple math
      // current_time is like "10:30", booking.start_time is like "10:00"
      const currentMin = parseInt(current_time.split(':')[0]) * 60 + parseInt(current_time.split(':')[1]);
      const startMin = parseInt(booking.start_time.split(':')[0]) * 60 + parseInt(booking.start_time.split(':')[1]);
      
      if (currentMin - startMin >= 15) {
        await query('DELETE FROM bookings WHERE id = ?', [booking.id]);
        releasedCount++;
      }
    }
    
    res.json({ 
      message: \`已釋放 \${releasedCount} 筆幽靈預訂\`,
      released_count: releasedCount
    });
  } catch (error) {
    console.error('Error releasing ghost bookings:', error);
    res.status(500).json({ error: '釋放幽靈預訂失敗' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.send('OK');
});

app.listen(port, () => {
  console.log(\`Backend server running on port \${port}\`);
});
