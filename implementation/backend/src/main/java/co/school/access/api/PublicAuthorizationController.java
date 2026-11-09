package co.school.access.api;

import co.school.access.application.AuthorizationResponseService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/authorizations")
public class PublicAuthorizationController {
    private final AuthorizationResponseService service;

    public PublicAuthorizationController(AuthorizationResponseService service) {
        this.service = service;
    }

    @GetMapping("/{token}")
    public ResponseEntity<?> view(@PathVariable String token) {
        return ResponseEntity.ok(service.getPublicView(token));
    }

    @PostMapping("/{token}/response")
    public ResponseEntity<?> respond(@PathVariable String token,
                                     @Valid @RequestBody ResponseRequest request) {
        if (!Boolean.TRUE.equals(request.confirmed())) {
            return ResponseEntity.badRequest().body("Debe confirmar la decisión.");
        }
        service.recordResponse(token, request.decision());
        return ResponseEntity.noContent().build();
    }
}
