# SandoK TPV 🥪

Sistema de punto de venta para **SandoK — Japanese Gourmet Fried Sandwiches**.

---

## 🚀 Cómo publicarlo en Vercel (paso a paso)

### PASO 1 — Crear cuenta en GitHub
1. Ve a **github.com** y pulsa "Sign up"
2. Pon un email, contraseña y nombre de usuario
3. Verifica el email

### PASO 2 — Subir el proyecto a GitHub
1. Inicia sesión en github.com
2. Pulsa el botón **"+"** (arriba a la derecha) → "New repository"
3. Nombre: `sandok-tpv`
4. Deja en "Public" y pulsa **"Create repository"**
5. En la página que aparece, pulsa **"uploading an existing file"**
6. Arrastra toda la carpeta `sandok-tpv` o sube los archivos uno a uno:
   - `package.json`
   - `public/index.html`
   - `public/manifest.json`
   - `src/index.js`
   - `src/App.js`
   - `src/Ticket.js`
7. Pulsa **"Commit changes"**

### PASO 3 — Crear cuenta en Vercel y conectar
1. Ve a **vercel.com** y pulsa "Sign Up"
2. Elige **"Continue with GitHub"** (se conecta automáticamente)
3. Pulsa **"Add New Project"**
4. Busca `sandok-tpv` en la lista y pulsa **"Import"**
5. En "Framework Preset" selecciona **Create React App**
6. Pulsa **"Deploy"** y espera ~2 minutos

### PASO 4 — ¡Listo! 🎉
Vercel te dará una URL tipo:
```
https://sandok-tpv.vercel.app
```

Comparte esa URL con tus empleados. Pueden abrirla en el móvil y añadirla a la pantalla de inicio como si fuera una app.

---

## 📱 Instalar en el móvil

### iPhone (Safari)
1. Abre la URL en Safari
2. Pulsa el botón de compartir (cuadrado con flecha)
3. "Añadir a pantalla de inicio"
4. Pulsa "Añadir"

### Android (Chrome)
1. Abre la URL en Chrome
2. Pulsa los tres puntos (menú)
3. "Añadir a pantalla de inicio"
4. Pulsa "Añadir"

---

## 🖨️ Imprimir tickets
Al confirmar un cobro, aparece automáticamente la vista previa del ticket.
Pulsa **"Imprimir"** para imprimir desde el móvil u ordenador.

También puedes reimprimir cualquier ticket desde el **Historial** → botón "🖨️ Ticket".

---

## 📦 Estructura del proyecto
```
sandok-tpv/
├── public/
│   ├── index.html        ← HTML principal con PWA config
│   └── manifest.json     ← Config para instalar como app
├── src/
│   ├── index.js          ← Entrada de React
│   ├── App.js            ← TPV principal
│   └── Ticket.js         ← Diseño del ticket
└── package.json          ← Dependencias
```

---

## ✏️ Personalizar
- **Añadir productos**: Sección "⚙️ Productos" dentro de la app
- **Cambiar precios**: Misma sección
- **Los datos se guardan** automáticamente en el dispositivo

---

*Desarrollado para SandoK · Sevilla*
