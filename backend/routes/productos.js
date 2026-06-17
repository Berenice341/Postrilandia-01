const express = require('express');
const pool = require('../db');

const router = express.Router();

// OBTENER PRODUCTOS
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM productos');
        // Convertir categoria_id a categoriaId para mantener compatibilidad con el frontend
        const productos = rows.map(p => ({
            id: p.id,
            nombre: p.nombre,
            precio: Number(p.precio),
            stock: p.stock,
            descripcion: p.descripcion,
            imagen: p.imagen,
            categoriaId: p.categoria_id
        }));
        res.json(productos);
    } catch (err) {
        console.error('Error al obtener productos:', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

// AGREGAR PRODUCTO
router.post('/', async (req, res) => {
    try {
        const { nombre, precio, stock, descripcion, imagen, categoriaId } = req.body;
        const [result] = await pool.execute(
            'INSERT INTO productos (nombre, precio, stock, descripcion, imagen, categoria_id) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre || '', Number(precio) || 0, Number(stock) || 0, descripcion || '', imagen || '', categoriaId || null]
        );

        const nuevoProducto = {
            id: result.insertId,
            nombre: nombre || '',
            precio: Number(precio) || 0,
            stock: Number(stock) || 0,
            descripcion: descripcion || '',
            imagen: imagen || '',
            categoriaId: categoriaId ? Number(categoriaId) : null
        };

        res.json(nuevoProducto);
    } catch (err) {
        console.error('Error al agregar producto:', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

// EDITAR PRODUCTO
router.put('/:id', async (req, res) => {
    try {
        const { nombre, precio, stock, descripcion, imagen, categoriaId } = req.body;
        const [result] = await pool.execute(
            'UPDATE productos SET nombre = ?, precio = ?, stock = ?, descripcion = ?, imagen = ?, categoria_id = ? WHERE id = ?',
            [nombre, Number(precio), Number(stock), descripcion, imagen, categoriaId || null, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        res.json({ mensaje: 'Producto actualizado' });
    } catch (err) {
        console.error('Error al editar producto:', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

// ELIMINAR PRODUCTO
router.delete('/:id', async (req, res) => {
    try {
        const [result] = await pool.execute('DELETE FROM productos WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ mensaje: 'Producto no encontrado' });
        }

        res.json({ mensaje: 'Producto eliminado' });
    } catch (err) {
        console.error('Error al eliminar producto:', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

module.exports = router;
