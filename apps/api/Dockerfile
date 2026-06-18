FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*
COPY pyproject.toml .
COPY app/ app/
COPY alembic.ini .
COPY alembic/ alembic/
COPY seed.py .
RUN pip install -e .
CMD alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --workers 4
