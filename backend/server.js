require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Importación de rutas
const productosRoutes = require('./routes/productos');
const categoriasRoutes = require('./routes/categorias');
const usuariosRoutes = require('./routes/usuarios');
const ventasRoutes = require('./routes/ventas');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Servir el frontend estático
// NOTA: Asegúrate de que esta carpeta exista en la raíz de tu repo
app.use(express.static(path.join(__dirname, '../frontend')));

// Rutas de la API
app.use('/productos', productosRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/usuarios', usuariosRoutes);
app.use('/ventas', ventasRoutes);

// Ruta para manejar el inicio (opcional, por si quieres ver algo al entrar a la URL raíz)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Configuración del puerto para Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor en ejecución en el puerto ${PORT}`);
});