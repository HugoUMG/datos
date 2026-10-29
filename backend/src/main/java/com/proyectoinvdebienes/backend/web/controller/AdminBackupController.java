package com.proyectoinvdebienes.backend.web.controller;

import com.proyectoinvdebienes.backend.service.BackupService;
import java.time.LocalDate;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/backup")
public class AdminBackupController {

    private final BackupService backupService;

    public AdminBackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> download() {
        String filename = "respaldo-activos-" + LocalDate.now() + ".json";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .body(backupService.snapshot());
    }
}
