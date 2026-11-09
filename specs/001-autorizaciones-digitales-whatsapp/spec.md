# SPEC-001 — Gestión de autorizaciones digitales por WhatsApp

- Estado: propuesta validada para implementación inicial
- Prioridad: P0
- Feature: autorizaciones escolares digitales
- Usuario principal: padre, madre o acudiente verificado
- Usuario institucional: coordinadora o funcionario autorizado
- Versión: 1.0

## 1. Definición del problema

La escuela primaria atiende aproximadamente 300 estudiantes. Actualmente solicita en papel permisos para salidas, jornadas de vacunación y eventos. Los documentos se pierden, no regresan firmados o llegan después de la fecha límite. La coordinación no dispone de un registro centralizado y auditable que permita conocer qué acudiente respondió, qué decidió y cuándo lo hizo.

Las familias ya utilizan WhatsApp y no adoptaron aplicaciones móviles adicionales. Por tanto, la solución no puede depender de instalar una app. La escuela necesita iniciar la solicitud desde un panel administrativo, notificar al acudiente por el WhatsApp institucional y permitir que este responda desde una página web responsive.

Quedan fuera de este feature el control de recogidas mediante QR, las calificaciones, las tareas y la gestión académica.

## 2. Objetivo y resultado esperado

Permitir que un funcionario autorizado cree una actividad y solicite autorización para uno o varios estudiantes; que el acudiente verificado reciba una notificación por WhatsApp, abra un enlace seguro y registre una decisión; y que la escuela consulte el estado y la evidencia de cada respuesta.

La evidencia mínima debe identificar actividad, estudiante, acudiente, decisión, fecha/hora UTC, versión del texto presentado y estado de verificación.

## 3. Actores y permisos

### Coordinador/administrador
- Autenticarse en el panel.
- Crear, consultar y cerrar actividades.
- Seleccionar estudiantes.
- Emitir solicitudes.
- Consultar respuestas y exportar posteriormente reportes.
- No puede alterar una respuesta ya emitida; una corrección genera un evento nuevo.

### Acudiente
- Debe tener un vínculo vigente y verificado con el estudiante.
- Recibe el enlace en su número de WhatsApp registrado.
- Puede consultar los detalles de la actividad y responder una sola vez mientras la solicitud esté vigente.
- Puede corregir su decisión solo si la política institucional lo permite y antes del cierre; la corrección queda como un nuevo evento y conserva el historial.

### Sistema
- Genera enlaces aleatorios, de un solo uso y con expiración.
- Envía notificaciones por el número institucional usando WhatsApp Business Platform.
- Registra eventos de auditoría y estados de entrega.
- Impide respuestas duplicadas o fuera de vigencia.

## 4. Diseño de la solución

### Flujo principal
1. Un coordinador autenticado crea una actividad con nombre, descripción, fecha/hora del evento, fecha límite de respuesta y versión del texto de autorización.
2. Selecciona los estudiantes participantes.
3. El sistema obtiene los acudientes elegibles cuyo vínculo e identidad estén verificados y que tengan un teléfono confirmado.
4. Para cada solicitud se genera un token criptográficamente aleatorio, se almacena únicamente su hash y se define una expiración no posterior al cierre de la actividad.
5. El adaptador de WhatsApp envía una plantilla aprobada que incluye datos mínimos y un enlace HTTPS. No se envían datos sensibles en el mensaje.
6. El acudiente abre el enlace. El servidor valida token, vigencia, estado de la solicitud y vínculo verificado. El formulario muestra la actividad, el estudiante de forma minimizada y el texto/versión que acepta.
7. El acudiente elige “Autorizo” o “No autorizo”, confirma la decisión y el sistema registra la respuesta una sola vez.
8. La escuela consulta el tablero con estados pendiente, autorizado, no autorizado, vencido y error de entrega.
9. Cada transición relevante genera un evento append-only de auditoría.

### Componentes
- Angular 20 PWA: panel administrativo y vista responsive de respuesta.
- Spring Boot: API REST, reglas de negocio y seguridad.
- PostgreSQL: estudiantes, acudientes, vínculos, actividades, solicitudes, respuestas y auditoría.
- WhatsApp Cloud API: notificaciones institucionales.
- Webhook: estados de entrega y recepción técnica de eventos de Meta.

### Estados de solicitud
- `PENDING`: creada, aún sin respuesta.
- `SENT`: aceptada por el proveedor para envío.
- `DELIVERED`: WhatsApp reportó entrega.
- `AUTHORIZED`: acudiente autorizó.
- `NOT_AUTHORIZED`: acudiente no autorizó.
- `EXPIRED`: venció sin respuesta.
- `REVOKED`: cancelada por la escuela.
- `DELIVERY_FAILED`: fallo definitivo de notificación.

La aceptación de WhatsApp por el proveedor no equivale a entrega ni a respuesta del acudiente.

### Seguridad
- Acceso administrativo protegido por autenticación y roles.
- La página de respuesta usa token de alta entropía, de un solo uso, con expiración y almacenamiento mediante hash.
- La respuesta se vincula a un acudiente previamente verificado; poseer el enlace por sí solo no debe ser la única prueba de identidad para actividades de alto impacto. Se podrá exigir un segundo factor o código de verificación al teléfono registrado según la evaluación de riesgo.
- HTTPS obligatorio.
- Rate limiting, protección contra fuerza bruta, validación de entradas y protección de secretos.
- El token no se escribe en logs, analítica ni bitácora.
- El contenido de auditoría minimiza datos personales.
- Los mensajes de WhatsApp se envían desde el número institucional mediante API oficial; no se automatizan cuentas personales.

