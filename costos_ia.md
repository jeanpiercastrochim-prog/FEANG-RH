# Análisis de Costos: OCR Inteligente (Gemini AI) vs. Consulta Directa API RENIEC

Este documento detalla el análisis financiero y operativo entre continuar utilizando Inteligencia Artificial (Google Gemini) para la extracción y validación de datos del DNI, frente a la alternativa de integrar una consulta directa a la base de datos de RENIEC (vía API de terceros).

---

## 1. Costos de Google Gemini 1.5 Flash (IA)

Google Gemini factura en base a la cantidad de **tokens procesados**. Una imagen se procesa de manera extremadamente eficiente:

- **Tokens por imagen:** 259 tokens fijos por imagen.
- **Precio por cada 1,000,000 de tokens (Input):** $0.075 USD (aprox. S/ 0.28 PEN).
- **Procesamiento de un DNI (Anverso + Reverso + Prompt):** ~1,000 tokens en total por cada validación.

### Estimación de Costos IA:
- **Costo por 1 consulta (1 DNI):** $0.000075 USD (aprox. **S/ 0.0002 PEN**).
- **Costo por 10,000 consultas:** $0.75 USD (aprox. **S/ 2.85 PEN**).

**Ventajas:**
- Costo marginal prácticamente nulo.
- Extrae toda la información visible (incluyendo datos que a veces RENIEC no proporciona fácilmente como el distrito específico o detalles del reverso).

**Desventajas:**
- Riesgo de errores de lectura (OCR) si el DNI está borroso o tiene reflejos de luz.
- Posibilidad de saturación por "alta demanda" (aunque mitigable con cuentas Pay-As-You-Go).

---

## 2. Costos de Consulta API RENIEC (Proveedores de Terceros)

Dado que conectarse directamente al Web Service oficial de RENIEC implica procesos legales (Convenio de Suministro de Información) e implementaciones de seguridad muy altas, la mayoría de empresas utilizan APIs de terceros (empresas privadas que ya tienen el convenio).

- **Precio promedio por consulta (Unitario):** S/ 0.40 a S/ 1.20 PEN por DNI.
- **Planes mensuales (Volumen):** Un plan corporativo básico suele costar unos S/ 60.00 PEN mensuales por paquetes limitados de consultas, pero el precio por consulta individual en planes de alto volumen (Premium) ronda los **S/ 0.05 a S/ 0.15 PEN**.

### Estimación de Costos API RENIEC (Promedio optimista a S/ 0.10):
- **Costo por 1 consulta (1 DNI):** **S/ 0.10 PEN**.
- **Costo por 10,000 consultas:** **S/ 1,000.00 PEN**.

**Ventajas:**
- 100% de precisión y veracidad. Si el DNI existe, los nombres vendrán perfectos sin errores de lectura.
- No hay problemas si la foto sale borrosa, porque solo se necesita el número de DNI para hacer la consulta.

**Desventajas:**
- Costo infinitamente mayor (10,000 consultas = S/ 1,000 con RENIEC vs S/ 2.85 con IA).
- A menudo, las consultas de APIs económicas solo devuelven Nombres y Apellidos, pero **NO** devuelven datos completos del reverso (estado civil, dirección, fecha de nacimiento, ubigeo). Para obtener todos esos datos se requieren consultas de Nivel II que son aún más costosas.

---

## 3. Estrategia Adoptada (Sistema Híbrido + Fallback)

Tras evaluar los costos, la estrategia financiera y operativamente más inteligente para el sistema es:

### Prioridad 1: Uso de IA (Google Gemini) - *El camino principal*
- Se procesan todas las imágenes de los DNI mediante la IA.
- Esto mantiene el costo operativo de la empresa cercano a S/ 0.00 por contrato.

### Fallback (Plan de Respaldo) - *Mapeo por Modelo Entrenado*
- Si en algún momento la IA principal se cae o se satura (Error 503/429), **el sistema pasa automáticamente al Plan B**.
- El **Plan B** consiste en utilizar un modelo de respaldo de mapeo, pre-cargando los campos del formulario de confirmación para que el personal de Recursos Humanos o de Campo verifique y corrija los datos manualmente.
- Se ha integrado una alerta en rojo en la pantalla de "Validación" que le avisa al operador: *"La detección está siendo por mapeo de modelo entrenado alternativo, asique puede tener mayor margen de fallas si el DNI no se ve bien. Por favor verifique"*. Esto previene que avancen sin mirar.

### ¿Se recomienda integrar RENIEC?
Sí, pero **solo para validación de identidad en casos críticos**, no para la extracción masiva de datos (extracción de dirección, estado civil, fecha de nacimiento), ya que el costo se dispararía innecesariamente cuando la IA ya hace un trabajo excelente con un costo del 0.01% en comparación.

---

## 4. Proyecciones de Costos a Escala (DNI y Boletas)

A continuación, se presenta la proyección de costos exactos utilizando **Google Gemini 1.5 Flash** para diferentes volúmenes de documentos, calculados a la tarifa estándar ($0.075 USD por cada 1,000,000 de tokens de entrada).

### A. Extracción de Datos de DNI (Contratos)
Recordemos que **cada validación de DNI equivale a procesar 2 fotos** (Anverso y Reverso).
- Tokens promedio por DNI (2 imágenes + prompt estructurado): ~1,000 tokens.
- Costo unitario por 1 DNI: $0.000075 USD (S/ 0.00028 PEN)

| Volumen Mensual | Costo Estimado (USD) | Costo Estimado (PEN) | Equivalente |
| :--- | :--- | :--- | :--- |
| **1,000 DNIs** | $0.075 USD | ~S/ 0.28 PEN | 30 céntimos |
| **10,000 DNIs** | $0.75 USD | ~S/ 2.85 PEN | Un pasaje de bus |
| **100,000 DNIs** | $7.50 USD | ~S/ 28.50 PEN | Un menú ejecutivo |

### B. Verificación Masiva de Boletas de Pago
Las boletas de pago se analizan extrayendo el texto nativo del PDF y enviándolo a Gemini para que encuentre el DNI y haga el match inteligente.
- Tokens promedio por 1 Boleta (Texto + prompt): ~300 tokens.
- Costo unitario por 1 Boleta: $0.0000225 USD (S/ 0.000085 PEN)

| Volumen Mensual | Costo Estimado (USD) | Costo Estimado (PEN) | Equivalente |
| :--- | :--- | :--- | :--- |
| **1,000 Boletas** | $0.0225 USD | ~S/ 0.085 PEN | Ni 10 céntimos |
| **10,000 Boletas** | $0.225 USD | ~S/ 0.85 PEN | Menos de 1 Sol |
| **100,000 Boletas**| $2.25 USD | ~S/ 8.50 PEN | Un desayuno |

---

### Conclusión Ejecutiva

Como se observa en las tablas, automatizar la validación mediante Inteligencia Artificial tiene un costo estadísticamente irrelevante para los gastos operativos de la empresa. 
Incluso a una **escala masiva de 100,000 documentos mensuales** (cien mil empleados o cien mil boletas), el gasto combinado apenas bordea los $10.00 USD (S/ 38.00 PEN), generando un ahorro equivalente a miles de horas de trabajo manual humano de digitación y revisión.
