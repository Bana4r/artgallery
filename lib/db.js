import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST,  // Dirección del servidor
  user: process.env.DB_USER,  // Usuario de la base de datos
  password: process.env.DB_PASS, // Contraseña
  database: process.env.DB_NAME, // Nombre de la base de datos
});
