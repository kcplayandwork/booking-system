const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

// Initialize DB
const initSqlPath = path.resolve(__dirname, 'init.sql');
const initSql = fs.readFileSync(initSqlPath, 'utf-8');

db.serialize(() => {
  db.exec(initSql, (err) => {
    if (err) {
      console.error('Error initializing database:', err);
    } else {
      console.log('Database initialized');
    }
  });
});

// Helper for promise-based queries
const query = (text, params = []) => {
  return new Promise((resolve, reject) => {
    // Basic conversion from Postgres $1, $2 to SQLite ?
    const sqliteText = text.replace(/\$\d+/g, '?');
    
    if (text.trim().toUpperCase().startsWith('SELECT') || text.trim().toUpperCase().startsWith('PRAGMA')) {
      db.all(sqliteText, params, (err, rows) => {
        if (err) reject(err);
        else resolve({ rows });
      });
    } else {
      db.run(sqliteText, params, function (err) {
        if (err) reject(err);
        else resolve({ rows: [], lastID: this.lastID, changes: this.changes });
      });
    }
  });
};

module.exports = { query, db };
