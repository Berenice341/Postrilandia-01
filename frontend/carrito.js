// Protección de ruta
const rol = localStorage.getItem('rol');
if (rol !== 'cliente') {
    window.location.href = 'login.html';
}

let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
let metodoPago = null;

const listaCarrito = document.getElementById('listaCarrito');
const resumenDiv   = document.getElementById('resumenCarrito');
const totalDiv     = document.getElementById('totalCarrito');

// =========================
// MOSTRAR CARRITO
// =========================
function mostrarCarrito() {
    listaCarrito.innerHTML = '';

    if (carrito.length === 0) {
        listaCarrito.innerHTML = `
            <div class="text-center py-4">
                <p class="text-muted fs-5">Tu carrito está vacío 🛒</p>
                <a href="index.html" class="btn btn-rosa">Ver productos</a>
            </div>`;
        resumenDiv.innerHTML = '';
        totalDiv.textContent = '';
        document.getElementById('seccionPago').style.display = 'none';
        document.getElementById('btnComprar').style.display = 'none';
        return;
    }

    document.getElementById('seccionPago').style.display = 'block';
    document.getElementById('btnComprar').style.display = 'block';

    carrito.forEach((item, index) => {
        listaCarrito.innerHTML += `
        <div class="d-flex align-items-center gap-3 mb-3 p-3 border rounded">
            <img src="${item.imagen || 'https://via.placeholder.com/80'}"
                 style="width:80px;height:80px;object-fit:cover;border-radius:10px;"
                 onerror="this.src='https://via.placeholder.com/80'">
            <div class="flex-grow-1">
                <h5 class="mb-1">${item.nombre}</h5>
                <p class="text-muted mb-0">$${Number(item.precio).toFixed(2)} c/u</p>
            </div>
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-outline-secondary btn-sm" onclick="cambiarCantidad(${index}, -1)">−</button>
                <span class="fw-bold px-2">${item.cantidad}</span>
                <button class="btn btn-outline-secondary btn-sm" onclick="cambiarCantidad(${index}, 1)">+</button>
            </div>
            <div class="text-end" style="min-width:80px">
                <strong class="text-danger">$${(item.precio * item.cantidad).toFixed(2)}</strong>
            </div>
            <button class="btn btn-danger btn-sm" onclick="quitarItem(${index})">🗑️</button>
        </div>`;
    });

    resumenDiv.innerHTML = carrito.map(i =>
        `<div class="d-flex justify-content-between small mb-1">
            <span>${i.nombre} x${i.cantidad}</span>
            <span>$${(i.precio * i.cantidad).toFixed(2)}</span>
        </div>`
    ).join('');

    totalDiv.textContent = `Total: $${calcularTotal().toFixed(2)}`;
}

function calcularTotal() {
    return carrito.reduce((acc, i) => acc + i.precio * i.cantidad, 0);
}

// =========================
// MÉTODO DE PAGO
// =========================
function seleccionarPago(metodo) {
    metodoPago = metodo;

    ['efectivo', 'tarjeta'].forEach(m =>
        document.getElementById(`pago-${m}`).classList.remove('seleccionado')
    );
    document.getElementById(`pago-${metodo}`).classList.add('seleccionado');

    document.getElementById('campo-efectivo').style.display = metodo === 'efectivo' ? 'block' : 'none';
    document.getElementById('campo-tarjeta').style.display  = metodo === 'tarjeta'  ? 'block' : 'none';
}

// =========================
// FORMATEAR NÚMERO TARJETA
// =========================
function formatearTarjeta(input) {
    let val = input.value.replace(/\D/g, '').substring(0, 16);
    input.value = val.match(/.{1,4}/g)?.join(' ') || val;
    actualizarPreview();
}

function formatearVence(input) {
    let val = input.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 3) val = val.substring(0, 2) + '/' + val.substring(2);
    input.value = val;
    actualizarPreview();
}

function actualizarPreview() {
    const num    = document.getElementById('numTarjeta').value || '';
    const nombre = document.getElementById('nombreTarjeta').value.toUpperCase() || '';
    const vence  = document.getElementById('venceTarjeta').value || '';

    const numDisplay = num.padEnd(19, '•').replace(/ /g, '').replace(/(.{4})/g, '$1 ').trim();
    document.getElementById('previewNumero').textContent = numDisplay || '•••• •••• •••• ••••';
    document.getElementById('previewNombre').textContent = nombre  || 'NOMBRE APELLIDO';
    document.getElementById('previewVence').textContent  = vence   || 'MM/AA';

    // Color según tipo de tarjeta
    const preview = document.getElementById('tarjetaPreview');
    const primeros = num.replace(/\s/g, '');
    if (primeros.startsWith('4'))      preview.className = 'tarjeta-preview mb-3 visa';
    else if (primeros.startsWith('5')) preview.className = 'tarjeta-preview mb-3 mastercard';
    else if (primeros.startsWith('3')) preview.className = 'tarjeta-preview mb-3 amex';
    else                               preview.className = 'tarjeta-preview mb-3';
}

