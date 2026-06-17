async function registrar(e) {
    e.preventDefault();

    const usuario  = document.getElementById('usuario').value.trim();
    const correo   = document.getElementById('correo').value.trim();
    const password = document.getElementById('password').value;
    const confirmar = document.getElementById('confirmar').value;
    const rol      = document.getElementById('rol').value;

    // Validaciones del lado cliente
    if (!usuario || !correo || !password || !confirmar) {
        return mostrarError('Completa todos los campos.');
    }
    if (password.length < 6) {
        return mostrarError('La contraseña debe tener al menos 6 caracteres.');
    }
    if (password !== confirmar) {
        return mostrarError('Las contraseñas no coinciden.');
    }

    setLoading(true);
    ocultarError();

    try {
        const res = await fetch('/usuarios/registro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, correo, password, rol })
        });

        const data = await res.json();

        if (res.ok) {
            // Mostrar mensaje de éxito y ocultar formulario
            document.getElementById('formRegistro').style.display = 'none';
            document.getElementById('textoExito').textContent = data.mensaje;
            document.getElementById('msgExito').style.display = 'block';
        } else {
            mostrarError(data.mensaje || 'Error al registrar. Intenta de nuevo.');
        }

    } catch (err) {
        mostrarError('No se pudo conectar al servidor. ¿Está corriendo el backend?');
    } finally {
        setLoading(false);
    }
}

function mostrarError(msg) {
    const el = document.getElementById('alertaError');
    el.textContent = msg;
    el.classList.remove('d-none');
}

function ocultarError() {
    document.getElementById('alertaError').classList.add('d-none');
}

function setLoading(loading) {
    const btn = document.getElementById('btnRegistrar');
    const txt = document.getElementById('btnTexto');
    const spin = document.getElementById('btnSpinner');
    btn.disabled = loading;
    txt.textContent = loading ? 'Creando cuenta...' : 'Crear cuenta';
    spin.classList.toggle('d-none', !loading);
}

function togglePass(inputId, icon) {
    const input = document.getElementById(inputId);
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    icon.textContent = isPass ? '🙈' : '👁️';
}

function checkStrength() {
    const val = document.getElementById('password').value;
    const bar = document.getElementById('strengthBar');
    let strength = 0;
    if (val.length >= 6)  strength++;
    if (val.length >= 10) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;

    const colors = ['#eee', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#27ae60'];
    const widths = ['0%', '20%', '40%', '60%', '80%', '100%'];
    bar.style.width  = widths[strength];
    bar.style.background = colors[strength];
}
