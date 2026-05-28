package com.example.horseracingtournamentsystem.common.upload;

import java.nio.file.Path;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "app.upload")
public class UploadProperties {
    private Path root = Path.of("uploads");
    private long horseImageMaxBytes = 5 * 1024 * 1024;
    private long horseEvidenceMaxBytes = 10 * 1024 * 1024;
}
