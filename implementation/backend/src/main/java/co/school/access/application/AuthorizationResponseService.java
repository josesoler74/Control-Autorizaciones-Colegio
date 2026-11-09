package co.school.access.application;

import co.school.access.domain.Decision;
import org.springframework.stereotype.Service;

/**
 * Punto de extensión del caso de uso.
 * Conectar aquí repositorios JPA y transacción serializable/optimistic locking.
 * El endpoint no debe exponerse en producción hasta completar autenticación
 * adicional del acudiente, rate limiting y las validaciones descritas en SPEC-001.
 */
@Service
public class AuthorizationResponseService {
    private final TokenService tokenService;

    public AuthorizationResponseService(TokenService tokenService) {
        this.tokenService = tokenService;
    }

    public Object getPublicView(String rawToken) {
        // TODO: buscar SHA-256(token), validar estado/expiración/vínculo verificado,
        // devolver solo nombre minimizado, actividad, fecha, texto y versión.
        tokenService.sha256(rawToken); // evita persistir o registrar token en claro
        throw new UnsupportedOperationException("Conectar repositorio y validaciones de SPEC-001");
    }

    public void recordResponse(String rawToken, Decision decision) {
        // TODO: en una transacción, bloquear request, validar token y vigencia,
        // insertar respuesta única, consumir token y anexar evento de auditoría.
        tokenService.sha256(rawToken);
        throw new UnsupportedOperationException("Conectar repositorio y validaciones de SPEC-001");
    }
}
