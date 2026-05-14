-include .env
export

# Detect whether docker or podman is installed
ifneq (,$(shell command -v docker 2>/dev/null))
    COMPOSE := docker compose
else ifneq (,$(shell command -v podman 2>/dev/null))
    COMPOSE := podman compose
else
    $(error Couldn't find docker nor podman installed on your system.)
endif

install:
	cd apps/api && python3.14 -m venv .venv && .venv/bin/pip install -r requirements.txt

migrate:
	cd apps/api && .venv/bin/python manage.py migrate

format:
	cd apps/api && ruff format .

db:
	$(COMPOSE) up -d

clear-db:
	$(COMPOSE) down -v

api:
	cd apps/api && .venv/bin/python manage.py runserver 0.0.0.0:8000

.PHONY: install migrate format db clear-db api
