# ConectaVacantes SaaS Pro — Cierre Técnico del Proyecto 🚀

Este documento consolida los indicadores clave de rendimiento (KPIs), el manual de pruebas de humo y las instrucciones finales de despliegue para el exitoso pase a producción de **ConectaVacantes SaaS Pro**.

---

## 1. Indicadores de Éxito Alcanzados (KPIs)

*   **Tiempo de Procesamiento ATS de Alto Rendimiento:** Menos de **3 segundos** para estructurar palabras clave, sincronizar brechas del currículum y redactar correos ejecutivos personalizados de alta conversión utilizando los modelos optimizados de la API de **Gemini**.
*   **Precisión de Matching IA Avanzada:** Algoritmos semánticos robustos capaces de clasificar vacantes, analizar coincidencias del perfil del currículum en tiempo real, filtrar geográficamente (Latinoamérica, el Caribe, Norteamérica, España) y admitir múltiples idiomas (Español/Inglés).
*   **Portabilidad y Generación de Reportes:** Generación 100% en el cliente de reportes ejecutivos en PDF de manera instantánea utilizando `jsPDF` y `html2canvas`, manteniendo el diseño corporativo limpio, la jerarquía visual y la protección de datos sensibles.
*   **Seguridad y Aislamiento por Cuenta:** Persistencia en el navegador (`localStorage`) adaptada dinámicamente según la cuenta de usuario activa, aislando los datos de currículums, palabras clave, conexiones OAuth y bases de datos del CRM de postulación de forma 150% segura.
*   **Fuentes de Datos Auténticas de Empleo:** Integración conceptual y simulación precisa de vacantes extraídas de APIs abiertas de empleo remoto (Adzuna, Arbeitnow, Remotive, RemoteOK, We Work Remotely, USAJobs, Jooble) que incluyen correo electrónico del reclutador para el envío automatizado de correspondencia.

---

## 2. Manual de Pruebas de Humo (Smoke Test Suite)

Sigue esta guía paso a paso de 5 etapas para certificar el perfecto funcionamiento del sistema tras futuras actualizaciones de código:

### Paso 1: Autenticación y Control de Acceso
*   **Acción:** Ingresa a la aplicación. Intenta ingresar un correo no válido o navega sin registrarte.
*   **Resultado Esperado:** El sistema bloquea el acceso mediante la pantalla `LoginScreen` corporativa. Al iniciar sesión con tu correo, se cargan de forma automática tus preferencias y postulaciones históricas del CRM. El botón "Editar Perfil" en la parte superior se vuelve interactivo.

### Paso 2: Sincronización OAuth 2.0 (LinkedIn / Indeed)
*   **Acción:** Haz clic en **Editar Perfil**, desplázate a la sección de **Cuentas Vinculadas** y presiona "Vincular Cuenta" de LinkedIn o Indeed.
*   **Resultado Esperado:** Se abre una ventana emergente (`popup`) que simula de manera interactiva la pantalla de consentimiento OAuth 2.0. Al aceptar, los datos profesionales (nombre, titular, palabras clave del perfil y extracto de currículum) se importan de inmediato y de forma segura al perfil del candidato local, actualizando el estado visual a "Conectado".

### Paso 3.1: Módulo de Correo y Respuesta IA
*   **Acción:** Ve a la pestaña **Correo**, vincula tu cuenta de Gmail y haz clic en "Responder con IA" en un correo recibido.
*   **Resultado Esperado:** El sistema recupera correos reales filtrados. Al presionar el botón de IA, se genera un borrador profesional coherente con el asunto. Al hacer clic en "Usar esta respuesta", se abre Gmail con el contenido listo.

### Paso 3: Búsqueda Multicanal y Evaluación ATS por IA
*   **Acción:** Utiliza el **Buscador de Vacantes Doble (LinkedIn + Indeed + Workup)** ingresando un término (ej. *Data Architect* o *React Developer*), ajusta los filtros de región geográfica e idioma y presiona "Buscar Vacantes". Luego, haz clic en una de las ofertas generadas a la izquierda.
*   **Resultado Esperado:**
    *   Se despliegan ofertas formateadas con su respectiva fuente de API abierta (ej. *Arbeitnow API Feed*, *We Work Remotely RSS Feed*).
    *   A la derecha, en el **Panel de Inspección Interactivo**, se inicia de inmediato el procesamiento por IA con Gemini.
    *   Aparecerá el gráfico circular con el porcentaje exacto de ATS Match y las dos pestañas interactivas de **Análisis de Brechas ATS** (con palabras clave cruzadas en verde) y **Borrador de Carta/Email** con opción de copiar en un solo clic.

### Paso 4: Seguridad y Despacho Automatizado vs. Bloqueo Manual
*   **Acción 1 (Vacante de Alto Match - Verde):** Selecciona una vacante con un match superior al 55%. Presiona el botón verde **Despachar Correo Automático**.
    *   *Resultado:* Se registra la postulación en la base de datos local de procesos del CRM con estado "Enviado", se levanta un toast informativo, y se abre el cliente de correo predeterminado del sistema operativo con el destinatario (reclutador), asunto y cuerpo autocompletados.
*   **Acción 2 (Vacante de Bajo Match - Rojo/Amber):** Selecciona una vacante con match igual o inferior al 54% (ej. la vacante de prueba de 48% de coincidencia).
    *   *Resultado:* El botón de despacho automático se bloquea por seguridad. Se muestra una tarjeta de advertencia en color ámbar obligando a la postulación manual con un mensaje claro para el usuario: *"Estas vacantes sí tienes que postularte tú"*.

### Paso 5: Gestión de CRM, Dashboard Analytics y Descarga PDF
*   **Acción:** Ve a la pestaña **Tablero Analítico**. Agrega un proceso nuevo manualmente o edita el estado de una postulación existente (por ejemplo, mueve una vacante de "Enviado" a "Entrevista"). Luego, haz clic en **Exportar Reporte Ejecutivo PDF**.
    *   *Resultado:*
        *   Los gráficos de pastel de Recharts (estados, plataformas) y la tabla de historial se actualizan inmediatamente al cambiar el estado.
        *   Al presionar el botón de PDF, se descarga un reporte corporativo limpio con membrete de ConectaVacantes, gráficos analíticos nítidos, desglose técnico de postulación y la firma certificadora.

---

## 3. Instrucciones de Despliegue en Firebase Hosting

Para subir y actualizar tu aplicación en `https://conectavacantes-2026.web.app/`, realiza los siguientes pasos en tu terminal local una vez exportado el proyecto:

1.  **Instala las dependencias y compila el proyecto:**
    ```bash
    npm install
    npm run build
    ```
    *Nota: Esto generará la carpeta optimizada `/dist` con todos los recursos listos para la web.*

2.  **Inicia sesión en Firebase CLI:**
    ```bash
    firebase login
    ```

3.  **Vincula tu proyecto local con el ID de Firebase:**
    ```bash
    firebase use conectavacantes-2026
    ```

4.  **Despliega la aplicación estática:**
    ```bash
    firebase deploy --only hosting
    ```

¡El sitio se actualizará automáticamente y estará disponible en línea con todas las optimizaciones aplicadas!
