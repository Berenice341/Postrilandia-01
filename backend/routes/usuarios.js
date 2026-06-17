const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { enviarVerificacion, enviarRecuperacion } = require('../mailer');

const router = express.Router();

// ============================================================
// LOGIN
// ============================================================
router.post('/login', async (req, res) => {
    try {
        const { usuario, password, rol } = req.body;

        const [rows] = await pool.execute(
            'SELECT * FROM usuarios WHERE usuario = ? AND rol = ?',
            [usuario, rol]
        );

        if (rows.length === 0) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        const user = rows[0];

        let passwordValida = false;
        if (user.password.startsWith('$2')) {
            passwordValida = await bcrypt.compare(password, user.password);
        } else {
            passwordValida = (password === user.password);
        }

        if (!passwordValida) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        if (user.correo && user.email_verificado === 0) {
            return res.status(403).json({
                mensaje: 'Debes verificar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.'
            });
        }

        res.json({ mensaje: 'Login correcto', rol: user.rol, usuario: user.usuario });

    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

// ============================================================
// REGISTRO - Corregido con parámetros seguros
// ============================================================
router.post('/registro', async (req, res) => {
    try {
        const { usuario, correo, password, rol } = req.body;

        if (!usuario || !correo || !password || !rol) {
            return res.status(400).json({ mensaje: 'Todos los campos son obligatorios' });
        }
        if (password.length < 6) {
            return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            return res.status(400).json({ mensaje: 'El correo no tiene un formato válido' });
        }

        const [existe] = await pool.execute(
            'SELECT id FROM usuarios WHERE usuario = ? OR correo = ?',
            [usuario, correo]
        );
        if (existe.length > 0) {
            return res.status(409).json({ mensaje: 'El usuario o correo ya está registrado' });
        }

        // Corrección: Uso de parámetro seguro para evitar error de columna
        if (rol === 'admin') {
            const [adminExiste] = await pool.execute('SELECT id FROM usuarios WHERE rol = ?', ['admin']);
            if (adminExiste.length > 0) {
                return res.status(403).json({ mensaje: 'Ya existe un administrador registrado. Solo puede haber uno.' });
            }
        }

        const hash = await bcrypt.hash(password, 12);
        const token = uuidv4();

        await pool.execute(
            `INSERT INTO usuarios (usuario, correo, password, rol, email_verificado, token_verificacion)
             VALUES (?, ?, ?, ?, 0, ?)`,
            [usuario, correo, hash, rol, token]
        );

        //await enviarVerificacion(correo, token);

        res.status(201).json({
            mensaje: `¡Cuenta creada! Hemos enviado un enlace de verificación a ${correo}.`
        });

    } catch (err) {
        console.error('Error en registro:', err);
        res.status(500).json({ mensaje: 'Error al crear la cuenta. Intenta de nuevo.' });
    }
});

// (El resto de tus rutas siguen siendo iguales...)
router.get('/verificar/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const [rows] = await pool.execute('SELECT id FROM usuarios WHERE token_verificacion = ?', [token]);
        if (rows.length === 0) return res.status(400).json({ mensaje: 'El enlace es inválido.' });
        await pool.execute('UPDATE usuarios SET email_verificado = 1, token_verificacion = NULL WHERE token_verificacion = ?', [token]);
        res.json({ mensaje: '¡Correo verificado!' });
    } catch (err) { res.status(500).json({ mensaje: 'Error del servidor' }); }
});

module.exports = router;