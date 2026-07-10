# Imagen de ejecución en Python con Flask
FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código de la aplicación
COPY . .

# Exponer puerto
EXPOSE 8080

# Variables de entorno
ENV PORT=8080
ENV PYTHONUNBUFFERED=1

# Iniciar servidor con gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "main:app"]