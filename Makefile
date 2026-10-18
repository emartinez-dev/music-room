-include .env
export

# Env
MOCKS ?= 0

# Detect whether docker or podman is installed (works on Unix and Windows)
ifneq (,$(shell command -v docker 2>/dev/null))
    COMPOSE := docker compose
else ifneq (,$(shell where.exe docker 2>/dev/null))
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
    VENV_PY_UNIX := .venv/Scripts/python.exe
    VENV_PIP_UNIX := .venv/Scripts/pip.exe
else
    SYSTEM_PY := python3.14
    VENV_PY := .venv/bin/python
    VENV_PIP := .venv/bin/pip
    VENV_PY_UNIX := .venv/bin/python
    VENV_PIP_UNIX := .venv/bin/pip
endif

# Detect if using cris- prefix (for Windows PowerShell compatibility)
USING_CRIS := $(findstring cris-,$(MAKECMDGOALS))

ifeq ($(USING_CRIS),cris-)
    VENV_PY_FINAL := $(VENV_PY_UNIX)
    VENV_PIP_FINAL := $(VENV_PIP_UNIX)
else
    VENV_PY_FINAL := $(VENV_PY)
    VENV_PIP_FINAL := $(VENV_PIP)
endif

install:
	cd apps/api && $(SYSTEM_PY) -m venv .venv && $(VENV_PIP_UNIX) install -r requirements.txt
	pnpm install

cris-install:
	cd apps/api && $(SYSTEM_PY) -m venv .venv && $(VENV_PIP_UNIX) install -r requirements.txt
	pnpm install

# API Commands

api:
	cd apps/api && $(VENV_PY_FINAL) manage.py runserver 0.0.0.0:8000

cris-api:
	cd apps/api && $(VENV_PY_UNIX) manage.py runserver 0.0.0.0:8000

migrate:
	cd apps/api && $(VENV_PY_FINAL) manage.py migrate

cris-migrate:
	cd apps/api && $(VENV_PY_UNIX) manage.py migrate

api-format:
	cd apps/api && $(VENV_PY_FINAL) -m ruff format .

cris-api-format:
	cd apps/api && $(VENV_PY_UNIX) -m ruff format .

api-lint:
	cd apps/api && $(VENV_PY_FINAL) -m ruff check .

cris-api-lint:
	cd apps/api && $(VENV_PY_UNIX) -m ruff check .

api-test:
	cd apps/api && $(VENV_PY_FINAL) -m pytest --cov=music_room --cov=authentication --cov-report=term-missing

cris-api-test:
	cd apps/api && $(VENV_PY_UNIX) -m pytest --cov=music_room --cov=authentication --cov-report=term-missing

db:
	$(COMPOSE) up -d

clear-db:
	$(COMPOSE) down -v

# Mobile Commands

mobile:
	cd apps/mobile && EXPO_PUBLIC_USE_MOCKS=$(MOCKS) npx expo start

cris-mobile:
	cd apps/mobile && EXPO_PUBLIC_USE_MOCKS=$(MOCKS) npx expo start

mobile-build:
	cd apps/mobile && npx expo prebuild --platform android && npx expo run:android

cris-mobile-build:
	cd apps/mobile && npx expo prebuild --platform android && npx expo run:android

mobile-clean:
	cd apps/mobile && npx expo prebuild --clean

cris-mobile-clean:
	cd apps/mobile && npx expo prebuild --clean

mobile-format:
	pnpm biome format apps/mobile/

cris-mobile-format:
	pnpm biome format apps/mobile/

mobile-lint:
	pnpm biome check apps/mobile/

cris-mobile-lint:
	pnpm biome check apps/mobile/

mobile-test:
	cd apps/mobile && npm test

cris-mobile-test:
	cd apps/mobile && npm test

# Code fix

fix:
	$(MAKE) api-format
	cd apps/api && $(VENV_PY_FINAL) -m ruff check --fix .
	pnpm biome format apps/mobile/ --write

cris-fix:
	$(MAKE) cris-api-format
	cd apps/api && $(VENV_PY_UNIX) -m ruff check --fix .
	pnpm biome format apps/mobile/ --write

.PHONY: install api cris-api migrate cris-migrate api-lint cris-api-lint api-format cris-api-format api-test cris-api-test db clear-db mobile cris-mobile mobile-format cris-mobile-format mobile-lint cris-mobile-lint mobile-test cris-mobile-test fix cris-fix