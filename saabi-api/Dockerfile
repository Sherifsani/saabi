FROM python:3.12-slim
WORKDIR /code

COPY ./requirements.txt /requirements.txt
RUN pip install --no-cache-dir --upgrade -r /requirements.txt

COPY . .
RUN useradd -m app && chown -R app /code
USER app

EXPOSE 8000

# Bind the port the host provides via $PORT (Render sets this), defaulting to
# 8000 for local `docker run`. Shell form so the variable expands at runtime.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
