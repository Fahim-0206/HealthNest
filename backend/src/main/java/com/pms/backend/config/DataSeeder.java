package com.pms.backend.config;

import com.pms.backend.entity.Role;
import com.pms.backend.entity.User;
import com.pms.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "admin@gmail.com";
    private static final String ADMIN_PASSWORD = "123456";

    @Override
    public void run(String... args) {
        if (!userRepository.existsByEmail(ADMIN_EMAIL)) {
            User admin = new User();
            admin.setFullName("System Admin");
            admin.setEmail(ADMIN_EMAIL);
            admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
            admin.setRole(Role.ADMIN);
            admin.setPreferredLanguage("en");
            admin.setEnabled(true);
            userRepository.save(admin);
            System.out.println("=================================================");
            System.out.println("Default admin account created:");
            System.out.println("Email: " + ADMIN_EMAIL);
            System.out.println("Password: " + ADMIN_PASSWORD);
            System.out.println("=================================================");
        }
    }
}