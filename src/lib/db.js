const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let db = null;

async function getDatabase() {
  if (!db) {
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'database.sqlite');
    
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Habilitar foreign keys
    await db.exec('PRAGMA foreign_keys = ON;');
  }
  return db;
}

module.exports = { getDatabase };
