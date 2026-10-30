# ==============================================================================
# Stage 1: Build Application with Maven and Temurin JDK 21
# ==============================================================================
FROM maven:3.9.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Leverage Docker cache layer for dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy application source code and package executable fat JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==============================================================================
# Stage 2: Production JRE Runtime
# ==============================================================================
FROM eclipse-temurin:21-jre-alpine AS runtime

# Install wget for Actuator health checks and create unprivileged non-root user
RUN apk add --no-cache wget && \
    addgroup -S -g 10001 spring && \
    adduser -S -u 10001 -G spring spring

WORKDIR /app

# Copy packaged JAR from builder stage with correct ownership
COPY --from=builder --chown=spring:spring /build/target/*.jar app.jar

# Enforce non-root execution
USER 10001:10001

EXPOSE 8080

# Configure container-aware JVM memory management
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"

# Built-in container health check querying Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
  CMD wget -qO- http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
