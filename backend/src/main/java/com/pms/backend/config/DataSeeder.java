package com.pms.backend.config;

import com.pms.backend.entity.Role;
import com.pms.backend.entity.User;
import com.pms.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${ADMIN_EMAIL}")
    private String adminEmail;

    @Value("${ADMIN_PASSWORD}")
    private String adminPassword;

    @Value("${ADMIN_PASSWORD_UPDATE:false}")
    private boolean adminPasswordUpdate;

    @Override
    public void run(String... args) {

        var existingAdmin = userRepository.findByEmail(adminEmail);

        if (existingAdmin.isEmpty()) {

            User admin = new User();
            admin.setFullName("System Admin");
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            admin.setPreferredLanguage("en");
            admin.setEnabled(true);

            userRepository.save(admin);

            System.out.println("Default admin account created successfully.");

        } else if (adminPasswordUpdate) {

            User admin = existingAdmin.get();
            admin.setPassword(passwordEncoder.encode(adminPassword));
            userRepository.save(admin);

            System.out.println("Admin password updated successfully.");
        }
    }
}