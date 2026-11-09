package co.school.access.api;

import co.school.access.domain.Decision;
import jakarta.validation.constraints.NotNull;

public record ResponseRequest(@NotNull Decision decision,
                              @NotNull Boolean confirmed) {}
