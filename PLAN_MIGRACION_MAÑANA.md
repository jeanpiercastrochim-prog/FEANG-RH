# 📋 Plan de Integración de Cambios para Mañana

Este es el paso a paso detallado para que integres todo el desarrollo que realizamos hoy (Login Glassmorphism, solución del OCR de alta precisión con Gemini 2.5, compatibilidad con base de datos v4 y la carga de nuevos datos) en la computadora de tu oficina.

---

## 🛠️ Paso 1: Descargar los cambios en la oficina

Abre la terminal en la carpeta de tu proyecto en la computadora de tu trabajo y ejecuta:

```bash
# 1. Obtener la nueva rama desarrollo-casa desde GitHub
git fetch origin

# 2. Asegúrate de estar en tu rama de trabajo principal (ej. main)
git checkout main

# 3. Fusionar (mergear) los cambios desarrollados hoy
git merge origin/desarrollo-casa
```

> [!NOTE]
> Si hay algún conflicto en archivos como `Sidebar.jsx`, resuélvelo en tu editor de código aceptando los cambios de ambas ramas (los del trabajo y los de la casa).

---

## 🗄️ Paso 2: Verificar la Base de Datos en tu trabajo

La versión que manejamos hoy incluye cambios críticos para que no se rompan las consultas en la nueva base de datos y además **hemos agregado más datos**.
1. Abre **SQL Server Management Studio** y conéctate a tu servidor local.
2. Asegúrate de que la base de datos `RRHHDB` esté activa y tenga las tablas actualizadas con los nuevos datos.
3. El archivo [database_schema.sql](file:///c:/proyecto/PRIME_RH/database_schema.sql) está disponible en la rama por si necesitas reinstanciarla o actualizarla con los datos recientes:
   ```bash
   sqlcmd -S localhost -E -i "database_schema.sql"
   ```

---

## 🖥️ Paso 3: Recompilar e Iniciar el Backend (API C#)

Una vez que se hayan fusionado los cambios, la API de C# debe ser recompilada para aplicar el fix del mapeo de la columna `Estado` y el nuevo endpoint de **Gemini 2.5 Flash** en `OcrService.cs`:

```bash
# 1. Ve a la carpeta de la API en tu consola
cd src/Api

# 2. Compila el backend
dotnet build

# 3. Levanta la API
dotnet run
```

---

## 🌐 Paso 4: Iniciar el Frontend Web (React + Vite)

El frontend está configurado para conectarse directamente a la IP `127.0.0.1:5000` resolviendo cualquier conflicto de red.

```bash
# 1. Abre otra terminal y ve a la carpeta del Frontend
cd src/Frontend

# 2. Instala dependencias si es necesario
npm install

# 3. Inicia el servidor de desarrollo
npm run dev
```

---

## 🚀 Paso 5: Pruebas de Verificación Obligatorias

1. Accede a **[http://localhost:5173/](http://localhost:5173/)**:
   * Deberías ver la nueva pantalla de **Login Glassmorphism** animada.
   * Inicia sesión con la cuenta de Recursos Humanos:
     * **DNI**: `11111111` | **Clave**: `rebeca123`
2. Ve a **[http://localhost:5173/scanner/campo](http://localhost:5173/scanner/campo)**:
   * Sube imágenes de prueba del DNI (anverso y reverso).
   * Selecciona el motor **IA Gemini** y haz clic en **Confirmar y Analizar**.
   * Verifica que se extraigan correctamente:
     * El número de **DNI/CUI** de 8 dígitos.
     * La **dirección completa** (ej: *"CALLE LOS DIAMANTES C - 16 URB. CALIFORNIA"*).
     * El **sexo** (ej: *"MASCULINO"*).
3. Prueba también con el **Modelo Local** (Tesseract) para validar que el OCR offline funciona sin problemas de red.
