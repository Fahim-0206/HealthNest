package com.pms.backend.service;

import com.pms.backend.dto.*;
import com.pms.backend.entity.LabProfile;
import com.pms.backend.entity.Role;
import com.pms.backend.entity.User;
import com.pms.backend.repository.LabProfileRepository;
import com.pms.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LabService {

    private final UserRepository userRepository;
    private final LabProfileRepository labProfileRepository;
    private final PasswordEncoder passwordEncoder;

    public CreateDoctorResponse createLabTechnician(CreateDoctorRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        String tempPassword = "Lab" + UUID.randomUUID().toString().substring(0, 8);

        User user = new User();
        user.setFullName(req.getFullName());
        user.setEmail(req.getEmail());
        user.setPassword(passwordEncoder.encode(tempPassword));
        user.setRole(Role.LAB);
        user.setPreferredLanguage("en");
        user.setEnabled(true);
        user.setAuthProvider("LOCAL");

        User savedUser = userRepository.save(user);

        LabProfile profile = new LabProfile();
        profile.setUser(savedUser);
        profile.setProfileCompleted(false);
        labProfileRepository.save(profile);

        return new CreateDoctorResponse(savedUser.getId(), savedUser.getEmail(), tempPassword);
    }

    public CreateDoctorResponse resetPassword(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Lab technician not found"));
        String tempPassword = "Lab" + UUID.randomUUID().toString().substring(0, 8);
        user.setPassword(passwordEncoder.encode(tempPassword));
        userRepository.save(user);
        return new CreateDoctorResponse(user.getId(), user.getEmail(), tempPassword);
    }

    public List<LabProfileResponse> getAllLabTechnicianProfiles() {
        return userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.LAB)
                .map(u -> {
                    LabProfile p = labProfileRepository.findByUserId(u.getId()).orElse(null);
                    return new LabProfileResponse(
                            u.getId(), u.getFullName(), u.getEmail(),
                            p != null ? p.getPhone() : null,
                            p != null ? p.getLocation() : null,
                            p != null && p.isProfileCompleted()
                    );
                })
                .toList();
    }

    public LabProfileResponse getMyProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        LabProfile profile = labProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Lab profile not found"));
        return toResponse(user, profile);
    }

    public LabProfileResponse completeProfile(Long userId, CompleteLabProfileRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        LabProfile profile = labProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Lab profile not found"));

        profile.setPhone(req.getPhone());
        profile.setLocation(req.getLocation());
        profile.setProfileCompleted(true);

        LabProfile saved = labProfileRepository.save(profile);
        return toResponse(user, saved);
    }

    private LabProfileResponse toResponse(User user, LabProfile profile) {
        return new LabProfileResponse(
                user.getId(), user.getFullName(), user.getEmail(),
                profile.getPhone(), profile.getLocation(), profile.isProfileCompleted()
        );
    }
}