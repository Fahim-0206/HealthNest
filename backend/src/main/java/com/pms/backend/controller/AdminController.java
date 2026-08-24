package com.pms.backend.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.pms.backend.dto.*;
import com.pms.backend.service.AdminService;
import com.pms.backend.service.DoctorProfileService;
import com.pms.backend.service.LabService;
import com.pms.backend.service.PatientService;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final PatientService patientService;
    private final DoctorProfileService doctorProfileService;
    private final LabService labService;

    @GetMapping("/users")
    public ResponseEntity<List<UserSummaryResponse>> getUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @PutMapping("/users/{id}/toggle")
    public ResponseEntity<UserSummaryResponse> toggleUser(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.toggleUserEnabled(id));
    }

    @GetMapping("/dashboard-stats")
    public ResponseEntity<DashboardStatsResponse> dashboardStats() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    @GetMapping("/patients/pending")
    public ResponseEntity<List<PatientProfileResponse>> pendingPatients() {
        return ResponseEntity.ok(patientService.getPendingPatients());
    }

    @PutMapping("/patients/{id}/verify")
    public ResponseEntity<PatientProfileResponse> verifyPatient(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(patientService.verifyPatient(id, status));
    }

    @PostMapping("/doctors")
    public ResponseEntity<CreateDoctorResponse> addDoctor(@Valid @RequestBody CreateDoctorRequest request) {
        return ResponseEntity.ok(doctorProfileService.createDoctor(request));
    }

    @PostMapping("/doctors/{userId}/reset-password")
    public ResponseEntity<CreateDoctorResponse> resetDoctorPassword(@PathVariable Long userId) {
        return ResponseEntity.ok(doctorProfileService.resetPassword(userId));
    }

    @PostMapping("/lab-technicians")
    public ResponseEntity<CreateDoctorResponse> addLabTechnician(@Valid @RequestBody CreateDoctorRequest request) {
        return ResponseEntity.ok(labService.createLabTechnician(request));
    }

    @GetMapping("/lab-technicians")
    public ResponseEntity<List<LabProfileResponse>> getLabTechnicians() {
        return ResponseEntity.ok(labService.getAllLabTechnicianProfiles());
    }

    @PostMapping("/lab-technicians/{userId}/reset-password")
    public ResponseEntity<CreateDoctorResponse> resetLabPassword(@PathVariable Long userId) {
        return ResponseEntity.ok(labService.resetPassword(userId));
    }
}