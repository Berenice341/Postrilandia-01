async function iniciarSesion() {
    const usuario  = document.getElementById('usuario').value.trim();
    const password = document.getElementById('password').value.trim();
    const rol      = document.getElementById('rol').value;

    if (!usuario || !password) {
        mostrarError('Por favor completa todos los campos');
        return;
    }

    setLoading(true);
    ocultarError();

    try {
        const res = await fetch('/usuarios/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario, password, rol })
        });

        const data = await res.json();

        if (res.ok) {
            localStorage.setItem('rol', data.rol);
            localStorage.setItem('usuario', data.usuario || usuario);

            if (data.rol === 'admin') {
                window.location.href = 'admin.html';
            } else {
                window.location.href = 'index.html';
            }
        } else {
            mostrarError(data.mensaje || 'Datos incorrectos');
        }

    } catch (err) {
        mostrarError('No se pudo conectar al servidor. ¿Está corriendo el backend?');
    } finally {
        setLoading(false);
    }
}

function mostrarError(msg) {
    const el = document.getElementById('alerta-error');
    el.textContent = msg;
    el.classList.remove('d-none');
    el.style.display = 'block';
}

function ocultarError() {
    document.getElementById('alerta-error').classList.add('d-none');
}

function setLoading(v) {
    document.getElementById('btnLogin').disabled = v;
    document.getElementById('btnTexto').textContent = v ? 'Iniciando sesión...' : 'Iniciar sesión';
    document.getElementById('btnSpinner').classList.toggle('d-none', !v);
}

function togglePass() {
    const input = document.getElementById('password');
    const icon  = document.querySelector('.pass-toggle');
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    icon.textContent = isPass ? '🙈' : '👁️';
}

// Login con Enter
document.addEventListener('keydown', e => {
    if (e.key === 'Enter') iniciarSesion();
});
