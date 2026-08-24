package com.pms.backend.repository;

import com.pms.backend.entity.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository<Patient, Long> {
    Optional<Patient> findByHealthId(String healthId);
    Optional<Patient> findByUserId(Long userId);
    boolean existsByHealthId(String healthId);
    List<Patient> findByVerificationStatus(String status);
    List<Patient> findByUser_FullNameContainingIgnoreCase(String name);
}