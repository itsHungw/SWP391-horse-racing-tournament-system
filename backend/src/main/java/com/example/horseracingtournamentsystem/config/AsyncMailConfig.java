package com.example.horseracingtournamentsystem.config;

import java.util.concurrent.ThreadPoolExecutor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.SyncTaskExecutor;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

/**
 * Thread pool riêng cho việc gửi email (xem {@code AuthEmailDispatcher}).
 *
 * <p>Dùng pool riêng thay vì executor mặc định của Spring Boot là có chủ ý: SMTP là
 * thao tác chậm và hay hỏng, nếu dùng chung pool với các tác vụ nền khác thì một
 * mail server treo sẽ kéo theo mọi thứ khác chết chung.
 */
@Configuration
@EnableAsync
public class AsyncMailConfig {

    /**
     * Pool dùng khi chạy thật. Cố tình để nhỏ — gửi email không cần nhiều thread, và
     * pool nhỏ giúp lộ ra sớm nếu SMTP đang chậm bất thường.
     */
    @Bean("mailTaskExecutor")
    @ConditionalOnProperty(prefix = "app.mail", name = "async", havingValue = "true", matchIfMissing = true)
    public ThreadPoolTaskExecutor asyncMailTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("mail-");
        // Hàng đợi đầy nghĩa là SMTP đã hỏng kéo dài. Bỏ bớt email đi còn hơn ném
        // RejectedExecutionException ngược về thread request — user vẫn đăng ký được
        // và luôn có nút "gửi lại mã". (CallerRunsPolicy thì tuyệt đối không dùng:
        // nó đẩy chính việc gửi SMTP về thread request, tái tạo lại đúng bug treo.)
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.DiscardPolicy());
        // Khi redeploy, chờ các email đang gửi dở hoàn tất thay vì cắt ngang.
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(20);
        // Không gọi initialize() ở đây: Spring tự gọi afterPropertiesSet() vì
        // ThreadPoolTaskExecutor có implement InitializingBean. Gọi tay sẽ tạo thừa
        // một pool bị bỏ rơi.
        return executor;
    }

    /**
     * Bản đồng bộ dùng cho test ({@code app.mail.async: false}): chạy thẳng trên
     * thread gọi, để integration test assert được email ngay sau lời gọi HTTP mà
     * không phải sleep chờ thread nền.
     */
    @Bean("mailTaskExecutor")
    @ConditionalOnProperty(prefix = "app.mail", name = "async", havingValue = "false")
    public TaskExecutor synchronousMailTaskExecutor() {
        return new SyncTaskExecutor();
    }
}
