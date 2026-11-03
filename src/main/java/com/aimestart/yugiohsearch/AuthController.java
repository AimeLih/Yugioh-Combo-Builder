package com.aimestart.yugiohsearch;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/yugioh/auth")
@CrossOrigin(originPatterns = {"http://localhost:5173", "https://yugioh-combo.vercel.app"})
public class AuthController {

    private final AuthAccountService authAccountService;

    public AuthController(AuthAccountService authAccountService) {
        this.authAccountService = authAccountService;
    }

    @GetMapping("/email-availability")
    public EmailAvailability emailAvailability(@RequestParam String email) {
        return new EmailAvailability(authAccountService.isEmailAvailable(email));
    }

    public record EmailAvailability(boolean available) {
    }
}
