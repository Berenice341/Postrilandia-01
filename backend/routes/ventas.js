const express = require('express');
const pool = require('../db');

const router = express.Router();

// OBTENER VENTAS
router.get('/', async (req, res) => {
    try {
        const [ventas] = await pool.execute('SELECT * FROM ventas ORDER BY fecha DESC');
        res.json(ventas);
    } catch (err) {
        console.error('Error al obtener ventas:', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

// REGISTRAR VENTA
router.post('/', async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { carrito = [], metodoPago, montoEfectivo, datosTarjeta } = req.body;

        if (!metodoPago) {
            return res.status(400).json({ mensaje: 'Método de pago requerido' });
        }

        await connection.beginTransaction();

        // Verificar stock
        for (const item of carrito) {
            const [rows] = await connection.execute('SELECT * FROM productos WHERE id = ?', [item.id]);
            if (rows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ mensaje: `Producto "${item.nombre}" no encontrado` });
            }
            if (rows[0].stock < item.cantidad) {
                await connection.rollback();
                return res.status(400).json({ mensaje: `Stock insuficiente para "${rows[0].nombre}" (disponible: ${rows[0].stock})` });
            }
        }

        // Descontar stock
        for (const item of carrito) {
            await connection.execute(
                'UPDATE productos SET stock = stock - ? WHERE id = ?',
                [item.cantidad, item.id]
            );
        }

        // Calcular total
        const total = carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
        const cambio = metodoPago === 'efectivo' && montoEfectivo ? montoEfectivo - total : null;

        // Insertar venta
        const [ventaResult] = await connection.execute(
            'INSERT INTO ventas (total, metodo_pago, monto_efectivo, cambio, tarjeta_ultimos4, tarjeta_nombre) VALUES (?, ?, ?, ?, ?, ?)',
            [
                total,
                metodoPago,
                montoEfectivo || null,
                cambio,
                datosTarjeta ? datosTarjeta.ultimos4 : null,
                datosTarjeta ? datosTarjeta.nombre : null
            ]
        );

        const ventaId = ventaResult.insertId;

        // Insertar detalles de la venta
        for (const item of carrito) {
            await connection.execute(
                'INSERT INTO venta_detalles (venta_id, producto_id, cantidad, precio_unitario) VALUES (?, ?, ?, ?)',
                [ventaId, item.id, item.cantidad, item.precio]
            );
        }

        await connection.commit();

        // Obtener la venta recién creada para responder
        const [ventaRows] = await pool.execute('SELECT * FROM ventas WHERE id = ?', [ventaId]);

        res.json({
            id: ventaId,
            fecha: ventaRows[0].fecha,
            carrito,
            total,
            metodoPago,
            montoEfectivo: montoEfectivo || null,
            cambio
        });

    } catch (err) {
        await connection.rollback();
        console.error('Error al registrar venta:', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    } finally {
        connection.release();
    }
});

module.exports = router;
