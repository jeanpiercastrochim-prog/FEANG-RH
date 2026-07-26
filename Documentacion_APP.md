# Documentación APP - Chavin Mobile (React Native)

## Descripción Breve de la Aplicación
**Chavin Mobile** es el Portal de Autogestión del Colaborador (empleados y candidatos), diseñado como una aplicación móvil nativa (React Native). Su objetivo principal es descentralizar la carga operativa del equipo de Recursos Humanos, permitiendo que los trabajadores gestionen de manera autónoma sus procesos de vinculación (onboarding) y documentación laboral desde sus propios dispositivos móviles (smartphones).

La aplicación se comunica de forma segura mediante API REST con el backend central en C# (.NET), compartiendo la misma base de datos (RRHHDB) que el portal web administrativo. Está diseñada con una interfaz premium tipo "Glassmorphism", enfocada en la facilidad de uso y la seguridad de los datos.

## Ventanas y Flujos de Usuario (App Móvil)

Actualmente, la aplicación móvil maneja los siguientes flujos y pantallas principales:

### A. Módulo de Onboarding (Nuevos Ingresos)
Permite al trabajador realizar el proceso de vinculación de forma remota antes de presentarse físicamente en la oficina.

1. **Pantalla de Bienvenida e Instrucciones**
   - **Descripción**: Muestra un resumen de los pasos a seguir. Solicita al candidato tener su DNI físico a la mano y ubicarse en un lugar con buena iluminación.

2. **Pantalla de Captura Biométrica (Escáner de DNI)**
   - **Descripción**: Interfaz de cámara con un marco guía superpuesto (overlay) con las dimensiones exactas de un DNI peruano. Guía al usuario para capturar de manera nítida el anverso y el reverso de su documento.

3. **Pantalla de Formulario de Autocompletado (Confirmación de Datos)**
   - **Descripción**: Muestra un formulario estético donde los campos se pre-llenan gracias al OCR (procesado en el backend). El usuario puede revisar, corregir errores en su información personal (Nombres, Apellidos, Dirección) y añadir datos complementarios como nivel académico o contacto. Contiene el botón final "Enviar a Recursos Humanos".

4. **Pantalla de Éxito**
   - **Descripción**: Mensaje de confirmación final: "Tus datos han sido enviados a Recursos Humanos. Acércate a la oficina para la firma de tu contrato."

### B. Módulo de Autogestión (Empleados Activos)
Destinado a los trabajadores que ya forman parte de la empresa, accediendo mediante credenciales (DNI y Contraseña).

5. **Pantalla de Inicio (Home / Dashboard)**
   - **Descripción**: Pantalla principal tras el login. Incluye un saludo personalizado (Ej. "Hola, Alonso"), notificaciones recientes, un resumen rápido de su próxima boleta de pago y accesos directos grandes en formato tarjeta hacia sus contratos y boletas.

6. **Pantalla de Bóveda de Contratos (Mis Contratos)**
   - **Descripción**: Listado histórico de los contratos laborales firmados por el colaborador. Al pulsar sobre un ítem, permite visualizar el documento PDF correspondiente o descargarlo al celular.

7. **Pantalla de Historial de Boletas de Pago**
   - **Descripción**: Lista organizada cronológicamente (por meses y años) detallando el monto de cada boleta (Ej. "Boleta Julio 2026 - S/ 1,500.00"). Al seleccionar una, abre el visor de PDF nativo con el desglose de ingresos y descuentos.