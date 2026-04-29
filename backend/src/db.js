const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://cub_admin:cub_password@localhost:5432/room_booking',
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
