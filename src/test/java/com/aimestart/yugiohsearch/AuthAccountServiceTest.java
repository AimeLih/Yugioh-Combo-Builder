package com.aimestart.yugiohsearch;

import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AuthAccountServiceTest {

    private final JdbcTemplate jdbcTemplate = mock(JdbcTemplate.class);
    private final AuthAccountService service = new AuthAccountService(jdbcTemplate);

    @Test
    void reportsExistingEmailAsUnavailableCaseInsensitively() {
        String sql = "select exists(select 1 from neon_auth.\"user\" where lower(email) = ?)";
        when(jdbcTemplate.queryForObject(sql, Boolean.class, "duelist@example.com"))
                .thenReturn(true);

        assertFalse(service.isEmailAvailable("  Duelist@Example.com "));
        verify(jdbcTemplate).queryForObject(sql, Boolean.class, "duelist@example.com");
    }

    @Test
    void reportsNewEmailAsAvailable() {
        String sql = "select exists(select 1 from neon_auth.\"user\" where lower(email) = ?)";
        when(jdbcTemplate.queryForObject(sql, Boolean.class, "new@example.com"))
                .thenReturn(false);

        assertTrue(service.isEmailAvailable("new@example.com"));
    }
}
