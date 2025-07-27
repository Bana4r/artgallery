const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let db = null;

async function initializeTables() {
  const database = await getDatabase();
  
  try {
    // Crear tabla de artistas
    await database.exec(`
      CREATE TABLE IF NOT EXISTS artistas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Crear tabla de galería
    await database.exec(`
      CREATE TABLE IF NOT EXISTS galeria (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        artista_id INTEGER NOT NULL,
        imagen TEXT NOT NULL,
        formato TEXT NOT NULL,
        fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE
      )
    `);
    
    // Crear índices para mejorar rendimiento
    await database.exec(`
      CREATE INDEX IF NOT EXISTS idx_galeria_artista_id ON galeria(artista_id)
    `);
    
    await database.exec(`
      CREATE INDEX IF NOT EXISTS idx_galeria_fecha_subida ON galeria(fecha_subida)
    `);
    
    console.log('✅ Base de datos SQLite inicializada exitosamente');
    
  } catch (error) {
    console.error('❌ Error inicializando las tablas de la base de datos:', error);
    throw error;
  }
}

async function getDatabase() {
  if (!db) {
    const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'database.sqlite');
    
    try {
      db = await open({
        filename: dbPath,
        driver: sqlite3.Database
      });

      // Habilitar foreign keys
      await db.exec('PRAGMA foreign_keys = ON;');
      
      // Inicializar las tablas automáticamente
      await initializeTables();
      
    } catch (error) {
      console.error('❌ Error conectando a la base de datos:', error);
      throw error;
    }
  }
  return db;
}

module.exports = { getDatabase };
