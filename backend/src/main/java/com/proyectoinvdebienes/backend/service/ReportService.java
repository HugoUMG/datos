package com.proyectoinvdebienes.backend.service;

import com.proyectoinvdebienes.backend.domain.enums.AssetStatus;
import com.proyectoinvdebienes.backend.domain.enums.DisposalStatus;
import com.proyectoinvdebienes.backend.domain.model.Asset;
import com.proyectoinvdebienes.backend.domain.model.Assignment;
import com.proyectoinvdebienes.backend.domain.model.Disposal;
import com.proyectoinvdebienes.backend.repository.AssetRepository;
import com.proyectoinvdebienes.backend.repository.AssignmentRepository;
import com.proyectoinvdebienes.backend.repository.DisposalRepository;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ReportService {

    private final AssetRepository assetRepository;
    private final AssignmentRepository assignmentRepository;
    private final DisposalRepository disposalRepository;

    public ReportService(
            AssetRepository assetRepository,
            AssignmentRepository assignmentRepository,
            DisposalRepository disposalRepository
    ) {
        this.assetRepository = assetRepository;
        this.assignmentRepository = assignmentRepository;
        this.disposalRepository = disposalRepository;
    }

    public BigDecimal totalInvestedAssets() {
        return assetRepository.findAll().stream()
                .map(Asset::getAcquisitionCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public List<Assignment> assignmentsByEmployee(Long employeeId) {
        return assignmentRepository.findByEmployeeId(employeeId);
    }

    public List<Asset> upcomingDisposals() {
        return assetRepository.findAll().stream()
                .filter(asset -> asset.getStatus() != AssetStatus.DADO_DE_BAJA)
                .toList();
    }

    public byte[] exportInvestedAssetsCsv() {
        StringBuilder csv = new StringBuilder("id,assetCode,name,assignedToEmployeeId,value,unitValue,acquisitionDate,status,disposalDate\n");
        Map<Long, LocalDate> disposalDates = disposalRepository.findAll().stream()
                .filter(d -> d.getStatus() == DisposalStatus.APROBADA)
                .collect(Collectors.toMap(d -> d.getAsset().getId(), Disposal::getApprovedAt, (left, right) -> right));

        for (Asset asset : assetRepository.findAll()) {
            String assignedTo = asset.getCurrentCustodian() != null ? String.valueOf(asset.getCurrentCustodian().getId()) : "desasignado";
            String disposalDate = disposalDates.get(asset.getId()) != null ? disposalDates.get(asset.getId()).toString() : "";
            csv.append(asset.getId()).append(',')
                    .append(asset.getAssetCode()).append(',')
                    .append(asset.getName()).append(',')
                    .append(assignedTo).append(',')
                    .append(asset.getAcquisitionCost()).append(',')
                    .append(asset.getAcquisitionCost()).append(',')
                    .append(asset.getAcquisitionDate()).append(',')
                    .append(asset.getStatus()).append(',')
                    .append(disposalDate)
                    .append('\n');
        }
        return csv.toString().getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportInvestedAssetsPdf() {
        List<String> lines = assetRepository.findAll().stream()
                .sorted(Comparator.comparing(Asset::getId))
                .map(asset -> {
                    String assignedTo = asset.getCurrentCustodian() != null ? String.valueOf(asset.getCurrentCustodian().getId()) : "desasignado";
                    return String.format(
                            "ID:%s | Código:%s | Nombre:%s | Asignado:%s | Valor:%s | Ingreso:%s | Estado:%s",
                            asset.getId(),
                            asset.getAssetCode(),
                            safe(asset.getName()),
                            assignedTo,
                            asset.getAcquisitionCost(),
                            asset.getAcquisitionDate(),
                            asset.getStatus()
                    );
                })
                .toList();
        return buildSimplePdf("Reporte general de bienes", lines);
    }

    public byte[] exportEmployeeAssetsPdf(Long employeeId) {
        List<Assignment> assignments = assignmentRepository.findByEmployeeId(employeeId);
        BigDecimal activeTotal = assignments.stream()
                .filter(a -> a.getStatus().name().equals("ACTIVA"))
                .map(a -> a.getAsset().getAcquisitionCost())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<String> lines = assignments.stream()
                .sorted(Comparator.comparing(Assignment::getAssignedAt).reversed())
                .map(a -> String.format(
                        "Código:%s | Nombre:%s | Valor:%s | Estado:%s | Asignado:%s | Devolución esperada:%s | Devolución real:%s",
                        a.getAsset().getAssetCode(),
                        safe(a.getAsset().getName()),
                        a.getAsset().getAcquisitionCost(),
                        a.getAsset().getStatus(),
                        a.getAssignedAt(),
                        a.getExpectedReturnAt() != null ? a.getExpectedReturnAt() : "-",
                        a.getReturnedAt() != null ? a.getReturnedAt() : "-"
                ))
                .toList();
        lines = new java.util.ArrayList<>(lines);
        lines.add(0, "Suma valor de bienes activos del usuario: " + activeTotal);
        return buildSimplePdf("Reporte de bienes por empleado ID " + employeeId, lines);
    }

    private byte[] buildSimplePdf(String title, List<String> lines) {
        StringBuilder content = new StringBuilder();
        content.append("BT\n/F1 11 Tf\n40 780 Td\n");
        content.append("(").append(escapePdfText(title)).append(") Tj\n");
        content.append("0 -20 Td\n/F1 9 Tf\n");

        int maxLines = 42;
        int counter = 0;
        for (String line : lines) {
            if (counter >= maxLines) break;
            content.append("(").append(escapePdfText(line)).append(") Tj\n0 -14 Td\n");
            counter++;
        }
        content.append("ET");

        String obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
        String obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
        String obj3 = "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n";
        String stream = content.toString();
        String obj4 = "4 0 obj\n<< /Length " + stream.length() + " >>\nstream\n" + stream + "\nendstream\nendobj\n";
        String obj5 = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";

        StringBuilder pdf = new StringBuilder("%PDF-1.4\n");
        int o1 = pdf.length();
        pdf.append(obj1);
        int o2 = pdf.length();
        pdf.append(obj2);
        int o3 = pdf.length();
        pdf.append(obj3);
        int o4 = pdf.length();
        pdf.append(obj4);
        int o5 = pdf.length();
        pdf.append(obj5);
        int xref = pdf.length();

        pdf.append("xref\n0 6\n");
        pdf.append("0000000000 65535 f \n");
        pdf.append(String.format("%010d 00000 n \n", o1));
        pdf.append(String.format("%010d 00000 n \n", o2));
        pdf.append(String.format("%010d 00000 n \n", o3));
        pdf.append(String.format("%010d 00000 n \n", o4));
        pdf.append(String.format("%010d 00000 n \n", o5));
        pdf.append("trailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n");
        pdf.append(xref).append("\n%%EOF");

        return pdf.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String escapePdfText(String text) {
        return text
                .replace("\\", "\\\\")
                .replace("(", "\\(")
                .replace(")", "\\)");
    }

    private String safe(String text) {
        return text == null ? "" : text.replace("|", "/");
    }
}
