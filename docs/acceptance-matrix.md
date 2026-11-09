# Matriz de trazabilidad — SPEC-001

| Criterio | Componente | Prueba requerida | Evidencia |
|---|---|---|---|
| CA-01 Crear y emitir solicitudes | ActivityController, AuthorizationService, repositorios | Una solicitud por estudiante/acudiente elegible; unicidad; token persistido como hash; eventos | Test de integración + consulta DB |
| CA-02 WhatsApp institucional | WhatsAppGateway, NotificationService | Simular envío, registrar provider ID, error y reintento idempotente | Test de contrato; E2E con Meta pendiente |
| CA-03 Respuesta segura | PublicAuthorizationController, ResponseService | Autorizar/no autorizar; token de un uso; concurrencia; timestamp y versión | Test de integración |
| CA-04 Bloqueo de inválidos | TokenService, ResponseService | Token inválido, expirado, revocado, usado y acudiente no verificado | Tests negativos + revisión de respuesta HTTP |
| CA-05 Consulta y auditoría | DashboardController, AuditEventRepository | Permisos por rol; estados agregados; rechazo UPDATE/DELETE | Tests de seguridad y DB |

## Brechas antes de producción
- Autenticación y autorización administrativa completas.
- Verificación de identidad y vínculo legal de acudientes.
- Segundo factor para respuestas según evaluación de riesgo.
- Verificación criptográfica del webhook de Meta.
- Backups independientes y restauración probada.
- Rate limiting, monitoreo, alertas y gestión de incidentes.
- Revisión legal del consentimiento y retención de datos.
- Pruebas de carga y seguridad.
