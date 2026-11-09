package co.school.access.domain;

public enum AuthorizationStatus {
    PENDING, SENT, DELIVERED, AUTHORIZED, NOT_AUTHORIZED,
    EXPIRED, REVOKED, DELIVERY_FAILED
}
