# API Setup Guide

This markdown file outlines the basics steps you take to have the API up and running.

## Source Code

Begin by cloning this git repository. Note that the following commands assume you are on a Unix based system.

```bash
git clone https://github.com/Starlight-Hacks/squad-2026.git
cd squad-2026/api
```

### API Setup

 To setup the Python Environment, run

 ```bash
    cd squad-2026/api
    python -m pip install -r requirements.txt
```

## Docker and Docker Compose

This project uses Docker and Docker Compose. It is assumed that Docker is already configured on your system. Click [this link](https://docs.docker.com/engine/install/) for more information on setting up Docker for Linux/Mac or Windows.

## Environment Variables

By default, `.env` files are git ignored. After a fresh clone you must create the environment variables file locally, before running the server.

```bash
cp .env.sample .env
```

You may modify this file to use your own variables/secrets.

## Database Migrations

This project uses Alembic and SqlAlchemy, use this command to execute migrations, it is assumed that the API service is running via Docker.

```bash
# Use this to drop into the container's shell
docker compose exec api sh

alembic revision --autogenerate -m "<commit name>"
alembic upgrade head
```

## Containerized Development

Once you've [setup Docker](#docker-and-docker-compose), spin up the web server and API with the following command.

```bash
docker compose down
docker compose up -d --build
```

This will shut down any previously running containers then start the services listed under the Docker Compose yaml file in the background.

Using `--build` will run build steps each time. To constrain this to only the api container, omit the build flat, then use:

```bash
docker compose up api -d --build
```

To inspect logs for any such service, use:

```bash
docker compose logs -f <service-name>
```
