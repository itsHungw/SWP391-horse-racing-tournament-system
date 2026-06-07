package com.example.horseracingtournamentsystem.point.service;

import com.example.horseracingtournamentsystem.point.entity.PointSettingKey;
import com.example.horseracingtournamentsystem.point.entity.PointTransactionType;
import com.example.horseracingtournamentsystem.point.repository.PointTransactionRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class FirstLoginBonusService {

    private final PointSettingsService pointSettingsService;
    private final PointAccountService pointAccountService;
    private final PointTransactionRepository pointTransactionRepository;

    @Transactional
    public void awardIfEligible(User user) {
        int bonus = pointSettingsService.getInt(PointSettingKey.FIRST_LOGIN_BONUS);
        if (bonus <= 0) {
            return;
        }

        boolean alreadyAwarded = pointTransactionRepository.existsByUserIdAndTransactionType(
                user.getId(),
                PointTransactionType.FIRST_LOGIN_BONUS
        );
        if (alreadyAwarded) {
            return;
        }

        pointAccountService.credit(
                user,
                bonus,
                PointTransactionType.FIRST_LOGIN_BONUS,
                null,
                null,
                "First login bonus awarded on first successful login."
        );
    }
}
