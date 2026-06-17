require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const productosRoutes = require('./routes/productos');
const categoriasRoutes = require('./routes/categorias');
const usuariosRoutes = require('./routes/usuarios');
const ventasRoutes = require('./routes/ventas');

const app = express();

app.use(cors());
app.use(express.json());

// Servir el frontend estático
app.use(express.static(path.join(__dirname, '../frontend')));

// =====================
// RUTAS API
// =====================
app.use('/productos', productosRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/ventas', ventasRoutes);

// =====================
const os = require('os');

// Obtener la IP local
const interfaces = os.networkInterfaces();
let localIp = 'localhost';
for (let iface in interfaces) {
    for (let i = 0; i < interfaces[iface].length; i++) {
        const alias = interfaces[iface][i];
        if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
            localIp = alias.address;
            break;
        }
    }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor en http://localhost:${PORT}`);
    console.log(`📱 Para acceder desde tu teléfono o la red, abre: http://${localIp}:${PORT}/login.html`);
    console.log(`   (Asegúrate de que el puerto esté abierto y estés en el mismo WiFi)`);
});
