// Protección de ruta
const rol = localStorage.getItem('rol');
if (rol !== 'admin') {
    window.location.href = 'login.html';
}

let productos = [];
const contenedor = document.getElementById('listaProductos');

let categorias = [];
const contenedorCategorias = document.getElementById('listaCategorias');
let filtroActual = 'todas';

// =========================
// CARGAR PRODUCTOS
// =========================
async function cargarProductos() {
    try {
        const res = await fetch('/productos');
        productos = await res.json();
        mostrarProductos();
    } catch (err) {
        mostrarMensaje('Error al conectar con el servidor', 'danger');
    }
}

// =========================
// MOSTRAR PRODUCTOS
// =========================
function mostrarProductos() {
    contenedor.innerHTML = '';

    let productosFiltrados = productos;
    if (filtroActual !== 'todas') {
        productosFiltrados = productos.filter(p => p.categoriaId == filtroActual);
    }

    if (productosFiltrados.length === 0) {
        contenedor.innerHTML = '<p class="text-muted">No hay productos aún.</p>';
        return;
    }

    productosFiltrados.forEach(producto => {
        let nombreCategoria = 'Sin Categoría';
        if (producto.categoriaId) {
            const cat = categorias.find(c => c.id == producto.categoriaId);
            if (cat) nombreCategoria = cat.nombre;
        }

        contenedor.innerHTML += `
        <div class="col-xl-3 col-lg-4 col-md-6 mb-4" id="prod-${producto.id}">
            <div class="card h-100 border-0">
                <img src="${producto.imagen || 'https://via.placeholder.com/300x220?text=Sin+imagen'}"
                     class="producto-img" onerror="this.src='https://via.placeholder.com/300x220?text=Sin+imagen'">
                <div class="card-body">
                    <span class="badge bg-secondary mb-2">${nombreCategoria}</span>
                    <h4>${producto.nombre}</h4>
                    <p>${producto.descripcion}</p>
                    <h5 class="text-danger">$${Number(producto.precio).toFixed(2)}</h5>
                    <p>Stock: <strong>${producto.stock}</strong></p>
                    <div class="d-flex gap-2">
                        <button class="btn btn-warning btn-sm" onclick="abrirEditar(${producto.id})">
                            ✏️ Editar
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="eliminarProducto(${producto.id})">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    });
}

// =========================
// AGREGAR PRODUCTO
// =========================
async function agregarProducto() {
    const nombre = document.getElementById('nombre').value.trim();
    const precio = document.getElementById('precio').value;
    const stock = document.getElementById('stock').value;
    const descripcion = document.getElementById('descripcion').value.trim();
    const imagen = document.getElementById('imagen').value.trim();
    const categoriaId = document.getElementById('categoriaProducto').value;

    if (!nombre || !precio || !stock) {
        mostrarMensaje('Nombre, precio y stock son obligatorios', 'warning');
        return;
    }

    try {
        const res = await fetch('/productos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, precio: Number(precio), stock: Number(stock), descripcion, imagen, categoriaId })
        });

        if (res.ok) {
            // Limpiar formulario
            ['nombre', 'precio', 'stock', 'descripcion', 'imagen', 'categoriaProducto'].forEach(id =>
                document.getElementById(id).value = ''
            );
            mostrarMensaje('✅ Producto agregado correctamente', 'success');
            await cargarProductos();
        } else {
            mostrarMensaje('Error al agregar producto', 'danger');
        }
    } catch (err) {
        mostrarMensaje('Error de conexión con el servidor', 'danger');
    }
}

// =========================
// ABRIR MODAL EDITAR
// =========================
function abrirEditar(id) {
    const producto = productos.find(p => p.id == id);
    if (!producto) return;

    document.getElementById('edit-id').value = producto.id;
    document.getElementById('edit-nombre').value = producto.nombre;
    document.getElementById('edit-precio').value = producto.precio;
    document.getElementById('edit-stock').value = producto.stock;
    document.getElementById('edit-descripcion').value = producto.descripcion;
    document.getElementById('edit-imagen').value = producto.imagen;
    document.getElementById('edit-categoriaProducto').value = producto.categoriaId || '';

    const modal = new bootstrap.Modal(document.getElementById('modalEditar'));
    modal.show();
}

// =========================
// GUARDAR EDICIÓN
// =========================
async function guardarEdicion() {
    const id = document.getElementById('edit-id').value;
    const datos = {
        nombre: document.getElementById('edit-nombre').value.trim(),
        precio: Number(document.getElementById('edit-precio').value),
        stock: Number(document.getElementById('edit-stock').value),
        descripcion: document.getElementById('edit-descripcion').value.trim(),
        imagen: document.getElementById('edit-imagen').value.trim(),
        categoriaId: document.getElementById('edit-categoriaProducto').value
    };

    try {
        const res = await fetch(`/productos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        if (res.ok) {
            bootstrap.Modal.getInstance(document.getElementById('modalEditar')).hide();
            mostrarMensaje('✅ Producto actualizado', 'success');
            await cargarProductos();
        } else {
            mostrarMensaje('Error al actualizar', 'danger');
        }
    } catch (err) {
        mostrarMensaje('Error de conexión', 'danger');
    }
}

// =========================
// ELIMINAR PRODUCTO
// =========================
async function eliminarProducto(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
        const res = await fetch(`/productos/${id}`, { method: 'DELETE' });

        if (res.ok) {
            mostrarMensaje('🗑️ Producto eliminado', 'success');
            await cargarProductos();
        } else {
            mostrarMensaje('Error al eliminar', 'danger');
        }
    } catch (err) {
        mostrarMensaje('Error de conexión', 'danger');
    }
}