### Auditoría
Registrar, como mínimo: `ACTIVITY_CREATED`, `REQUEST_CREATED`, `WHATSAPP_SUBMITTED`, `WHATSAPP_DELIVERED`, `WHATSAPP_FAILED`, `RESPONSE_RECORDED`, `REQUEST_EXPIRED`, `REQUEST_REVOKED` y `ADMIN_EXPORT_CREATED`.
Cada evento contiene ID, tipo, fecha/hora UTC, actor o sistema, referencia de entidad, datos mínimos, hash previo y hash actual. La aplicación no ofrece actualización ni eliminación de eventos. El anclaje externo de hashes y los backups se configuran como controles operativos adicionales.

## 5. Criterios de aceptación verificables

### CA-01 — Crear y emitir solicitudes
**Dado** un coordinador autenticado y una actividad con campos obligatorios válidos,  
**cuando** selecciona uno o más estudiantes y confirma la emisión,  
**entonces** el sistema crea exactamente una solicitud vigente por cada combinación actividad-estudiante-acudiente elegible, registra `ACTIVITY_CREATED` y `REQUEST_CREATED`, y genera un enlace único con expiración.  
**Verificación:** prueba de integración que comprueba cantidades, unicidad, hash del token y eventos de auditoría.

### CA-02 — Notificación por WhatsApp institucional
**Dado** una solicitud creada y un acudiente con número verificado,  
**cuando** el sistema procesa la notificación,  
**entonces** envía el mensaje mediante el adaptador oficial de WhatsApp Business Platform, guarda el identificador del proveedor y registra el resultado de envío; si el proveedor falla, la solicitud queda en estado de error/reintento sin crear una segunda solicitud.  
**Verificación:** prueba con adaptador simulado y prueba de contrato; antes de producción, prueba de extremo a extremo con cuenta de Meta y plantilla aprobada.

### CA-03 — Registrar una respuesta segura
**Dado** un enlace válido, vigente y asociado a un acudiente verificado,  
**cuando** el acudiente selecciona “Autorizo” o “No autorizo” y confirma,  
**entonces** el sistema registra una sola respuesta con estudiante, actividad, acudiente, decisión, timestamp UTC y versión del texto; invalida el token y registra `RESPONSE_RECORDED`.  
**Verificación:** pruebas de integración para ambas decisiones, token usado, token expirado, token revocado y doble envío concurrente.

### CA-04 — Bloquear respuestas no válidas
**Dado** un enlace inexistente, expirado, revocado o ya utilizado, o un vínculo de acudiente no verificado,  
**cuando** se intenta consultar o enviar una respuesta,  
**entonces** el sistema rechaza la operación sin revelar datos del estudiante, no cambia el estado y registra un evento de seguridad sin guardar el token.  
**Verificación:** pruebas negativas de API y comprobación de que no hay cambios en la respuesta ni filtración de datos.

### CA-05 — Consulta y trazabilidad administrativa
**Dado** un coordinador autenticado con permiso sobre la institución,  
**cuando** consulta una actividad,  
**entonces** ve el total de solicitudes por estado y el detalle de cada estudiante/acudiente autorizado para su rol; la bitácora permite reconstruir la secuencia de eventos y no admite actualización o eliminación desde la aplicación.  
**Verificación:** prueba de autorización por roles, prueba de consulta de estados y prueba de rechazo de UPDATE/DELETE sobre auditoría.

## 6. Requisitos no funcionales
- Responsive desde 360 px de ancho; usable en Android e iOS modernos.
- Objetivo inicial de disponibilidad: 99% mensual, sujeto al proveedor de hosting.
- Para 300 estudiantes, la consulta del tablero debe responder en menos de 2 segundos en el percentil 95 bajo carga nominal acordada.
- Las fechas se guardan en UTC y se presentan en `America/Bogota`.
- La API debe soportar idempotencia en emisión y respuesta.
- No registrar documentos, teléfonos completos, tokens ni contenido sensible en logs.
- Cumplir revisión de privacidad, seguridad y protección de menores antes de producción.
- Accesibilidad objetivo WCAG 2.2 AA.

## 7. Fuera de alcance
- Control de recogida de estudiantes y QR.
- Registro de fotografías de recogida.
- Calificaciones, tareas y gestión académica.
- Firma digital certificada o equivalencia automática a firma electrónica avanzada.
- Aplicación nativa Android/iOS.
- Integración con WhatsApp personal de cada padre.
- Garantía de entrega si WhatsApp o el operador del acudiente no están disponibles.

## 8. Supuestos y decisiones pendientes
- La escuela dispone de un número institucional apto para WhatsApp Business Platform.
- Existe una fuente autorizada para importar estudiantes y relaciones de acudientes.
- La institución verificará identidad, patria potestad/representación y teléfonos antes de activar solicitudes.
- Debe definirse con asesoría legal el texto de autorización, conservación de evidencia y tratamiento de datos sensibles (por ejemplo, vacunación).
- El presupuesto de operación menor a $40.000 COP/mes es una restricción objetivo; debe validarse con precios, límites gratuitos, backups, dominio, mensajería, impuestos y requisitos de disponibilidad. No se garantiza producción segura con servicios gratuitos sin evaluación.
- Para el primer piloto se usarán datos ficticios o anonimizados.

## 9. Definition of Done
- CA-01 a CA-05 implementados y demostrados con pruebas automatizadas.
- Migraciones de base de datos incluidas.
- Adaptador WhatsApp probado con simulador y contrato; integración real marcada como pendiente hasta contar con credenciales y plantilla aprobada.
- No hay secretos ni datos reales de menores en el repositorio.
- Instrucciones de ejecución y variables de entorno documentadas.
- Revisión de seguridad y privacidad pendiente explícitamente identificada antes de producción.
