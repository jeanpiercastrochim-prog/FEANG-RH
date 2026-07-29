         # Documentación Técnica Detallada del Sistema: Plataforma "Chavin" (Ecosistema Omnicanal RRHH)

         ---

         ## 1. Visión General del Ecosistema

         **Chavin** es una solución corporativa omnicanal diseñada para automatizar el ciclo de vida inicial y la gestión de nómina de los colaboradores. La plataforma integra inteligencia artificial, lectura de documentos mediante OCR y generación dinámica de PDFs para reducir el tiempo de contratación de 10 minutos a menos de 2 minutos por persona. El sistema está diseñado para operar con redundancia (offline y en nube) garantizando el cumplimiento normativo de protección de datos (Ley 29733 en el Perú) y la validez legal ante SUNAFIL mediante la preservación de la firma física y la huella dactilar.

         El ecosistema se divide en:
         1. **Sistema Web (React.js + Vite):** Orientado a la gestión interna de Recursos Humanos y a la habilitación de terminales físicos de autoservicio en oficinas.
         2. **Aplicación Móvil (React Native + Expo):** Orientada a la autogestión remota del candidato (Onboarding) y del empleado contratado (Nóminas y Contratos).
         3. **Backend API REST (C# .NET 8):** El motor centralizado de procesamiento, OCR y persistencia.

         ---

         ## 2. Arquitectura de Integración y Servicios Comunes

         ### A. Backend (C# .NET 8 Web API)
         El backend actúa como el punto único de verdad y procesamiento de datos:
         * **Motor de Inferencia local:** Implementa `Microsoft.ML.OnnxRuntime` para ejecutar modelos de Machine Learning (PaddleOCR entrenado localmente) sin dependencia de servicios externos.
         * **Procesamiento Gráfico:** Usa `SixLabors.ImageSharp` para aplicar filtros de normalización (escala de grises, contraste adaptativo binarizado, corrección de rotación EXIF y redimensionamiento) a los DNIs capturados.
         * **Motor de Generación de PDFs:** Utiliza la biblioteca `QuestPDF` para estructurar plantillas de contratos dinámicas inyectando los datos de la base de datos en tiempo real.
         * **Parser de Nómina Masiva:** Emplea `UglyToad.PdfPig` para procesar archivos PDF multipartes de boletas de pago, extrayendo mediante expresiones regulares el DNI del empleado y el monto neto a pagar.

         ### B. Motor OCR Híbrido
         * **Local (Tesseract OCR / ONNX):** Analiza la zona inferior del DNI (zona MRZ) y campos estructurados de forma offline.
         * **Nube (Google Gemini AI):** Envío asíncrono y encriptado en caso de fallos del motor local para obtener la extracción en un formato estructurado JSON.

         ### C. Persistencia (Base de Datos Relacional)
         Soporta SQLite para entornos locales y SQL Server para producción corporativa. Estructura de tablas:
         * `Employees`: Almacena información personal, DNI, datos académicos, credenciales de acceso y cargo actual.
         * `DniPhotos`: Guarda la ruta de almacenamiento físico de las fotos tomadas del DNI (anverso y reverso).
         * `Contracts`: Registro de plantillas de contratos disponibles.
         * `EmployeeContracts`: Estado y fecha de firma de los contratos asociados a un empleado.
         * `Payslips`: Cabecera de los periodos de nómina (Mes y Año).
         * `EmployeePayslips`: Detalles de boletas individuales vinculando empleados, montos pagados, estados ("Pendiente", "Enviado") y fechas de generación.

         ---

         ## 3. Parte 1: El Sistema Web (React.js + Vite)

         El Sistema Web es el centro neurálgico administrativo. Está diseñado para ofrecer **dos modos de operación** claramente diferenciados y configurables:

         ### MODO 1: Consola de Administración de Recursos Humanos (RRHH)
         Este modo es exclusivo para el personal de RRHH y funciona como un panel de control avanzado para supervisar las contrataciones y la nómina.

         #### Funcionalidades Detalladas del Modo RRHH:
         1. **Monitoreo y Aprobación de Expedientes (Bandeja de Pendientes):**
            * Muestra una tabla interactiva con todos los candidatos que han iniciado su registro (ya sea desde un quiosco físico en la oficina o remotamente a través de la App Móvil).
            * Muestra información clave: Nombre completo, número de DNI, fecha de creación y estado del proceso.
         2. **Consola de Confirmación de Datos y Edición en Vivo:**
            * Al seleccionar un candidato pendiente, se abre una interfaz dividida: a un lado se muestran las fotos reales del DNI (anverso y reverso) y al otro lado el formulario con los campos extraídos por el OCR.
            * **Modo Edición Activa:** Permite al analista hacer clic sobre cualquier casilla (Nombres, DNI, Dirección, etc.) y corregir manualmente si la IA leyó algún dato de forma errónea.
            * **Visor Interactivo de Imágenes:** Permite hacer clic en las fotos del DNI para abrir un modal con zoom a alta resolución para leer con claridad firmas u hologramas.
            * **Timeline del Expediente:** Línea de tiempo visual que detalla la hora exacta de la toma de fotos, el análisis OCR y la recepción del formulario.
         3. **Módulo de Generación y Configuración del Contrato:**
            * Permite asignar el cargo del empleado y seleccionar de una lista la plantilla de contrato legal adecuada (Personal de Campo, Ejecutivo, Practicante, etc.).
            * Genera dinámicamente el contrato y lo previsualiza en un visor embebido de PDF al 70% de la pantalla.
            * Cuenta con un botón destacado de **Impresión Rápida** para enviar el documento a la impresora física directamente desde el navegador.
         4. **Módulo de Contratos Firmados:**
            * Historial consolidado de trabajadores que firmaron físicamente el contrato. Muestra el estado como "Firmado", la fecha/hora de la firma y el cargo definitivo asignado.
         5. **Consola de Gestión y Distribución Masiva de Boletas (Nóminas):**
            * **Subida Masiva:** Permite a RRHH arrastrar un único archivo PDF que contiene las boletas de pago de todos los empleados del mes.
            * **Procesamiento y División:** El backend extrae el DNI de cada empleado y el monto correspondiente de cada página del PDF, mapeándolo con la base de datos de manera automática.
            * **Distribución Electrónica:** Al hacer clic en "Enviar Boletas Masivamente", el estado de las boletas cambia de "Pendiente" a "Enviado". Las boletas se publican instantáneamente en las cuentas de la App Móvil correspondientes a cada DNI, reduciendo a cero el tiempo de distribución física.
            * **Estadísticas de Nómina:** Tarjetas dinámicas que muestran el costo de nómina mensual neta calculado en tiempo real a partir de las boletas subidas.

         ---

         ### MODO 2: Modo Quiosco de Oficina (Auto-Registro Presencial)
         Este modo convierte la interfaz web en una estación de autoservicio simplificada (pantalla táctil o tablet) instalada físicamente en la oficina de reclutamiento.

         #### Funcionalidades Detalladas del Modo Quiosco:
         1. **Flujo Autoguiado y Bloqueado:**
            * Se oculta la barra lateral (`Sidebar.jsx`) y el menú administrativo para evitar que el candidato acceda a información confidencial de otros trabajadores o a configuraciones del sistema.
            * Guías visuales grandes y tipografía de fácil lectura para usuarios que no están familiarizados con la tecnología.
         2. **Captura Biométrica Paso a Paso (Cámara WebRTC):**
            * El candidato interactúa directamente con la cámara integrada de la tablet o PC de la oficina.
            * El sistema le pide tomar la foto del anverso del DNI y luego del reverso, mostrando un contorno translúcido en pantalla para alinear la tarjeta plástica correctamente.
         3. **Formulario de Estudios Directo:**
            * Interfaz táctil amigable donde el candidato selecciona su nivel académico e ingresa el nombre de sus escuelas o institutos antes de finalizar su auto-registro y quedar guardado en la cola de revisión de RRHH.

         ---

         ### Mapa de Componentes Frontend del Sistema Web
         * `DashboardHome.jsx`: Panel de bienvenida que permite alternar entre el Modo Administrativo y el Modo Quiosco de Campo.
         * `ScannerFlow.jsx`: Controlador y orquestador central del flujo del candidato en el quiosco (Foto -> Revisión -> Contrato).
         * `CameraCapture.jsx`: Componente de cámara que interactúa con la API WebRTC para tomar y validar las capturas de imagen.
         * `AcademicForm.jsx`: Captura los datos educativos del candidato de forma simple.
         * `DataConfirmation.jsx`: Consola de revisión interactiva para RRHH con edición activa, visor con zoom y timeline.
         * `SelectContract.jsx`: Listado y selección de plantillas contractuales.
         * `ContractPreview.jsx`: Componente visor del PDF final y control de impresión.
         * `BoletasDePago.jsx`: Consola administrativa de boletas con subida masiva, indicadores financieros e indexador de empleados.
         * `ProcessList.jsx`: Bandeja de visualización de los expedientes que se encuentran en estado pendiente.
         * `ContratosFirmados.jsx`: Módulo de consulta de expedientes finalizados y contratos firmados.
         * `SubirContratos.jsx`: Interfaz para cargar nuevas plantillas de contrato al sistema.
         * `Sidebar.jsx`: Menú de navegación lateral persistente de RRHH (ocultado en el Modo Quiosco).

         ---

         ## 4. Parte 2: La Aplicación Móvil (React Native + Expo)

         La Aplicación Móvil es una solución de autogestión de bolsillo desarrollada en React Native y empaquetada con Expo. Permite descentralizar las tareas de RRHH otorgando autonomía a los candidatos y colaboradores a través de **dos módulos o modos de operación** definidos según el estado del usuario:

         ### MODO 1: Módulo de Onboarding para Nuevos Ingresos (Candidatos)
         Diseñado para que los candidatos que van a ingresar a laborar completen su expediente digital desde su propio celular, eliminando la necesidad de usar el Quiosco físico de la oficina y evitando aglomeraciones.

         #### Funcionalidades Detalladas del Modo Onboarding:
         1. **Tutorial e Instrucciones de Captura:**
            * Muestra pantallas con gráficos animados explicativos: cómo evitar reflejos de luz, cómo sostener el DNI, y la importancia de que los bordes de la tarjeta sean visibles.
         2. **Escaneo de DNI con Cámara Nativa Móvil:**
            * Implementa `expo-camera` para una captura rápida y enfoque automático.
            * Dibuja un rectángulo interactivo en la pantalla del celular que simula las dimensiones exactas del DNI peruano para guiar la correcta toma del anverso y reverso.
         3. **OCR y Carga Asíncrona:**
            * Al tomar las fotos, la aplicación las envía en segundo plano al backend (`POST /api/Process/start`).
            * Mientras se realiza el OCR, se muestra una animación fluida de carga.
         4. **Validación Remota por el Candidato:**
            * La app recibe el JSON con los datos extraídos de su DNI. El candidato los visualiza en campos de texto nativos y los corrige si existiera algún error.
            * Registra sus datos académicos y confirma el envío. El expediente se envía al servidor móvil (`POST /api/Process/submit-mobile`) quedando clasificado en estado "Pendiente" y notificando a la consola web de RRHH de forma instantánea.

         ---

         ### MODO 2: Módulo de Autogestión para Colaboradores Activos (Empleados)
         Una vez que el candidato es contratado y RRHH finaliza su proceso en la consola web, su cuenta móvil se activa con permisos de Colaborador Activo. Accede a través de sus credenciales (DNI y Contraseña generada).

         #### Funcionalidades Detalladas del Modo Autogestión:
         1. **Dashboard Home (Inicio del Empleado):**
            * Presenta un saludo dinámico y resumen visual de su perfil laboral (Cargo, Salario base).
            * Muestra un acceso directo o notificación del último documento cargado (última boleta de pago o contrato nuevo por firmar).
            * Utiliza tarjetas translúcidas de estilo *Glassmorphism* para una experiencia visual de alta gama.
         2. **Bóveda Digital de Contratos:**
            * El empleado puede ver un historial ordenado de todos los contratos que ha firmado con la empresa a lo largo del tiempo.
            * Al seleccionar un contrato, la aplicación abre un visor de PDF nativo que permite leer el documento completo, guardarlo en el almacenamiento del celular o enviarlo por correo.
         3. **Historial y Detalle de Boletas de Pago:**
            * Listado vertical agrupado por meses y años de todas las boletas de pago distribuidas electrónicamente por RRHH.
            * Cada registro muestra el período (ej: "Julio 2026"), el monto neto percibido y un botón de descarga.
            * **Visor de Boletas Integrado:** Permite abrir la boleta, revisar el desglose detallado de sueldos y aportes (AFP, comisiones, seguros) en formato PDF digital oficial.

         ---

         ### Mapa de Pantallas de la Aplicación Móvil
         1. **Pantalla de Bienvenida (`WelcomeScreen.js`):** Pantalla de inicio con la opción de registrar un nuevo DNI (Onboarding) o iniciar sesión (Autogestión).
         2. **Pantalla de Escaneo (`ScannerCameraScreen.js`):** Interfaz nativa de la cámara móvil con guías de encuadre, control de flash y detector de calidad de captura.
         3. **Pantalla de Confirmación de Datos (`ConfirmDataScreen.js`):** Formulario estético de verificación de los datos extraídos del DNI y captura de información académica.
         4. **Pantalla de Éxito de Registro (`SuccessOnboardingScreen.js`):** Mensaje triunfal confirmando el envío a RRHH y dando instrucciones para el siguiente paso presencial.
         5. **Pantalla de Autenticación (`LoginScreen.js`):** Formulario de acceso con DNI y clave, preparado para autenticación biométrica (huella dactilar/FaceID).
         6. **Dashboard del Empleado (`EmployeeDashboard.js`):** Panel principal del empleado activo con widgets dinámicos y resumen salarial.
         7. **Visor de Contratos (`ContractVaultScreen.js`):** Lista y visor de los contratos PDF del empleado.
         8. **Historial de Boletas (`PayslipHistoryScreen.js`):** Lista cronológica de boletas de pago recibidas con filtros de fecha.
         9. **Visor de Boleta Individual (`PayslipViewerScreen.js`):** Pantalla de visualización detallada del PDF de la boleta de pago seleccionada.

         ---

         ## 5. Resumen Comparativo de Modos y Sinergia

         | Criterio | Modo Web Quiosco (Presencial) | Modo Web RRHH (Administrador) | Modo Móvil Onboarding (Candidato) | Modo Móvil Autogestión (Empleado) |
         | :--- | :--- | :--- | :--- | :--- |
         | **Dispositivo** | Tablet / PC fija en oficina | Computadora de Oficina | Smartphone del Candidato | Smartphone del Empleado |
         | **Acceso** | Libre (Pantalla bloqueada) | Credencial Administrativa | Libre / Sin Login previo | Credencial (DNI + Contraseña) |
         | **Captura DNI** | Cámara WebRTC (USB/Integrada) | No Aplica (Solo visualización) | Cámara Nativa del Celular | No Aplica |
         | **Propósito** | Registro presencial rápido | Validación, firma y nóminas | Registro remoto cómodo | Consulta y descargas |
         | **Documentos** | No Aplica (Solo inputs) | Gestión masiva de PDFs | No Aplica | Visor PDF (Contratos y Boletas) |

         Esta combinación omnicanal asegura que los flujos de información converjan siempre en el mismo repositorio de datos, logrando que el personal administrativo y los colaboradores operen en sintonía con procesos automatizados libres de papel e ingresos manuales erróneos.