// =========================
// VALIDAR TARJETA
// =========================
function validarTarjeta() {
    const num    = document.getElementById('numTarjeta').value.replace(/\s/g, '');
    const nombre = document.getElementById('nombreTarjeta').value.trim();
    const vence  = document.getElementById('venceTarjeta').value;
    const cvv    = document.getElementById('cvvTarjeta').value;

    if (num.length < 16)       return 'El número de tarjeta debe tener 16 dígitos';
    if (nombre.length < 3)     return 'Ingresa el nombre del titular';
    if (!/^\d{2}\/\d{2}$/.test(vence)) return 'Fecha de vencimiento inválida (MM/AA)';
    if (cvv.length < 3)        return 'CVV inválido';

    // Validar que no esté vencida
    const [mes, anio] = vence.split('/').map(Number);
    const ahora = new Date();
    const anioCompleto = 2000 + anio;
    if (anioCompleto < ahora.getFullYear() ||
       (anioCompleto === ahora.getFullYear() && mes < ahora.getMonth() + 1)) {
        return 'La tarjeta está vencida';
    }

    return null; // OK
}

// =========================
// CAMBIAR CANTIDAD / QUITAR
// =========================
function cambiarCantidad(index, delta) {
    carrito[index].cantidad += delta;
    if (carrito[index].cantidad <= 0) carrito.splice(index, 1);
    guardarYMostrar();
}

function quitarItem(index) {
    carrito.splice(index, 1);
    guardarYMostrar();
}

function guardarYMostrar() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
    mostrarCarrito();
}

// =========================
// CONFIRMAR PEDIDO
// =========================
async function confirmarPedido() {
    if (carrito.length === 0) return;

    if (!metodoPago) {
        mostrarMensaje('Por favor selecciona un método de pago', 'warning');
        return;
    }

    const total = calcularTotal();
    let montoEfectivo = null;
    let datosTarjeta  = null;

    // Validar efectivo
    if (metodoPago === 'efectivo') {
        montoEfectivo = Number(document.getElementById('montoEfectivo').value);
        if (!montoEfectivo || montoEfectivo < total) {
            mostrarMensaje(`El monto debe ser mayor o igual al total ($${total.toFixed(2)})`, 'warning');
            return;
        }
    }

    // Validar tarjeta
    if (metodoPago === 'tarjeta') {
        const error = validarTarjeta();
        if (error) {
            mostrarMensaje(error, 'warning');
            return;
        }
        const num = document.getElementById('numTarjeta').value.replace(/\s/g, '');
        datosTarjeta = {
            ultimos4: num.slice(-4),
            nombre:   document.getElementById('nombreTarjeta').value.trim().toUpperCase()
        };
    }

    const btnComprar = document.getElementById('btnComprar');
    btnComprar.disabled = true;
    btnComprar.textContent = 'Procesando...';

    try {
        const res = await fetch('/ventas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ carrito, metodoPago, montoEfectivo, datosTarjeta })
        });

        const data = await res.json();

        if (res.ok) {
            mostrarTicket(data, montoEfectivo, datosTarjeta);
            localStorage.removeItem('carrito');
            carrito = [];
        } else {
            mostrarMensaje(data.mensaje || 'Error al procesar el pedido', 'danger');
            btnComprar.disabled = false;
            btnComprar.textContent = '✅ Confirmar Pedido';
        }
    } catch (err) {
        mostrarMensaje('Error de conexión con el servidor', 'danger');
        btnComprar.disabled = false;
        btnComprar.textContent = '✅ Confirmar Pedido';
    }
}

