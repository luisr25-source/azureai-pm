# AzureAI PM 🚀

Herramienta de gestión de proyectos con IA para Azure DevOps.  
Genera Epics, Features, User Stories, Tasks, Criterios de Aceptación, Casos de Uso y Casos de Prueba desde un documento funcional.

## 🌐 Deploy en GitHub Pages (paso a paso)

### 1. Crear repositorio
- Ir a [github.com](https://github.com) → **New repository**
- Nombre: `azureai-pm` (o el que prefieras)
- Visibilidad: **Public** ✅ (necesario para GitHub Pages gratis)
- Clic en **Create repository**

### 2. Subir los archivos
Desde la página del repositorio vacío:
- Clic en **uploading an existing file**
- Arrastrá los 3 archivos: `index.html`, `style.css`, `app.js`
- Clic en **Commit changes**

### 3. Activar GitHub Pages
- Ir a **Settings** (pestaña del repo)
- En el menú izquierdo: **Pages**
- Source: **Deploy from a branch**
- Branch: **main** → folder: **/ (root)**
- Clic en **Save**

### 4. Acceder
Después de ~2 minutos, tu app estará en:
```
https://TU_USUARIO.github.io/azureai-pm/
```

---

## ⚙️ Configuración inicial

Al abrir la app, ir a **Configuración** y completar:

### Azure DevOps
- **Organización**: el nombre de tu org (ej: `PNET`)
- **Proyecto**: nombre exacto del proyecto (ej: `Provincia Compras`)  
- **PAT**: Personal Access Token con permisos `Work Items → Read & Write`

**Cómo crear un PAT:**
1. Ir a `dev.azure.com` → click en tu avatar → **Personal access tokens**
2. **New Token** → nombre descriptivo
3. Scopes: `Work Items → Read & Write`
4. Copiar el token generado

### Anthropic API Key
- Conseguila en [console.anthropic.com](https://console.anthropic.com)
- Necesaria solo para la función de **Generar Artefactos**

---

## ✨ Funcionalidades

| Feature | Descripción |
|---------|-------------|
| 📋 **Mi Board** | Ver todos los work items con filtros por tipo, estado y asignado |
| ✨ **Generar Artefactos** | Pegás un documento funcional y la IA genera toda la jerarquía |
| ➕ **Crear Work Item** | Creación manual rápida con todos los campos |

### Lo que genera automáticamente:
- **Epics** → con objetivo y descripción
- **Features** → vinculadas a la Epic
- **User Stories** → con criterios de aceptación en formato Gherkin
- **Tasks** → vinculadas a cada User Story
- **Casos de Uso** → con flujo principal y alternativo
- **Casos de Prueba** → funcionales, de regresión y de borde
- **Diseño de Solución** → arquitectura, componentes, tecnologías y riesgos

Todo se crea en Azure DevOps con la **jerarquía correcta** (Epic → Feature → US → Task).

---

## 🔒 Seguridad

- Las credenciales se guardan **solo en tu navegador** (localStorage)
- No pasan por ningún servidor externo
- Las llamadas van directo a `dev.azure.com` y `api.anthropic.com`

---

## 🛠️ Archivos

```
├── index.html   # Estructura HTML de la app
├── style.css    # Estilos
├── app.js       # Lógica de la aplicación
└── README.md    # Este archivo
```
