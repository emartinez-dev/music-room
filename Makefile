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
	pnpm install

# API Commands

api:
	cd apps/api && .venv/bin/python manage.py runserver 0.0.0.0:8000

migrate:
	cd apps/api && .venv/bin/python manage.py migrate

api-format:
	cd apps/api && ruff format .

api-lint:
	cd apps/api && ruff check .

db:
	$(COMPOSE) up -d

clear-db:
	$(COMPOSE) down -v

# Mobile Commands

mobile:
	cd apps/mobile && pnpm start

mobile-format:
	pnpm biome format apps/mobile/

mobile-lint:
	pnpm biome check apps/mobile/

.PHONY: install api migrate api-lint api-format db clear-db mobile mobile-format mobile-lint
