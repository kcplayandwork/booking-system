const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get all rooms
app.get('/api/rooms', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM rooms WHERE is_active = true ORDER BY floor, name');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '無法取得會議室清單' });
  }
});

// Get bookings for a date
app.get('/api/bookings', async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: '請提供日期' });
  }
  try {
    const result = await db.query(
      'SELECT b.*, r.name as room_name, r.floor as room_floor FROM bookings b JOIN rooms r ON b.room_id = r.id WHERE date = $1 ORDER BY start_hour',
      [date]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '無法取得預訂清單' });
  }
});

// Create a booking
app.post('/api/bookings', async (req, res) => {
  const { room_id, title, booker_name, date, start_hour, end_hour } = req.body;
  if (!room_id || !title || !booker_name || !date || start_hour === undefined || end_hour === undefined) {
    return res.status(400).json({ error: '缺少必填欄位' });
  }

  try {
    // Check for conflicts
    const conflictCheck = await db.query(
      `SELECT * FROM bookings 
       WHERE room_id = $1 AND date = $2 
       AND ($3 < end_hour AND $4 > start_hour)`,
      [room_id, date, start_hour, end_hour]
    );

    if (conflictCheck.rows.length > 0) {
      return res.status(409).json({ error: '該時段已被預訂，請選擇其他時段' });
    }

    const result = await db.query(
      `INSERT INTO bookings (room_id, title, booker_name, date, start_hour, end_hour) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [room_id, title, booker_name, date, start_hour, end_hour]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '無法建立預訂' });
  }
});

// Check in
app.put('/api/bookings/:id/checkin', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'UPDATE bookings SET checked_in = true WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '找不到該預訂' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '無法完成報到' });
  }
});

// Cancel booking
app.delete('/api/bookings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM bookings WHERE id = $1 RETURNING *',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: '找不到該預訂' });
    }
    res.json({ message: '預訂已取消', deleted: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '無法取消預訂' });
  }
});

// Release ghost bookings (ghosts are bookings where current hour > start_hour + 1 and not checked in)
// Note: We use a simulated current time for the sake of the demo or just pass current hour from frontend
app.post('/api/bookings/release-ghosts', async (req, res) => {
  const { current_date, current_hour } = req.body;
  if (!current_date || current_hour === undefined) {
    return res.status(400).json({ error: '缺少當前日期或小時' });
  }
  
  try {
    const result = await db.query(
      `DELETE FROM bookings 
       WHERE date = $1 
       AND start_hour < $2 
       AND checked_in = false 
       RETURNING *`,
      [current_date, current_hour]
    );
    res.json({ message: `已釋放 ${result.rows.length} 筆幽靈預訂`, released: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '無法釋放幽靈預訂' });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', async (req, res) => {
  const { date, current_hour } = req.query;
  if (!date || current_hour === undefined) {
    return res.status(400).json({ error: '缺少參數' });
  }

  try {
    const roomsResult = await db.query('SELECT COUNT(*) FROM rooms WHERE is_active = true');
    const totalRooms = parseInt(roomsResult.rows[0].count, 10);

    const bookingsResult = await db.query('SELECT * FROM bookings WHERE date = $1', [date]);
    const bookings = bookingsResult.rows;

    const totalBookings = bookings.length;
    let ghostCount = 0;
    let availableNowCount = totalRooms;

    const activeNowRooms = new Set();

    bookings.forEach(b => {
      // Check if it's a ghost booking
      if (b.start_hour < parseInt(current_hour, 10) && !b.checked_in) {
        ghostCount++;
      }
      // Check if currently occupied
      if (b.start_hour <= parseInt(current_hour, 10) && b.end_hour > parseInt(current_hour, 10)) {
        activeNowRooms.add(b.room_id);
      }
    });

    availableNowCount -= activeNowRooms.size;

    // Simple usage rate calculation for the day (09:00 - 19:00 = 10 hours)
    const totalPossibleHours = totalRooms * 10;
    let totalBookedHours = 0;
    bookings.forEach(b => {
      totalBookedHours += (b.end_hour - b.start_hour);
    });

    const usageRate = totalPossibleHours > 0 ? Math.round((totalBookedHours / totalPossibleHours) * 100) : 0;

    res.json({
      usageRate,
      totalBookings,
      ghostCount,
      availableNowCount
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '無法取得統計資料' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
