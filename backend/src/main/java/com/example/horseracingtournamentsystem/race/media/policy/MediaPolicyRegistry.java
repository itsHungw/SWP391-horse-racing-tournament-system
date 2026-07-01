package com.example.horseracingtournamentsystem.race.media.policy;

import com.example.horseracingtournamentsystem.race.media.enums.MediaType;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

/**
 * Gom mọi {@link MediaTypePolicy} bean thành map theo {@link MediaType}. Service tra policy qua đây
 * thay vì rẽ nhánh theo loại. Thêm policy mới = Spring tự nhặt vào list, không sửa registry/service.
 */
@Component
public class MediaPolicyRegistry {

    private final Map<MediaType, MediaTypePolicy> byType;

    public MediaPolicyRegistry(List<MediaTypePolicy> policies) {
        this.byType = policies.stream()
                .collect(Collectors.toUnmodifiableMap(MediaTypePolicy::type, Function.identity()));
    }

    public MediaTypePolicy policyFor(MediaType type) {
        MediaTypePolicy policy = byType.get(type);
        if (policy == null) {
            // Lỗi cấu hình lập trình: có MediaType chưa gắn policy.
            throw new IllegalStateException("Chưa cấu hình MediaTypePolicy cho loại: " + type);
        }
        return policy;
    }
}
