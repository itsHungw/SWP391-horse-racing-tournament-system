# syntax=docker/dockerfile:1

# ---- Build stage: compile + package the Spring Boot jar -------------------
# JDK 21 matches <java.version>21</java.version> in pom.xml. eclipse-temurin
# publishes amd64 + arm64 images, so this builds for any VPS architecture
# (DigitalOcean droplets are amd64).
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Copy the Maven wrapper + pom first and resolve dependencies. This layer is
# cached and only re-runs when pom.xml changes, so source edits rebuild fast.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline

# Now the source. Tests run in CI (native x86, fast) before the image build,
# so we skip them here to avoid slow emulated test runs.
COPY src/ src/
RUN ./mvnw -B -DskipTests clean package

# ---- Runtime stage: small JRE image that just runs the jar ----------------
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# curl is used by the docker-compose healthcheck to hit /actuator/health.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Run as a non-root user (least privilege).
RUN useradd --system --uid 10001 appuser
COPY --from=build /app/target/*.jar app.jar
USER appuser

EXPOSE 8080
# Container-aware heap: cap the JVM at 75% of the compose-limited memory.
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
