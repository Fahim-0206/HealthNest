package com.pms.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import com.pms.backend.dto.CompletePatientProfileRequest;
import com.pms.backend.dto.PatientProfileResponse;
import com.pms.backend.dto.PatientUpdateRequest;
import com.pms.backend.entity.Patient;
import com.pms.backend.entity.User;
import com.pms.backend.repository.PatientRepository;
import com.pms.backend.repository.UserRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public PatientProfileResponse getProfileByUserId(Long userId) {
        Patient p = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Patient profile not found"));
        return toResponse(p);
    }

    public PatientProfileResponse getProfileByHealthId(String healthId) {
        Patient p = patientRepository.findByHealthId(healthId)
                .orElseThrow(() -> new IllegalArgumentException("No patient found with this Health ID"));
        return toResponse(p);
    }

    public PatientProfileResponse updateProfile(Long userId, PatientUpdateRequest req) {
        Patient p = patientRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Patient profile not found"));

        if (req.getPhone() != null) p.setPhone(req.getPhone());
        if (req.getLocation() != null) p.setLocation(req.getLocation());
        if (req.getBloodGroup() != null) p.setBloodGroup(req.getBloodGroup());

        return toResponse(patientRepository.save(p));
    }

    public PatientProfileResponse completeProfile(Long userId, CompletePatientProfileRequest req) {
        if (patientRepository.findByUserId(userId).isPresent()) {
            throw new IllegalArgumentException("Profile already completed");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Patient patient = new Patient();
        patient.setUser(user);
        patient.setHealthId(generateHealthId(req.getLocation()));
        patient.setDateOfBirth(LocalDate.parse(req.getDateOfBirth()));
        patient.setPhone(req.getPhone());
        patient.setLocation(req.getLocation());
        patient.setBloodGroup(req.getBloodGroup());
        patient.setVerificationStatus("PENDING");

        return toResponse(patientRepository.save(patient));
    }

    public List<PatientProfileResponse> getPendingPatients() {
        return patientRepository.findByVerificationStatus("PENDING").stream()
                .map(this::toResponse).toList();
    }

    public PatientProfileResponse verifyPatient(Long patientId, String status) {
        Patient p = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found"));
        p.setVerificationStatus(status.toUpperCase());
        Patient saved = patientRepository.save(p);

        notificationService.notify(saved.getUser(),
                "Your registration has been " + status.toLowerCase() + " by an administrator.");

        return toResponse(saved);
    }

    private String generateHealthId(String location) {
        String code = (location != null && location.length() >= 3) ? location.substring(0, 3).toUpperCase() : "GEN";
        String unique = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        return "HN-" + code + "-" + unique;
    }

    private PatientProfileResponse toResponse(Patient p) {
        return new PatientProfileResponse(
                p.getId(), p.getHealthId(), p.getUser().getFullName(), p.getUser().getEmail(),
                p.getDateOfBirth().toString(), p.getPhone(), p.getLocation(), p.getBloodGroup(),
                p.getVerificationStatus()
        );
    }
    public List<PatientProfileResponse> searchByName(String name) {
        return patientRepository.findByUser_FullNameContainingIgnoreCase(name).stream()
                .map(this::toResponse).toList();
    }
}