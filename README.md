# 🍰 Postrilandia

Tienda de postres con backend Node.js + Express y almacenamiento en archivos JSON.

## 📁 Estructura

```
postrilandia/
├── backend/
│   ├── server.js          ← Servidor principal
│   ├── package.json
│   ├── data/
│   │   ├── productos.json
│   │   ├── categorias.json
│   │   ├── usuarios.json
│   │   └── ventas.json
│   └── routes/
│       ├── productos.js
│       ├── categorias.js
│       ├── usuarios.js
│       └── ventas.js
└── frontend/
    ├── login.html         ← Página de inicio
    ├── index.html         ← Tienda (clientes)
    ├── admin.html         ← Panel admin
    ├── carrito.html       ← Carrito de compras
    └── style.css
```

## 🚀 Cómo ejecutar

1. Entra a la carpeta `backend`:
   ```bash
   cd backend
   ```

2. Instala dependencias (solo la primera vez):
   ```bash
   npm install
   ```

3. Inicia el servidor:
   ```bash
   node server.js
   ```

4. Abre en tu navegador:
   ```
   http://localhost:3000/login.html
   ```

## 👤 Usuarios de prueba

| Usuario  | Contraseña | Rol         |
|----------|------------|-------------|
| admin    | 1234       | admin       |
| cliente  | 1234       | cliente     |

## ✅ Funcionalidades

- **Login** con validación en el servidor
- **Tienda**: Ver y agregar productos al carrito
- **Carrito**: Ajustar cantidades y confirmar pedido (descuenta stock)
- **Admin**: Agregar, editar y eliminar productos desde el panel
- **Datos persistentes** en archivos JSON (sin necesidad de SQL)
