const express = require('express');
const pool = require('../db');

const router = express.Router();

// OBTENER
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.execute('SELECT * FROM categorias');
        res.json(rows);
    } catch (err) {
        console.error('Error al obtener categorías:', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

// AGREGAR
router.post('/', async (req, res) => {
    try {
        const [result] = await pool.execute(
            'INSERT INTO categorias (nombre) VALUES (?)',
            [req.body.nombre]
        );
        res.json({ id: result.insertId, nombre: req.body.nombre });
    } catch (err) {
        console.error('Error al agregar categoría:', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

// ELIMINAR
router.delete('/:id', async (req, res) => {
    try {
        await pool.execute('DELETE FROM categorias WHERE id = ?', [req.params.id]);
        res.json({ mensaje: 'Categoría eliminada' });
    } catch (err) {
        console.error('Error al eliminar categoría:', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

module.exports = router;
