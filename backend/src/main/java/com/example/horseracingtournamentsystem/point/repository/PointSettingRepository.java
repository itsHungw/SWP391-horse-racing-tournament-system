package com.example.horseracingtournamentsystem.point.repository;

import com.example.horseracingtournamentsystem.point.entity.PointSetting;
import com.example.horseracingtournamentsystem.point.entity.PointSettingKey;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PointSettingRepository extends JpaRepository<PointSetting, PointSettingKey> {
}
