package com.pms.backend.controller;

import com.pms.backend.dto.*;
import com.pms.backend.security.CustomUserDetails;
import com.pms.backend.service.PatientService;
import com.pms.backend.service.PrescriptionService;
import com.pms.backend.service.QrCodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patient")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;
    private final QrCodeService qrCodeService;
    private final PrescriptionService prescriptionService;

    @GetMapping("/me")
    public ResponseEntity<PatientProfileResponse> getMyProfile(@AuthenticationPrincipal CustomUserDetails principal) {
        return ResponseEntity.ok(patientService.getProfileByUserId(principal.getUser().getId()));
    }

    @PutMapping("/me")
    public ResponseEntity<PatientProfileResponse> updateMyProfile(
            @AuthenticationPrincipal CustomUserDetails principal,
            @RequestBody PatientUpdateRequest request) {
        return ResponseEntity.ok(patientService.updateProfile(principal.getUser().getId(), request));
    }

    @GetMapping(value = "/me/qrcode", produces = MediaType.IMAGE_PNG_VALUE)
    public ResponseEntity<byte[]> getMyQrCode(@AuthenticationPrincipal CustomUserDetails principal) throws Exception {
        PatientProfileResponse profile = patientService.getProfileByUserId(principal.getUser().getId());
        byte[] qrImage = qrCodeService.generateQrCodePng(profile.getHealthId(), 300);
        return ResponseEntity.ok(qrImage);
    }

    @GetMapping("/lookup/{healthId}")
    public ResponseEntity<PatientProfileResponse> lookupByHealthId(@PathVariable String healthId) {
        return ResponseEntity.ok(patientService.getProfileByHealthId(healthId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<PatientProfileResponse>> search(@RequestParam String name) {
        return ResponseEntity.ok(patientService.searchByName(name));
    }

    @GetMapping("/me/prescriptions")
    public ResponseEntity<List<PrescriptionResponse>> myPrescriptions(@AuthenticationPrincipal CustomUserDetails principal) {
        String healthId = patientService.getProfileByUserId(principal.getUser().getId()).getHealthId();
        return ResponseEntity.ok(prescriptionService.getByHealthId(healthId));
    }

    @PostMapping("/complete-profile")
    public ResponseEntity<PatientProfileResponse> completeProfile(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody CompletePatientProfileRequest request) {
        return ResponseEntity.ok(patientService.completeProfile(principal.getUser().getId(), request));
    }
}