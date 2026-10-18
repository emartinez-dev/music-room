# cris-* targets: same as the Makefile ones, for Windows when make runs recipes through a
# POSIX shell (Git Bash / MSYS), which eats the backslashes in .venv\Scripts\python.exe.
# Included from the Makefile, so run them as usual: `make cris-api`, `make cris-test`...

ifeq ($(OS),Windows_NT)
    CRIS_PY := .venv/Scripts/python.exe
    CRIS_PIP := .venv/Scripts/pip.exe
else
    CRIS_PY := .venv/bin/python
    CRIS_PIP := .venv/bin/pip
endif

cris-install:
	cd apps/api && $(SYSTEM_PY) -m venv .venv && $(CRIS_PIP) install -r requirements.txt
	pnpm install

# API Commands

cris-api:
	cd apps/api && $(CRIS_PY) manage.py runserver 0.0.0.0:8000

cris-migrate:
	cd apps/api && $(CRIS_PY) manage.py migrate

cris-api-format:
	cd apps/api && $(CRIS_PY) -m ruff format .

cris-api-lint:
	cd apps/api && $(CRIS_PY) -m ruff check .

cris-api-test:
	cd apps/api && $(CRIS_PY) -m pytest --cov=music_room --cov=authentication --cov-report=term-missing

# Mobile and db commands don't touch the venv, so they just reuse the shared ones

cris-db: db
cris-clear-db: clear-db
cris-mobile: mobile
cris-mobile-build: mobile-build
cris-mobile-clean: mobile-clean
cris-mobile-format: mobile-format
cris-mobile-lint: mobile-lint
cris-mobile-test: mobile-test

# Code fix

cris-fix:
	$(MAKE) cris-api-format
	cd apps/api && $(CRIS_PY) -m ruff check --fix .
	pnpm biome format apps/mobile/ --write

.PHONY: cris-install cris-api cris-migrate cris-api-format cris-api-lint cris-api-test cris-db cris-clear-db cris-mobile cris-mobile-build cris-mobile-clean cris-mobile-format cris-mobile-lint cris-mobile-test cris-fix
