const { getDatabase } = require('./src/lib/db');

async function initializeDatabase() {
  try {
    const db = await getDatabase();
    
    // Crear tabla de artistas
    await db.exec(`
      CREATE TABLE IF NOT EXISTS artistas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Crear tabla de galería
    await db.exec(`
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
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_galeria_artista_id ON galeria(artista_id)
    `);
    
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_galeria_fecha_subida ON galeria(fecha_subida)
    `);
    
    console.log('Base de datos SQLite inicializada exitosamente');
    console.log('Archivo de base de datos: database.sqlite');
    
  } catch (error) {
    console.error('Error inicializando la base de datos:', error);
    process.exit(1);
  }
}

initializeDatabase();
