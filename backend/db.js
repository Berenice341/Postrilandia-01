const mysql = require('mysql2/promise');

// Creamos un pool de conexiones para manejar múltiples peticiones eficientemente
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    // La configuración SSL es obligatoria para Aiven
    ssl: {
        rejectUnauthorized: false
    }
});

// Exportamos el pool para usarlo en tus rutas
module.exports = pool;