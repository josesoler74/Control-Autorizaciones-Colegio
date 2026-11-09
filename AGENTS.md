# Instrucciones generales para agentes — Control de autorizaciones y recogidas por WhatsApp

## Propósito del producto
Construir una solución para una escuela primaria de aproximadamente 300 estudiantes que permita gestionar autorizaciones escolares y, en una fase posterior, controlar la recogida segura de estudiantes. Los padres no deben instalar aplicaciones nuevas: WhatsApp es el canal de notificación y una PWA responsive es el canal web de respuesta.

## Principios obligatorios
1. Priorizar la seguridad, privacidad y protección integral de niños, niñas y adolescentes.
2. No almacenar datos personales en códigos QR ni incluir datos sensibles en URLs.
3. No asumir que un mensaje enviado por WhatsApp equivale a identidad verificada o consentimiento.
4. Toda autorización debe estar vinculada a un acudiente verificado, un estudiante, una actividad, una versión de términos y una marca de tiempo.
5. No sobrescribir evidencia histórica. Las correcciones se registran como nuevos eventos que referencian el evento anterior.
6. Aplicar mínimo privilegio, validación en servidor, HTTPS y controles de acceso por rol.
7. No exponer secretos, tokens de WhatsApp, credenciales ni datos de menores en logs.
8. No usar automatización no oficial de WhatsApp Web ni acceder a cuentas personales de los padres. Integrar exclusivamente el número institucional mediante WhatsApp Business Platform / Cloud API.
9. Diseñar para 300 estudiantes, evitando microservicios prematuros. Preferir un monolito modular.
10. Mantener fuera de alcance calificaciones, tareas y gestión académica porque la escuela ya dispone de otro sistema.

## Stack de referencia
- Frontend: Angular 20 standalone, TypeScript, PWA responsive.
- Backend: Java 21 + Spring Boot 3.x, Spring Security, Spring Data JPA.
- Persistencia: PostgreSQL.
- Migraciones: Flyway.
- Mensajería: adaptador para WhatsApp Cloud API y webhooks.
- Exportaciones: PDF y Excel en una fase posterior.
- Infraestructura: despliegue económico, pero nunca sacrificar controles críticos de seguridad para cumplir el presupuesto.

## Reglas de ingeniería
- Separar dominio, aplicación, infraestructura y presentación.
- Usar UUID como identificadores internos.
- Usar `Instant`/UTC para persistencia; presentar fechas en `America/Bogota`.
- Validar entradas en backend, aunque el frontend también valide.
- No guardar tokens de respuesta en texto plano: almacenar hashes con algoritmo criptográfico seguro.
- Los tokens de respuesta deben ser aleatorios, de un solo uso, con expiración y revocación.
- Las operaciones administrativas deben requerir autenticación y autorización.
- Los webhooks deben validar la autenticidad de la solicitud según el mecanismo oficial de Meta.
- Las operaciones externas deben ser idempotentes cuando sea posible.
- Registrar fallos de entrega y permitir reintentos controlados sin duplicar autorizaciones.
- Mantener pruebas unitarias, integración y pruebas de aceptación trazables a los criterios de la spec.

## Política de auditoría
- Registrar creación de actividad, emisión de solicitud, entrega/fallo de WhatsApp, respuesta del acudiente, expiración, revocación y acciones administrativas.
- La bitácora es append-only desde la aplicación.
- Encadenar hashes de eventos y restringir UPDATE/DELETE en la tabla de auditoría.
- No describir una cadena de hashes dentro de una misma base de datos como inmutabilidad absoluta. Para mayor garantía, anclar periódicamente hashes fuera de la base de datos y mantener backups independientes.
- No incluir contenido sensible innecesario en `event_data`.

## UX y accesibilidad
- Mobile-first; formularios sencillos y legibles.
- Lenguaje claro, respetuoso y no técnico para familias.
- Estados inequívocos: pendiente, autorizado, no autorizado, vencido, revocado y error de entrega.
- Confirmar la decisión antes de enviarla y mostrar comprobante después.
- Accesibilidad WCAG 2.2 AA como objetivo: foco visible, etiquetas, contraste, navegación por teclado y mensajes de error comprensibles.
- No usar color como único indicador de estado.

## Privacidad y cumplimiento
- Considerar Ley 1581 de 2012, Decreto 1074 de 2015 y criterios vigentes de la SIC para datos de menores.
- Definir responsable/encargado, finalidades, base de legitimación, avisos y autorizaciones con asesoría legal de la institución.
- Tratar datos de salud como sensibles; recolectar solo lo estrictamente necesario y con autorización específica cuando corresponda.
- Definir retención, eliminación, atención de derechos de titulares y respuesta a incidentes.
- No habilitar producción hasta completar evaluación de privacidad y seguridad.

## Forma de trabajo SDD
1. Leer `AGENTS.md`, la spec activa y las skills relevantes antes de implementar.
2. Si hay contradicción, señalarla; no inventar requisitos.
3. Si un criterio de aceptación no se puede verificar, proponer una mejora de la spec antes de modificar prompts o código.
4. Implementar el alcance mínimo que satisfaga todos los criterios.
5. Añadir pruebas que demuestren cada criterio.
6. Documentar decisiones, supuestos, limitaciones y variables de entorno.
7. No afirmar que una integración real funciona sin credenciales y pruebas con el entorno oficial.

## Definition of Done
- Todos los criterios de aceptación tienen evidencia de prueba.
- Migraciones y configuración están documentadas.
- No hay secretos en el repositorio.
- Logs no revelan datos personales o tokens.
- Se documentaron límites y tareas pendientes para producción.
