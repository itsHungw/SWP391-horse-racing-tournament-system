package com.example.horseracingtournamentsystem.point.service;

import com.example.horseracingtournamentsystem.point.dto.PointSettingResponse;
import com.example.horseracingtournamentsystem.point.dto.UpdatePointSettingsRequest;
import com.example.horseracingtournamentsystem.point.entity.PointSetting;
import com.example.horseracingtournamentsystem.point.entity.PointSettingKey;
import com.example.horseracingtournamentsystem.point.repository.PointSettingRepository;
import com.example.horseracingtournamentsystem.user.entity.User;
import com.example.horseracingtournamentsystem.user.repository.UserRepository;
import java.util.EnumMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PointSettingsService {

    private final PointSettingRepository pointSettingRepository;
    private final UserRepository userRepository;

    @Transactional
    public PointSettingResponse getSettings() {
        return toResponse(readAllValues());
    }

    @Transactional
    public PointSettingResponse updateSettings(UpdatePointSettingsRequest request, String adminEmail) {
        User updatedBy = userRepository.findByEmail(adminEmail).orElse(null);

        update(PointSettingKey.FIRST_LOGIN_BONUS, request.FIRST_LOGIN_BONUS(), updatedBy);
        update(PointSettingKey.BLOG_REWARD_POINTS, request.BLOG_REWARD_POINTS(), updatedBy);
        update(PointSettingKey.DAILY_BLOG_REWARD_LIMIT, request.DAILY_BLOG_REWARD_LIMIT(), updatedBy);
        update(PointSettingKey.PREDICTION_WINNER_ENTRY_COST, request.PREDICTION_WINNER_ENTRY_COST(), updatedBy);
        update(PointSettingKey.PREDICTION_TOP3_ENTRY_COST, request.PREDICTION_TOP3_ENTRY_COST(), updatedBy);
        update(PointSettingKey.PREDICTION_WINNER_REWARD, request.PREDICTION_WINNER_REWARD(), updatedBy);
        update(PointSettingKey.PREDICTION_TOP3_EXACT_REWARD, request.PREDICTION_TOP3_EXACT_REWARD(), updatedBy);
        update(PointSettingKey.PREDICTION_TOP3_ANY_ORDER_REWARD, request.PREDICTION_TOP3_ANY_ORDER_REWARD(), updatedBy);

        return toResponse(readAllValues());
    }

    @Transactional(readOnly = true)
    public int getInt(PointSettingKey key) {
        return pointSettingRepository.findById(key)
                .map(PointSetting::getValue)
                .orElse(0);
    }

    private Map<PointSettingKey, Integer> readAllValues() {
        Map<PointSettingKey, Integer> values = new EnumMap<>(PointSettingKey.class);
        for (PointSettingKey key : PointSettingKey.values()) {
            PointSetting setting = ensureSetting(key);
            values.put(key, setting.getValue());
        }
        return values;
    }

    private PointSetting ensureSetting(PointSettingKey key) {
        return pointSettingRepository.findById(key)
                .orElseGet(() -> pointSettingRepository.save(
                        PointSetting.defaultSetting(key, defaultDescription(key))
                ));
    }

    private void update(PointSettingKey key, int value, User updatedBy) {
        PointSetting setting = ensureSetting(key);
        setting.updateValue(value, updatedBy);
        pointSettingRepository.save(setting);
    }

    private PointSettingResponse toResponse(Map<PointSettingKey, Integer> values) {
        return new PointSettingResponse(
                values.get(PointSettingKey.FIRST_LOGIN_BONUS),
                values.get(PointSettingKey.BLOG_REWARD_POINTS),
                values.get(PointSettingKey.DAILY_BLOG_REWARD_LIMIT),
                values.get(PointSettingKey.PREDICTION_WINNER_ENTRY_COST),
                values.get(PointSettingKey.PREDICTION_TOP3_ENTRY_COST),
                values.get(PointSettingKey.PREDICTION_WINNER_REWARD),
                values.get(PointSettingKey.PREDICTION_TOP3_EXACT_REWARD),
                values.get(PointSettingKey.PREDICTION_TOP3_ANY_ORDER_REWARD)
        );
    }

    private String defaultDescription(PointSettingKey key) {
        return switch (key) {
            case FIRST_LOGIN_BONUS -> "Points granted on first successful login when enabled.";
            case BLOG_REWARD_POINTS -> "Points awarded when an eligible blog reward is claimed.";
            case DAILY_BLOG_REWARD_LIMIT -> "Maximum blog reward points a user can earn per day.";
            case PREDICTION_WINNER_ENTRY_COST -> "Points spent to submit one Winner pick prediction.";
            case PREDICTION_TOP3_ENTRY_COST -> "Points spent to submit one Top 3 prediction.";
            case PREDICTION_WINNER_REWARD -> "Points awarded for a correct Winner pick prediction.";
            case PREDICTION_TOP3_EXACT_REWARD -> "Points awarded for matching the exact Top 3 order.";
            case PREDICTION_TOP3_ANY_ORDER_REWARD -> "Points awarded for predicting the Top 3 in any order.";
            default -> throw new IllegalArgumentException("Unknown PointSettingKey: " + key);
        };
    }
}
