package com.aimestart.yugiohsearch;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
public class AuthAccountService {

    private final JdbcTemplate jdbcTemplate;

    public AuthAccountService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean isEmailAvailable(String email) {
        Boolean emailExists = jdbcTemplate.queryForObject(
                "select exists(select 1 from neon_auth.\"user\" where lower(email) = ?)",
                Boolean.class,
                email.trim().toLowerCase(Locale.ROOT));
        return !Boolean.TRUE.equals(emailExists);
    }
}
