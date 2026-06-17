const pool = require('./db');

async function limpiarAdmin() {
    try {
        console.log('⏳ Conectando a la base de datos...');
        const [result] = await pool.execute('DELETE FROM usuarios WHERE rol = "admin"');
        
        if (result.affectedRows > 0) {
            console.log(`✅ Éxito: Se eliminaron ${result.affectedRows} administrador(es) de la base de datos.`);
            console.log('Ahora puedes registrar un nuevo administrador desde la pantalla de registro.');
        } else {
            console.log('⚠️ No se encontró ningún administrador en la base de datos. Ya está limpia.');
        }
    } catch (err) {
        console.error('❌ Error al intentar limpiar el administrador:', err.message);
    } finally {
        process.exit();
    }
}

limpiarAdmin();
