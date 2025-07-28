This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Como usarlo

Este proyecto ahora utiliza SQLite como base de datos, lo que lo hace mucho más simple de configurar ya que no requiere un servidor de base de datos externo.

Para ejecutar el proyecto de Next.js puedes hacer lo siguiente:

Instalar los componentes necesarios con:
```bash
npm install
```

La base de datos SQLite se inicializa automáticamente al ejecutar la aplicación, por lo que ya no necesitas ejecutar comandos adicionales.

Si quieres ejecutar, modificar el código y ver los cambios a tiempo real ejecuta:
```bash
npm run dev
```

Si quieres construir el proyecto para ver el resultado ejecuta:
```bash
npm run build
```

Si quieres ejecutar el producto final ejecuta:
```bash
npm start
```

Todo esto dentro de la carpeta del proyecto.

## Base de datos SQLite

Este proyecto utiliza SQLite como base de datos, lo que significa que:

- **No necesitas instalar ningún servidor de base de datos**
- **La base de datos es un archivo local** (`database.sqlite`)
- **Se inicializa automáticamente** al ejecutar la aplicación
- **Es perfecta para desarrollo y proyectos pequeños a medianos**
- **Fácil de respaldar** (solo copia el archivo)

### Configuración opcional

Si quieres especificar una ruta personalizada para la base de datos, puedes crear un archivo `.env`:

```env
# Opcional: especifica la ruta de la base de datos SQLite
DB_PATH=./mi_base_de_datos.sqlite
```

Si no especificas nada, se usará `database.sqlite` en la raíz del proyecto.

### Estructura de la base de datos

La base de datos se inicializa automáticamente cuando se ejecuta la aplicación (`npm run dev` o `npm start`) y crea las siguientes tablas:

```sql
-- Tabla de artistas
CREATE TABLE artistas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de galería de imágenes
CREATE TABLE galeria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    artista_id INTEGER NOT NULL,
    imagen TEXT NOT NULL,
    formato TEXT NOT NULL,
    fecha_subida DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (artista_id) REFERENCES artistas(id) ON DELETE CASCADE
);
```

## Ventajas de SQLite

- ✅ **Sin configuración de servidor**: No necesitas MySQL, PostgreSQL u otro servidor
- ✅ **Portabilidad**: La base de datos es un solo archivo
- ✅ **Rendimiento**: Excelente para aplicaciones pequeñas y medianas
- ✅ **Simplicidad**: Fácil de respaldar y migrar
- ✅ **Sin dependencias externas**: Todo funciona localmente

Para aplicaciones más grandes, puedes migrar fácilmente a PostgreSQL u otra base de datos más robusta cuando sea necesario.