// =========================
// MOSTRAR TICKET
// =========================
function mostrarTicket(venta, montoEfectivo, datosTarjeta) {
    const fecha   = new Date(venta.fecha);
    const fechaStr = fecha.toLocaleDateString('es-MX', { day:'2-digit', month:'2-digit', year:'numeric' });
    const horaStr  = fecha.toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' });

    const iconoPago  = { efectivo:'💵', tarjeta:'💳' };
    const nombrePago = { efectivo:'Efectivo', tarjeta:'Tarjeta' };
    const cambio = montoEfectivo ? montoEfectivo - venta.total : null;

    const productosHTML = venta.carrito.map(i => `
        <tr>
            <td>${i.nombre}</td>
            <td class="text-center">${i.cantidad}</td>
            <td class="text-end">$${Number(i.precio).toFixed(2)}</td>
            <td class="text-end">$${(i.precio * i.cantidad).toFixed(2)}</td>
        </tr>`).join('');

    const infoPago = metodoPago === 'tarjeta' && datosTarjeta
        ? `<div class="d-flex justify-content-between">
               <span>💳 Tarjeta terminación</span>
               <span><strong>••••${datosTarjeta.ultimos4}</strong></span>
           </div>
           <div class="d-flex justify-content-between text-muted small">
               <span>Titular</span>
               <span>${datosTarjeta.nombre}</span>
           </div>`
        : metodoPago === 'efectivo'
        ? `<div class="d-flex justify-content-between">
               <span>💵 Efectivo — Recibido</span>
               <span>$${Number(montoEfectivo).toFixed(2)}</span>
           </div>
           ${cambio !== null ? `<div class="d-flex justify-content-between fw-bold text-success mt-1">
               <span>💰 Cambio</span><span>$${cambio.toFixed(2)}</span>
           </div>` : ''}`
        : ``;

    document.getElementById('contenidoTicket').innerHTML = `
        <div class="ticket p-4">
            <div class="text-center mb-3">
                <div style="font-size:2.5rem">🍰</div>
                <h4 class="fw-bold mb-0">Postrilandia</h4>
                <p class="text-muted small mb-0">Los mejores postres</p>
                <hr>
                <p class="small mb-0">Folio: <strong>#${String(venta.id).padStart(4,'0')}</strong></p>
                <p class="small text-muted">${fechaStr} — ${horaStr}</p>
                <p class="small text-muted">Cliente: <strong>${localStorage.getItem('usuario') || 'Cliente'}</strong></p>
            </div>

            <table class="table table-sm table-borderless">
                <thead>
                    <tr class="border-bottom">
                        <th>Producto</th>
                        <th class="text-center">Cant.</th>
                        <th class="text-end">P.U.</th>
                        <th class="text-end">Total</th>
                    </tr>
                </thead>
                <tbody>${productosHTML}</tbody>
            </table>

            <hr>
            <div class="d-flex justify-content-between fw-bold fs-5">
                <span>TOTAL</span>
                <span class="text-danger">$${Number(venta.total).toFixed(2)}</span>
            </div>

            <div class="mt-3 p-2 rounded" style="background:#fff0f5;">
                ${infoPago}
            </div>

            <p class="text-center text-muted small mt-3 mb-0">
                ¡Gracias por tu compra! 🎂<br>Vuelve pronto
            </p>
        </div>`;

    const modal = new bootstrap.Modal(document.getElementById('modalTicket'));
    modal.show();
}

function imprimirTicket() {
    const contenido = document.getElementById('contenidoTicket').innerHTML;
    const ventana = window.open('', '_blank', 'width=400,height=600');
    ventana.document.write(`
        <html><head><title>Ticket Postrilandia</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
        <style>body{font-family:'Courier New',monospace;background:white;}.ticket{max-width:350px;margin:auto;}</style>
        </head><body>${contenido}</body></html>`);
    ventana.document.close();
    ventana.onload = () => { ventana.print(); ventana.close(); };
}

function cerrarTicket() {
    bootstrap.Modal.getInstance(document.getElementById('modalTicket')).hide();
    metodoPago = null;
    ['efectivo','tarjeta'].forEach(m =>
        document.getElementById(`pago-${m}`).classList.remove('seleccionado'));
    document.getElementById('campo-efectivo').style.display = 'none';
    document.getElementById('campo-tarjeta').style.display  = 'none';
    document.getElementById('btnComprar').disabled = false;
    document.getElementById('btnComprar').textContent = '✅ Confirmar Pedido';
    mostrarCarrito();
}

function mostrarMensaje(texto, tipo) {
    const div = document.getElementById('mensaje-carrito');
    div.className = `alert alert-${tipo}`;
    div.textContent = texto;
    div.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => { div.style.display = 'none'; }, 4000);
}

function cerrarSesion() {
    localStorage.removeItem('rol');
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

mostrarCarrito();
