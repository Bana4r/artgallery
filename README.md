This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).
# ESTA VERSION ESTA HECHA PARA USARSE EN JENKINS, SI NO LO TIENES CONFIGURADO USA MAIN EN DADO CASO, SOLO SE AÑADEN ARCHIVOS DE .ENV Y JENKINSFILE
## Como usarlo
Primero deberas enlazarlo a la base de datos, despues para ejecutar el proyecto de next.js puedes hacer lo siguiente

instalar los componentes necesario con:
```npm install```

si guieres ejecutar, modificar el codigo y ver los cambios a tiempo real ejecuta:
```npm run dev```
si quieres construir el proyecto para ver el resultado ejecuta:
```npm build```
si quieres ejecutar el producto final ejecuta:
```npm start```
todo esto dentro de la carpeta del proyecto

## Enlazar base de datos

para poder hacerlo primero necesitar un archivo .env o .local.env para poder hacerlo funcionar, en caso de que sea .env deberas ponerle una linea como:
```.env
DATABASE_URL=mysql://<usuario_de_la_base_de_datos>:<contraseña>@<direccion_de_la_base_de_datos>:<puerto>/perfectimages
```
en caso de que sea .local.env deberas de usar la siguiente estructura

```.local.env
DB_HOST=Direccion_de_la_base_de_datos
DB_PORT=Puerto
DB_USER=Usuario_de_la_base_de_datos
DB_PASS=contraseña
DB_NAME=perfectimages
```

la estructura de la base de datos es simple solo copia esto y pegalo en un esquema de base de datos como mysql o mariadb
```sql
CREATE DATABASE perfectimages;
USE perfectimages;

CREATE TABLE IF NOT EXISTS artistas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL UNIQUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS galeria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    artista_id INT NOT NULL,
    imagen VARCHAR(255) NOT NULL,
    formato VARCHAR(10) NOT NULL, -- Ejemplo: jpg, png, gif
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE
);
```

## En caso de error al intentar cargar la base de datos

modifica el dodigo de db.js y añade los parametros de tu base de datos despues de "||" como se muestra en el ejemplo

```Js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '1234',
  database: process.env.DB_NAME || 'perfectimages',
});

module.exports = pool;
```

aunque siempre se recomienda utilizar un .env para realizar la conexion

tambien recuerda que debe de ser "mysql" en el host ya que si esta como locahost docker no lo reconocera

## Despegar en vercel

no se puede realizar eso ya que vercel maneja los archivos de forma estatica y no permite la escritura o generacion de estos

