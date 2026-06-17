// Protección de ruta
const rol = localStorage.getItem('rol');
if (rol !== 'cliente') {
    window.location.href = 'login.html';
}

let productos = [];
const contenedor = document.getElementById('listaProductos');

// =========================
// CARGAR PRODUCTOS
// =========================
async function cargarProductos() {
    try {
        const res = await fetch('/productos');
        productos = await res.json();
        mostrarProductos();
    } catch (err) {
        contenedor.innerHTML = `
            <div class="col-12">
                <div class="alert alert-danger">
                    No se pudo conectar al servidor. Verifica que el backend esté corriendo.
                </div>
            </div>`;
    }
}

// =========================
// MOSTRAR PRODUCTOS
// =========================
function mostrarProductos() {
    contenedor.innerHTML = '';

    const disponibles = productos.filter(p => p.stock > 0);

    if (disponibles.length === 0) {
        contenedor.innerHTML = '<p class="text-muted text-center mt-4">No hay productos disponibles por el momento.</p>';
        return;
    }

    disponibles.forEach(producto => {
        contenedor.innerHTML += `
        <div class="col-md-4 mb-4">
            <div class="card shadow h-100">
                <img src="${producto.imagen || 'https://via.placeholder.com/300x220?text=Sin+imagen'}"
                     class="producto-img"
                     onerror="this.src='https://via.placeholder.com/300x220?text=Sin+imagen'">
                <div class="card-body d-flex flex-column">
                    <h4>${producto.nombre}</h4>
                    <p class="flex-grow-1">${producto.descripcion}</p>
                    <h5 class="text-danger">$${Number(producto.precio).toFixed(2)}</h5>
                    <p class="text-muted small">Stock: ${producto.stock}</p>
                    <button class="btn btn-rosa mt-auto"
                        onclick='agregarCarrito(${JSON.stringify(producto)})'>
                        🛒 Agregar al carrito
                    </button>
                </div>
            </div>
        </div>`;
    });
}

// =========================
// AGREGAR AL CARRITO
// =========================
function agregarCarrito(producto) {
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];

    const existente = carrito.find(i => i.id === producto.id);
    if (existente) {
        existente.cantidad += 1;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    localStorage.setItem('carrito', JSON.stringify(carrito));

    // Toast de confirmación
    mostrarToast(`✅ ${producto.nombre} agregado al carrito`);
}

function mostrarToast(msg) {
    let toast = document.getElementById('toast-carrito');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-carrito';
        toast.style.cssText = `
            position:fixed; bottom:20px; right:20px;
            background:#ff4fa3; color:white; padding:12px 20px;
            border-radius:10px; font-weight:bold; z-index:9999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.display = 'block';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.style.display = 'none'; }, 2500);
}

function irCarrito() {
    window.location.href = 'carrito.html';
}

function cerrarSesion() {
    localStorage.removeItem('rol');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

// Iniciar
cargarProductos();
