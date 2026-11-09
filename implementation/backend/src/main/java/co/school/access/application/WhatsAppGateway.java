package co.school.access.application;

public interface WhatsAppGateway {
    SendResult sendAuthorizationLink(String phoneE164, String guardianName,
                                     String activityTitle, String secureUrl);

    record SendResult(boolean accepted, String providerMessageId, String errorCode) {}
}