// =========================
// CARGAR CATEGORIAS
// =========================
async function cargarCategorias() {
    try {
        const res = await fetch('/categorias');
        categorias = await res.json();
        mostrarCategorias();
    } catch (err) {
        mostrarMensaje('Error al cargar categorías', 'danger');
    }
}

// =========================
// MOSTRAR CATEGORIAS
// =========================
function mostrarCategorias() {
    contenedorCategorias.innerHTML = '';
    
    const selectAgregar = document.getElementById('categoriaProducto');
    const selectEditar = document.getElementById('edit-categoriaProducto');
    const selectFiltro = document.getElementById('filtroCategoria');

    // Reset selects
    selectAgregar.innerHTML = '<option value="">Sin Categoría</option>';
    selectEditar.innerHTML = '<option value="">Sin Categoría</option>';
    selectFiltro.innerHTML = '<option value="todas">Todas</option>';

    if (categorias.length === 0) {
        contenedorCategorias.innerHTML = '<li class="list-group-item text-muted">No hay categorías.</li>';
        // Aún sin categorías, mostramos los productos para que no se bloquee.
        mostrarProductos();
        return;
    }

    categorias.forEach(cat => {
        contenedorCategorias.innerHTML += `
        <li class="list-group-item d-flex justify-content-between align-items-center">
            ${cat.nombre}
            <button class="btn btn-sm btn-danger" onclick="eliminarCategoria(${cat.id})">🗑️</button>
        </li>`;

        const optionHTML = `<option value="${cat.id}">${cat.nombre}</option>`;
        selectAgregar.innerHTML += optionHTML;
        selectEditar.innerHTML += optionHTML;
        selectFiltro.innerHTML += optionHTML;
    });

    selectFiltro.value = filtroActual;
    mostrarProductos(); // Renderizar productos después de que existen las categorías
}

// =========================
// FILTRAR PRODUCTOS
// =========================
function filtrarProductos() {
    filtroActual = document.getElementById('filtroCategoria').value;
    mostrarProductos();
}

// =========================
// AGREGAR CATEGORIA
// =========================
async function agregarCategoria() {
    const nombre = document.getElementById('nombreCategoria').value.trim();
    if (!nombre) {
        mostrarMensaje('El nombre de la categoría es obligatorio', 'warning');
        return;
    }

    try {
        const res = await fetch('/categorias', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre })
        });

        if (res.ok) {
            document.getElementById('nombreCategoria').value = '';
            mostrarMensaje('✅ Categoría agregada', 'success');
            await cargarCategorias();
        } else {
            mostrarMensaje('Error al agregar categoría', 'danger');
        }
    } catch (err) {
        mostrarMensaje('Error de conexión', 'danger');
    }
}

// =========================
// ELIMINAR CATEGORIA
// =========================
async function eliminarCategoria(id) {
    if (!confirm('¿Seguro que deseas eliminar esta categoría?')) return;

    try {
        const res = await fetch(`/categorias/${id}`, { method: 'DELETE' });
        if (res.ok) {
            mostrarMensaje('🗑️ Categoría eliminada', 'success');
            await cargarCategorias();
        } else {
            mostrarMensaje('Error al eliminar categoría', 'danger');
        }
    } catch (err) {
        mostrarMensaje('Error de conexión', 'danger');
    }
}
// =========================
// MENSAJE TEMPORAL
// =========================
function mostrarMensaje(texto, tipo) {
    const div = document.getElementById('mensaje-admin');
    div.className = `alert alert-${tipo}`;
    div.textContent = texto;
    div.style.display = 'block';
    setTimeout(() => { div.style.display = 'none'; }, 3000);
}

function cerrarSesion() {
    localStorage.removeItem('rol');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

// Iniciar
async function init() {
    await cargarCategorias();
    await cargarProductos();
}
init();
