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

        // Verificar contraseña (soporta bcrypt y texto plano legacy)
        let passwordValida = false;
        if (user.password.startsWith('$2')) {
            // Contraseña hasheada con bcrypt
            passwordValida = await bcrypt.compare(password, user.password);
        } else {
            // Contraseña legacy en texto plano
            passwordValida = (password === user.password);
        }

        if (!passwordValida) {
            return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos' });
        }

        // Verificar email confirmado (solo para usuarios con correo registrado)
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
// REGISTRO - Crea cuenta y envía correo de verificación
// ============================================================
router.post('/registro', async (req, res) => {
    try {
        const { usuario, correo, password, rol } = req.body;

        // Validaciones básicas
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

        // Verificar si el usuario o correo ya existen
        const [existe] = await pool.execute(
            'SELECT id FROM usuarios WHERE usuario = ? OR correo = ?',
            [usuario, correo]
        );
        if (existe.length > 0) {
            return res.status(409).json({ mensaje: 'El usuario o correo ya está registrado' });
        }

        // Si intenta registrarse como admin, verificar que no exista ya uno
        if (rol === 'admin') {
            const [adminExiste] = await pool.execute('SELECT id FROM usuarios WHERE rol = "admin"');
            if (adminExiste.length > 0) {
                return res.status(403).json({ mensaje: 'Ya existe un administrador registrado en el sistema. Solo puede haber uno.' });
            }
        }

        // Hashear contraseña y generar token
        const hash = await bcrypt.hash(password, 12);
        const token = uuidv4();

        await pool.execute(
            `INSERT INTO usuarios (usuario, correo, password, rol, email_verificado, token_verificacion)
             VALUES (?, ?, ?, ?, 0, ?)`,
            [usuario, correo, hash, rol, token]
        );

        // Enviar correo de verificación
        await enviarVerificacion(correo, token);

        res.status(201).json({
            mensaje: `¡Cuenta creada! Hemos enviado un enlace de verificación a ${correo}. Revisa tu bandeja de entrada.`
        });

    } catch (err) {
        console.error('Error en registro:', err);
        res.status(500).json({ mensaje: 'Error al crear la cuenta. Intenta de nuevo.' });
    }
});

// ============================================================
// VERIFICAR CORREO - Activa la cuenta con el token del enlace
// ============================================================
router.get('/verificar/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const [rows] = await pool.execute(
            'SELECT id FROM usuarios WHERE token_verificacion = ?',
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ mensaje: 'El enlace es inválido o ya fue usado.' });
        }

        await pool.execute(
            'UPDATE usuarios SET email_verificado = 1, token_verificacion = NULL WHERE token_verificacion = ?',
            [token]
        );

        res.json({ mensaje: '¡Tu correo fue verificado exitosamente! Ya puedes iniciar sesión.' });

    } catch (err) {
        console.error('Error en verificación:', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

// ============================================================
// SOLICITAR RECUPERACIÓN - Envía correo con enlace de reset
// ============================================================
router.post('/recuperar', async (req, res) => {
    try {
        const { correo } = req.body;

        if (!correo) {
            return res.status(400).json({ mensaje: 'Ingresa tu correo electrónico' });
        }

        const [rows] = await pool.execute(
            'SELECT id FROM usuarios WHERE correo = ?',
            [correo]
        );

        // Por seguridad respondemos igual aunque el correo no exista
        if (rows.length > 0) {
            const token = uuidv4();
            const expiracion = new Date(Date.now() + 60 * 60 * 1000); // 1 hora
            const expStr = expiracion.toISOString().slice(0, 19).replace('T', ' ');

            await pool.execute(
                'UPDATE usuarios SET token_recuperacion = ?, token_recuperacion_exp = ? WHERE correo = ?',
                [token, expStr, correo]
            );

            await enviarRecuperacion(correo, token);
        }

        res.json({
            mensaje: `Si ese correo está registrado, recibirás un enlace para restablecer tu contraseña.`
        });

    } catch (err) {
        console.error('Error en recuperación:', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

// ============================================================
// RESET PASSWORD - Establece nueva contraseña con el token
// ============================================================
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            return res.status(400).json({ mensaje: 'Datos incompletos' });
        }
        if (password.length < 6) {
            return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
        }

        const [rows] = await pool.execute(
            'SELECT id, token_recuperacion_exp FROM usuarios WHERE token_recuperacion = ?',
            [token]
        );

        if (rows.length === 0) {
            return res.status(400).json({ mensaje: 'El enlace es inválido o ya fue usado.' });
        }

        // Verificar que no haya expirado
        const exp = new Date(rows[0].token_recuperacion_exp);
        if (Date.now() > exp.getTime()) {
            return res.status(400).json({ mensaje: 'El enlace ha expirado. Solicita uno nuevo.' });
        }

        const hash = await bcrypt.hash(password, 12);

        await pool.execute(
            `UPDATE usuarios
             SET password = ?, token_recuperacion = NULL, token_recuperacion_exp = NULL
             WHERE token_recuperacion = ?`,
            [hash, token]
        );

        res.json({ mensaje: '¡Contraseña actualizada correctamente! Ya puedes iniciar sesión.' });

    } catch (err) {
        console.error('Error en reset-password:', err);
        res.status(500).json({ mensaje: 'Error del servidor' });
    }
});

module.exports = router;
