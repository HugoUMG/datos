# Etapa 1: Compilar la aplicación con Maven y Java 21
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /app

# Copiar pom.xml primero (mejor para cache de dependencias)
COPY pom.xml .

# Descargar dependencias
RUN mvn dependency:go-offline

# Copiar el código fuente
COPY src ./src

# Compilar y generar el JAR
RUN mvn clean package -DskipTests

# Etapa 2: Ejecutar la aplicación (USAR TEMURIN)
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copiar el JAR desde la etapa de compilación
COPY --from=build /app/target/*.jar app.jar

# Exponer el puerto
EXPOSE 8080

# Comando para ejecutar la aplicación
ENTRYPOINT ["java", "-jar", "app.jar"]
