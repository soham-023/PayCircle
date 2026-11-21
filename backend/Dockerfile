# Multi-stage Dockerfile for PayCircle Spring Boot Backend
FROM eclipse-temurin:17-jdk-jammy AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Build application jar
RUN ./mvnw clean package -DskipTests 2>/dev/null || (apt-get update && apt-get install -y maven && mvn clean package -DskipTests)

FROM eclipse-temurin:17-jre-jammy
WORKDIR /app
EXPOSE 8080
COPY --from=build /app/target/paycircle-backend-1.0.0.jar app.jar
ENV SPRING_PROFILES_ACTIVE=postgres
ENTRYPOINT ["java", "-jar", "app.jar"]
