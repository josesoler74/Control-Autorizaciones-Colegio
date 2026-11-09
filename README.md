# SDD — Control de autorizaciones y recogidas por WhatsApp

Este paquete contiene el contexto persistente, la especificación de un feature, una skill de marca y un scaffold de implementación para el feature prioritario: **Gestión de autorizaciones digitales por WhatsApp**.

## Estructura
- `AGENTS.md`: instrucciones generales para agentes.
- `specs/001-autorizaciones-digitales-whatsapp/spec.md`: spec con problema, diseño y cinco criterios verificables.
- `.agents/skills/brand-design/SKILL.md`: skill de diseño de marca.
- `implementation/`: scaffold de backend Spring Boot, migración PostgreSQL y componente Angular.
- `docs/acceptance-matrix.md`: trazabilidad de criterios y pruebas.
- `docker-compose.yml`: PostgreSQL local para desarrollo.

## Decisiones
- Angular 20 standalone + PWA.
- Java 21 + Spring Boot 3.x.
- PostgreSQL.
- WhatsApp Cloud API oficial mediante adaptador.
- Monolito modular; no microservicios para el tamaño inicial.
- El feature implementado en este scaffold cubre creación de actividad/solicitudes y respuesta segura por enlace. La integración real con Meta requiere credenciales, número institucional, plantillas aprobadas y configuración de webhook.

## Estado honesto de implementación
Este es un scaffold de referencia para iniciar el desarrollo, no un sistema listo para producción. No incluye un mecanismo completo de identidad administrativa, onboarding/verificación legal de acudientes, despliegue, monitoreo, backups administrados ni certificación de seguridad. El adaptador de WhatsApp incluye contrato y simulador; no debe afirmarse que envía mensajes reales hasta conectar y probar una cuenta de Meta.

## Ejecución local de PostgreSQL
```bash
docker compose up -d postgres
```

Variables mínimas:
```bash
DB_URL=jdbc:postgresql://localhost:5432/school_access
DB_USERNAME=school
DB_PASSWORD=change-me
APP_PUBLIC_BASE_URL=http://localhost:4200
WHATSAPP_MODE=mock
```

## Próximos pasos técnicos
1. Crear proyecto Spring Boot 3.x con Java 21 e incluir Web, Validation, Data JPA, Security, PostgreSQL y Flyway.
2. Copiar `implementation/backend/` al proyecto y ajustar paquetes.
3. Ejecutar migración Flyway.
4. Integrar el componente Angular en la aplicación existente y adaptar rutas/servicios.
5. Añadir autenticación administrativa real y segundo factor/OTP del acudiente conforme al análisis de riesgo.
6. Implementar el adaptador Meta Cloud API y webhook verificado.
7. Ejecutar las pruebas de `docs/acceptance-matrix.md`.
8. Completar evaluación de privacidad, seguridad y operación antes de producción.
