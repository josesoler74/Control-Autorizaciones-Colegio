package co.school.access.infrastructure;

import co.school.access.application.WhatsAppGateway;
import java.util.UUID;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "whatsapp.mode", havingValue = "mock", matchIfMissing = true)
public class MockWhatsAppGateway implements WhatsAppGateway {
    @Override
    public SendResult sendAuthorizationLink(String phoneE164, String guardianName,
                                            String activityTitle, String secureUrl) {
        // No real message is sent. Never log the full URL or token.
        return new SendResult(true, "mock-" + UUID.randomUUID(), null);
    }
}
