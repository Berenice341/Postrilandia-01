const nodemailer = require('nodemailer');

// Transporter reutilizable
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT) || 2525, // Usa 2525 si no se define el puerto
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    }
});

/**
 * Envía correo de verificación de cuenta
 * @param {string} correo - Destinatario
 * @param {string} token  - Token único de verificación
 */
async function enviarVerificacion(correo, token) {
    const url = `${process.env.APP_URL}/verificar.html?token=${token}`;
    
    // CORRECCIÓN: Si MAIL_FROM no está en Render, usa MAIL_USER automáticamente para no romper la sintaxis
    const fromEmail = process.env.MAIL_FROM || process.env.MAIL_USER;

    await transporter.sendMail({
        from: `"Postrilandia" <${fromEmail}>`,
        to: correo,
        subject: '✅ Verifica tu cuenta en Postrilandia',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px;
                        border: 1px solid #f0c0c0; border-radius: 12px; background: #fff9f9;">
                <h2 style="color: #c0392b; text-align:center;">🍰 Postrilandia</h2>
                <h3 style="text-align:center;">¡Bienvenido! Verifica tu cuenta</h3>
                <p>Gracias por registrarte. Haz clic en el botón para activar tu cuenta:</p>
                <div style="text-align:center; margin: 30px 0;">
                    <a href="${url}"
                       style="background:#c0392b; color:white; padding:14px 28px;
                              border-radius:8px; text-decoration:none; font-weight:bold;">
                        Verificar mi cuenta
                    </a>
                </div>
                <p style="color:#888; font-size:13px;">
                    Si no puedes hacer clic, copia este enlace en tu navegador:<br>
                    <a href="${url}" style="color:#c0392b;">${url}</a>
                </p>
                <p style="color:#aaa; font-size:12px;">
                    Este enlace expira en 24 horas. Si no creaste esta cuenta, ignora este mensaje.
                </p>
            </div>
        `
    });
}

/**
 * Envía correo de recuperación de contraseña
 * @param {string} correo - Destinatario
 * @param {string} token  - Token único de recuperación
 */
async function enviarRecuperacion(correo, token) {
    const url = `${process.env.APP_URL}/reset-password.html?token=${token}`;
    
    // CORRECCIÓN: Respaldo automático también aquí
    const fromEmail = process.env.MAIL_FROM || process.env.MAIL_USER;

    await transporter.sendMail({
        from: `"Postrilandia" <${fromEmail}>`,
        to: correo,
        subject: '🔑 Recupera tu contraseña - Postrilandia',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 30px;
                        border: 1px solid #f0c0c0; border-radius: 12px; background: #fff9f9;">
                <h2 style="color: #c0392b; text-align:center;">🍰 Postrilandia</h2>
                <h3 style="text-align:center;">Restablecer contraseña</h3>
                <p>Recibimos una solicitud para recuperar tu contraseña. Haz clic para crear una nueva:</p>
                <div style="text-align:center; margin: 30px 0;">
                    <a href="${url}"
                       style="background:#c0392b; color:white; padding:14px 28px;
                              border-radius:8px; text-decoration:none; font-weight:bold;">
                        Restablecer contraseña
                    </a>
                </div>
                <p style="color:#888; font-size:13px;">
                    Si no puedes hacer clic, copia este enlace en tu navegador:<br>
                    <a href="${url}" style="color:#c0392b;">${url}</a>
                </p>
                <p style="color:#aaa; font-size:12px;">
                    Este enlace expira en 1 hora. Si no solicitaste esto, ignora este mensaje.
                </p>
            </div>
        `
    });
}

module.exports = { enviarVerificacion, enviarRecuperacion };