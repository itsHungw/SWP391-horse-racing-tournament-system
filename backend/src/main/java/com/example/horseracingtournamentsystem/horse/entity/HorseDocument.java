package com.example.horseracingtournamentsystem.horse.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "horse_documents")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HorseDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "horse_id", nullable = false)
    private Horse horse;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    @Column(name = "document_type", nullable = false, length = 50)
    private String documentType;

    @Column(name = "reference_number", nullable = false, length = 100)
    private String referenceNumber;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "expiry_date", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "issuer", nullable = false, length = 150)
    private String issuer;

    @Column(name = "file_url", nullable = false, length = 500)
    private String fileUrl;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public static HorseDocument create(
            Horse horse,
            User uploadedBy,
            String documentType,
            String referenceNumber,
            LocalDate issueDate,
            LocalDate expiryDate,
            String issuer,
            String fileUrl,
            String notes
    ) {
        HorseDocument document = new HorseDocument();
        document.horse = horse;
        document.uploadedBy = uploadedBy;
        document.documentType = documentType;
        document.referenceNumber = referenceNumber;
        document.issueDate = issueDate;
        document.expiryDate = expiryDate;
        document.issuer = issuer;
        document.fileUrl = fileUrl;
        document.notes = notes;
        document.createdAt = LocalDateTime.now();
        return document;
    }
}
