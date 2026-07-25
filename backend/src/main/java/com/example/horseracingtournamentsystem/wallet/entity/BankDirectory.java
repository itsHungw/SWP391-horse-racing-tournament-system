package com.example.horseracingtournamentsystem.wallet.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bank_directory")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BankDirectory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    @Column(nullable = false, unique = true, length = 12)
    private String bin;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "qr_supported", nullable = false)
    private boolean qrSupported;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "directory_version", nullable = false)
    private int directoryVersion;
}
