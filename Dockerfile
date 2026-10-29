FROM python:3.13-slim
WORKDIR /app
COPY requirements.lock.txt .
RUN pip install --no-cache-dir -r requirements.lock.txt
COPY services services
COPY alembic.ini .
RUN useradd --create-home --uid 10001 app && chown -R app:app /app
USER app
CMD ["uvicorn", "services.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
