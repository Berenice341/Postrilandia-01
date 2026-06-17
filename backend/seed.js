/**
 * seed.js — Recrea la BD e inserta usuarios demo con contraseñas hasheadas
 * Ejecuta: node seed.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

async function seed() {
    const conn = await mysql.createConnection({
        host: 'localhost',
        port: 3306,
        user: 'luisjose',
        password: '1234',
        multipleStatements: true
    });

    console.log('🔄 Creando base de datos...');
    await conn.query(`DROP DATABASE IF EXISTS postrilandia`);
    await conn.query(`CREATE DATABASE postrilandia`);
    await conn.query(`USE postrilandia`);

    await conn.query(`
        CREATE TABLE usuarios (
            id INT AUTO_INCREMENT PRIMARY KEY,
            usuario VARCHAR(50) NOT NULL UNIQUE,
            correo VARCHAR(150) UNIQUE,
            password VARCHAR(255) NOT NULL,
            rol VARCHAR(20) NOT NULL,
            email_verificado TINYINT(1) NOT NULL DEFAULT 0,
            token_verificacion VARCHAR(255),
            token_recuperacion VARCHAR(255),
            token_recuperacion_exp DATETIME
        )
    `);

    await conn.query(`
        CREATE TABLE categorias (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL
        )
    `);

    await conn.query(`
        CREATE TABLE productos (
            id INT AUTO_INCREMENT PRIMARY KEY,
            nombre VARCHAR(100) NOT NULL,
            precio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            stock INT NOT NULL DEFAULT 0,
            descripcion TEXT,
            imagen TEXT,
            categoria_id INT,
            FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
        )
    `);

    await conn.query(`
        CREATE TABLE ventas (
            id INT AUTO_INCREMENT PRIMARY KEY,
            fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
            total DECIMAL(10,2) NOT NULL,
            metodo_pago VARCHAR(50) NOT NULL,
            monto_efectivo DECIMAL(10,2),
            cambio DECIMAL(10,2),
            tarjeta_ultimos4 VARCHAR(4),
            tarjeta_nombre VARCHAR(100)
        )
    `);

    await conn.query(`
        CREATE TABLE venta_detalles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            venta_id INT NOT NULL,
            producto_id INT,
            cantidad INT NOT NULL,
            precio_unitario DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
            FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
        )
    `);

    console.log('🔐 Hasheando contraseñas demo...');
    const hashAdmin   = await bcrypt.hash('1234', 12);
    const hashCliente = await bcrypt.hash('1234', 12);

    await conn.query(
        `INSERT INTO usuarios (usuario, correo, password, rol, email_verificado) VALUES
         ('admin', NULL, ?, 'admin', 1),
         ('cliente', NULL, ?, 'cliente', 1)`,
        [hashAdmin, hashCliente]
    );

    console.log('✅ Base de datos inicializada.');
    console.log('   • admin / 1234  (rol: admin)');
    console.log('   • cliente / 1234  (rol: cliente)');
    await conn.end();
}

seed().catch(err => {
    console.error('❌ Error en seed:', err.message);
    process.exit(1);
});
