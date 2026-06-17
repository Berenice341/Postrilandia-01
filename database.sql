DROP DATABASE IF EXISTS postrilandia;
CREATE DATABASE postrilandia;
USE postrilandia;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    correo VARCHAR(150) UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    email_verificado TINYINT(1) NOT NULL DEFAULT 0,
    token_verificacion VARCHAR(255),
    token_recuperacion VARCHAR(255),
    token_recuperacion_exp DATETIME
);

CREATE TABLE IF NOT EXISTS categorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    precio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    descripcion TEXT,
    imagen TEXT,
    categoria_id INT,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ventas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    total DECIMAL(10, 2) NOT NULL,
    metodo_pago VARCHAR(50) NOT NULL,
    monto_efectivo DECIMAL(10, 2),
    cambio DECIMAL(10, 2),
    tarjeta_ultimos4 VARCHAR(4),
    tarjeta_nombre VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS venta_detalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    venta_id INT NOT NULL,
    producto_id INT,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE SET NULL
);

-- ============================================================
-- Usuarios demo con contraseñas hasheadas con bcrypt (costo 12)
-- Las contraseñas originales son: admin → "admin1234" | cliente → "cliente1234"
-- Para resetear: ejecuta este SQL y actualiza .env con tus credenciales SMTP
-- email_verificado = 1 porque son cuentas demo sin correo real
-- ============================================================
INSERT INTO usuarios (usuario, correo, password, rol, email_verificado)
VALUES
    ('admin',   NULL, '$2b$12$gPxHLCGRklm.mJKDTHKI3euMz3N4oTL/RIz4YpFHm5QMfLf1w9NJe', 'admin',   1),
    ('cliente', NULL, '$2b$12$Kt5f9ULUR3LKiT4hIGCK3.vKN5H55mLe6JLSyLdOoXWg2DIf34Fxq', 'cliente', 1);
-- NOTA: Los hashes anteriores son solo de ejemplo visual.
-- El script seed.js genera los hashes reales automáticamente.