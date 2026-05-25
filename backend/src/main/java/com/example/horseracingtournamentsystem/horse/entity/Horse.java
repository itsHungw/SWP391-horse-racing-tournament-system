package com.example.horseracingtournamentsystem.horse.entity;

import com.example.horseracingtournamentsystem.user.entity.User;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "horses")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Horse {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @Column(name = "name", nullable = false, length = 150)
    private String name;

    @Column(name = "registration_code", length = 100, unique = true)
    private String registrationCode;

    @Column(name = "breed", length = 100)
    private String breed;

    @Column(name = "gender", nullable = false, length = 20)
    private String gender; // MALE / FEMALE

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "color", length = 50)
    private String color;

    @Column(name = "status", nullable = false, length = 30)
    private String status; // PENDING / APPROVED / REJECTED / INACTIVE / SUSPENDED

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public static Horse create(User owner, String name, String registrationCode, String breed, 
                               String gender, LocalDate dateOfBirth, String color) {
        Horse horse = new Horse();
        horse.owner = owner;
        horse.name = name;
        horse.registrationCode = registrationCode;
        horse.breed = breed;
        horse.gender = gender;
        horse.dateOfBirth = dateOfBirth;
        horse.color = color;
        horse.status = "APPROVED"; // Default as APPROVED (ACTIVE) for direct admin actions
        horse.createdAt = LocalDateTime.now();
        return horse;
    }

    public void update(String name, String breed, String gender, LocalDate dateOfBirth, String color) {
        this.name = name;
        this.breed = breed;
        this.gender = gender;
        this.dateOfBirth = dateOfBirth;
        this.color = color;
        this.updatedAt = LocalDateTime.now();
    }

    public void setInactive() {
        this.status = "INACTIVE";
        this.updatedAt = LocalDateTime.now();
    }

    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }
}
