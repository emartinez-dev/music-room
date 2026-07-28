-include .env
export

# Env
MOCKS ?= 0

# Detect whether docker or podman is installed (works on Unix and Windows)
ifneq (,$(shell command -v docker 2>/dev/null))
    COMPOSE := docker compose
else ifneq (,$(shell where.exe docker 2>NUL))
    COMPOSE := docker compose
else ifneq (,$(shell command -v podman 2>/dev/null))
    COMPOSE := podman compose
else
    $(error Couldn't find docker nor podman installed on your system.)
endif

# Cross-platform python/venv paths
ifeq ($(OS),Windows_NT)
    SYSTEM_PY := python
    VENV_PY := .venv\Scripts\python.exe
    VENV_PIP := .venv\Scripts\pip.exe
else
    SYSTEM_PY := python3.14
    VENV_PY := .venv/bin/python
    VENV_PIP := .venv/bin/pip
endif

install:
	cd apps/api && $(SYSTEM_PY) -m venv .venv && $(VENV_PIP) install -r requirements.txt
	pnpm install

# API Commands

api:
	cd apps/api && $(VENV_PY) manage.py runserver 0.0.0.0:8000

migrate:
	cd apps/api && $(VENV_PY) manage.py migrate

api-format:
	cd apps/api && $(VENV_PY) -m ruff format .

api-lint:
	cd apps/api && $(VENV_PY) -m ruff check .

api-test:
	cd apps/api && $(VENV_PY) -m pytest --cov=music_room --cov-report=term-missing

db:
	$(COMPOSE) up -d

clear-db:
	$(COMPOSE) down -v

# Mobile Commands

mobile:
	cd apps/mobile && EXPO_PUBLIC_USE_MOCKS=$(MOCKS) npx expo start

mobile-build:
	cd apps/mobile && npx expo prebuild --platform android && npx expo run:android

mobile-format:
	pnpm biome format apps/mobile/

mobile-lint:
	pnpm biome check apps/mobile/

# Code fix

fix:
	$(MAKE) api-format
	cd apps/api && $(VENV_PY) -m ruff check --fix .
	$(MAKE) mobile-format

.PHONY: install api migrate api-lint api-format api-test db clear-db mobile mobile-format mobile-lint fix
