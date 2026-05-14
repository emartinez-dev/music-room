# music-room

## Development help

### Backend

Prerequisites:

- Python 3.14.5
- Docker with Docker Compose or Podman

Instructions to deploy:

1. Run `make db` (this starts the db engine)
2. Run `make install` (this only has to be ran the first time)
3. Run `make migrate` (this has to be ran on init and whenever the database structure changes)
4. Run `make api` (this starts the debug server)

Or:

1. First deploy postgres by executing `docker compose up -d`.
2. Then, change directory to `apps/api/` and create a virtual environment with `python3.14 -m venv .venv`.
    (This only has to be done the first time starting the backend). The virtual environment will
    allow us to have different package versions and install them at a project scope.
3. Activate the virtual environment with `source .venv/bin/activate` (this has
    to be done everytime so the backend is started using the project python version
    and packages).
4. Install the project requirements with `pip install -r requirements.txt`.
    (this only has to be done the first time).
5. Run the db migrations (this prepares the database when the schema changes): `python manage.py migrate`
6. Now start the backend with the following command: `python manage.py runserver 0.0.0.0:8000`

### Frontend

Prerequisites:
- pnpm 11.1.2
- Expo app on your phone

Instructions to deploy:

1. Run `make install` (the frontend dependencies were installed with the backend)
2. Deploy the backend on another terminal and ensure that it's running.
3. Run `make mobile` and follow the instructions in the terminal.
