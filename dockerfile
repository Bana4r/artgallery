FROM node:20-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json* ./

# Instalar dependencias
RUN npm ci

# Copiar el resto de los archivos del proyecto
COPY . .

# Construir la aplicación Next.js para producción
RUN npm run build

# Exponer el puerto que usa Next.js
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]