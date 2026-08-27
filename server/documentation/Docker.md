# Docker Guide for Backend

## Documentation navigation

For the complete request-to-database/integration execution model, JavaScript-oriented terminology, and module map, start with [`TECHNICAL-FLOW.md`](TECHNICAL-FLOW.md). For the product journey without as much implementation detail, use [`SYSTEM-FLOW.md`](SYSTEM-FLOW.md).


> **Documentation status (24 Aug 2026):** This document is maintained against the current repository. Runtime source, `server/.env.example`, `server/prisma/schema.prisma`, and `server/openapi.yaml` are authoritative if a historical phase note differs.


This file is the project-specific Docker reference for the backend. It explains what Docker is, how this repository uses it, how to install Docker on Windows and macOS, how to build and run the project, how the normal and test databases differ, how to inspect and troubleshoot containers, and what the important Docker commands mean.

---

## 1. What Docker solves

Without Docker, the backend depends directly on the developer's machine configuration: operating system, Node.js version, npm version, PostgreSQL version, installed packages, and other local settings. Different versions can make the same source code behave differently on different machines.

Docker reduces those differences by running the application inside a defined container environment.

For this project:

```text
Dockerfile
   -> builds the  backend image

Docker image
   -> packaged runtime + Node.js + dependencies + source + startup instruction

Docker container
   -> isolated running instance created from that image

docker-compose.yml
   -> runs the  backend and PostgreSQL together

docker-compose.test.yml
   -> runs a separate temporary PostgreSQL database for tests
```

Docker does not mean every possible machine behaves identically. CPU architecture, environment variables, external APIs, filesystem mounts, Docker settings, and networking can still differ. The important benefit is a much more consistent and reproducible runtime.

---

## 2. Docker terms used in this project

### Dockerfile

A `Dockerfile` is the recipe Docker uses to build one image.

The  `Dockerfile`:

1. Starts from a Node.js Debian image.
2. Creates `/app` as the working directory.
3. Copies `package.json` and `package-lock.json`.
4. Runs `npm ci` to install exact locked dependencies.
5. Copies Prisma files.
6. Generates the Prisma client.
7. Removes development-only dependencies for the runtime image.
8. Copies the project into the runtime image.
9. Runs the application as the non-root `node` user.
10. Exposes port `4000`.
11. Defines a `/health` health check.
12. Starts the backend using `node src/server.js`.

### Image

An image is the built package/template used to create containers.

Think of it as:

```text
Dockerfile -> docker build -> Image
```

An image is not the running application.

### Container

A container is a running instance of an image.

```text
Image -> docker run / docker compose up -> Container
```

Multiple containers can be created from the same image.

### Docker Compose

Docker Compose manages multiple services as one application stack.

In , the normal Compose file defines:

```text
postgres container
      +
backend container
      +
shared Docker network
      +
PostgreSQL persistent volume
```

### Volume

A Docker volume stores data outside a container's writable layer.

The normal  PostgreSQL service uses:

```text
smart-tourist-postgres
```

This means stopping/removing the PostgreSQL container does not automatically delete the development database data.

### Network

Docker Compose automatically creates a network for its services. Containers can communicate using their service names.

That is why the backend database URL uses:

```text
postgres:5432
```

inside Docker instead of:

```text
localhost:5432
```

Inside the backend container, `localhost` means the backend container itself. `postgres` means the PostgreSQL Compose service.

### Port mapping

A mapping such as:

```text
4000:4000
```

means:

```text
host port 4000 -> container port 4000
```

The backend is therefore normally reachable from the host at:

```text
http://localhost:4000
```

### Health check

A health check lets Docker determine whether a service is actually ready instead of merely running as a process.

The  PostgreSQL service uses `pg_isready`. The backend Dockerfile checks:

```text
GET /health
```

---

## 3. Docker files already

From the `server/` directory:

```text
server/
├── Dockerfile
├── .dockerignore
├── docker-compose.yml
└── docker-compose.test.yml
```

### `Dockerfile`

Builds the backend image.

### `.dockerignore`

Prevents unnecessary or sensitive files from being copied into the Docker build context/image. In this project it excludes files such as:

```text
.git
.env
.env.*
node_modules
coverage
logs
storage data
tests
*.log
*.patch
```

The project keeps `.env.example` available but intentionally does not copy real `.env` secrets into the image.

### `docker-compose.yml`

Runs the normal Docker development/demo stack:

- PostgreSQL 16 Alpine
- backend
- persistent PostgreSQL volume
- backend on host port `4000` by default
- PostgreSQL on host port `5432` by default

### `docker-compose.test.yml`

Runs a separate PostgreSQL 16 test database:

```text
Database: smart_tourist_safety_test
Host port: 5433
Container port: 5432
```

It stores PostgreSQL data in `tmpfs`, so the test database is temporary rather than persistent.

Important: the current `docker-compose.test.yml` starts only the test PostgreSQL service. Jest itself still runs through Node/npm on the host unless a separate test-runner container is added later.

---

# PART A - INSTALL DOCKER

## 4. Windows installation

### Requirements

Recommended:

- Windows 10/11 64-bit
- hardware virtualization enabled
- WSL 2
- Docker Desktop

### Step 1 - Check virtualization

Open Task Manager:

```text
Task Manager -> Performance -> CPU -> Virtualization
```

It should normally show:

```text
Enabled
```

If virtualization is disabled, enable Intel VT-x/AMD-V/SVM in BIOS/UEFI before continuing.

### Step 2 - Install or update WSL 2

Open PowerShell as Administrator:

```powershell
wsl --install
```

Meaning: installs Windows Subsystem for Linux and its default Linux distribution when WSL is not already installed.

Restart Windows if requested.

Check WSL:

```powershell
wsl --status
```

List installed distributions and versions:

```powershell
wsl -l -v
```

The distribution should preferably use version `2`.

To make WSL 2 the default for new distributions:

```powershell
wsl --set-default-version 2
```

### Step 3 - Download Docker Desktop

Download Docker Desktop for Windows from Docker's official site:

```text
https://www.docker.com/products/docker-desktop/
```

Run the installer. Use the WSL 2 based engine when offered/recommended.

### Step 4 - Start Docker Desktop

Launch Docker Desktop and wait until the Docker engine reports that it is running.

### Step 5 - Verify installation

Open PowerShell:

```powershell
docker --version
```

Meaning: prints the Docker CLI version.

```powershell
docker compose version
```

Meaning: verifies Docker Compose v2 is installed.

```powershell
docker info
```

Meaning: displays information about the running Docker engine. If Docker Desktop is not running, this usually fails.

Run Docker's basic test container:

```powershell
docker run --rm hello-world
```

Meaning:

- downloads the `hello-world` image if needed
- creates a container
- runs it
- removes the container afterward because of `--rm`

If this succeeds, Docker can pull images and run containers.

---

## 5. macOS installation

### Step 1 - Check Mac architecture

Apple menu -> About This Mac.

Determine whether the Mac uses:

```text
Apple Silicon (M-series)
```

or:

```text
Intel
```

### Step 2 - Download Docker Desktop

Download the correct Docker Desktop installer from:

```text
https://www.docker.com/products/docker-desktop/
```

Choose the build matching Apple Silicon or Intel.

### Step 3 - Install

Open the downloaded `.dmg` and drag Docker into Applications.

Start Docker from Applications and approve any macOS permissions it requests.

Wait for the Docker engine to finish starting.

### Step 4 - Verify installation

Open Terminal:

```bash
docker --version
```

```bash
docker compose version
```

```bash
docker info
```

Then run:

```bash
docker run --rm hello-world
```

If `hello-world` succeeds, Docker is ready.

---

# PART B - RUN WITH DOCKER

## 6. Open the correct project directory

All Docker commands in this guide assume the terminal is inside:

```text
/server
```

Windows PowerShell example:

```powershell
cd C:\path\to\server
```

macOS Terminal example:

```bash
cd /path/to/server
```

Confirm the files exist.

Windows:

```powershell
dir Dockerfile, docker-compose.yml, docker-compose.test.yml
```

macOS:

```bash
ls Dockerfile docker-compose.yml docker-compose.test.yml
```

---

## 7. Validate the Compose configuration

Before building, run:

```bash
docker compose config
```

Meaning: parses `docker-compose.yml`, resolves variables/defaults, and prints the final Compose configuration. This is useful for catching YAML/configuration problems before startup.

To validate the test file:

```bash
docker compose -f docker-compose.test.yml config
```

Meaning: explicitly tells Compose to use the test Compose file instead of the default one.

---

## 8. Build the backend image

Normal build:

```bash
docker compose build
```

Meaning: builds images for services that have a `build:` section. In this builds the `backend` service from the local `Dockerfile`.

After changing the Dockerfile or when debugging stale layers:

```bash
docker compose build --no-cache
```

Meaning: rebuilds without reusing cached Dockerfile layers.

You do not need `--no-cache` for every normal build. Docker's build cache exists to save time.

Build only the backend:

```bash
docker compose build backend
```

---

## 9. Important production-environment note

The normal `docker-compose.yml` currently sets:

```text
NODE_ENV=production
```

environment validation requires production-safe values for at least:

```text
ACCESS_TOKEN_SECRET
REFRESH_TOKEN_SECRET
EMAIL_OTP_SECRET
GMAIL_USER
GMAIL_APP_PASSWORD
```

The current Compose file does not pass those variables into the backend service. Also, `.dockerignore` intentionally excludes local `.env` files from the Docker image.

Therefore, with the repository exactly as currently written, `docker compose up` may start PostgreSQL but the backend can exit during production environment validation.

That is not a Docker failure. It means the application is correctly refusing to run production mode with missing/default secrets.

### Recommended project configuration

For a proper full-stack Compose run, pass required secrets to `backend` through Compose using `${VARIABLE_NAME}` references, an `env_file`, Docker secrets, or your deployment platform's secret management.

Do not bake passwords, JWT secrets, Gmail App Passwords, or other real secrets into the Dockerfile or Git repository.

After the Compose environment is configured, the normal startup commands below apply directly.

---

## 10. Start the normal Compose stack

Foreground mode:

```bash
docker compose up
```

Meaning:

1. creates the Compose network if needed
2. creates/starts PostgreSQL
3. waits for PostgreSQL to become healthy because of `depends_on`
4. creates/starts the backend
5. displays logs in the current terminal

Stop foreground mode with:

```text
Ctrl + C
```

Detached/background mode:

```bash
docker compose up -d
```

Meaning: starts the services but returns control of the terminal.

Build and start in one command:

```bash
docker compose up -d --build
```

Meaning: rebuilds services whose images need building and then starts the stack in detached mode.

This is one of the most useful everyday Docker commands.

---

## 11. Start only PostgreSQL

If you want the database in Docker but want to run Node.js locally:

```bash
docker compose up -d postgres
```

The database is then available from the host at:

```text
localhost:5432
```

using the default Compose credentials:

```text
Database: smart_tourist_safety
User: postgres
Password: postgres
```

The host-side `DATABASE_URL` would therefore normally be:

```text
postgresql://postgres:postgres@localhost:5432/smart_tourist_safety?schema=public
```

This is different from the backend-container URL, which uses `postgres` as the hostname.

---

## 12. Check which containers are running

Compose services:

```bash
docker compose ps
```

Meaning: shows the state, health, and port mappings of services belonging to the current Compose project.

All currently running Docker containers:

```bash
docker ps
```

All containers, including stopped containers:

```bash
docker ps -a
```

---

## 13. View logs

All Compose logs:

```bash
docker compose logs
```

Follow new logs continuously:

```bash
docker compose logs -f
```

Backend only:

```bash
docker compose logs -f backend
```

PostgreSQL only:

```bash
docker compose logs -f postgres
```

Show the latest 100 backend log lines and continue following:

```bash
docker compose logs --tail=100 -f backend
```

Use logs first when a container exits or an endpoint is unavailable.

---

## 14. Check backend health

After the backend is running:

```text
http://localhost:4000/health
```

Windows PowerShell:

```powershell
Invoke-RestMethod http://localhost:4000/health
```

macOS with curl:

```bash
curl http://localhost:4000/health
```

Other project health endpoints include:

```text
GET /health
GET /health/ready
GET /health/database
GET /api/v1
```

Inspect Docker health status with:

```bash
docker compose ps
```

or:

```bash
docker inspect --format='{{json .State.Health}}' <container-name>
```

On PowerShell, quoting rules can differ; `docker compose ps` is usually enough for normal inspection.

---

## 15. Run commands inside the backend container

When the backend container is already running:

```bash
docker compose exec backend <command>
```

Examples:

Open a shell:

```bash
docker compose exec backend sh
```

Meaning: opens an interactive shell inside the running backend container.

Check Node version inside the container:

```bash
docker compose exec backend node --version
```

Check npm version:

```bash
docker compose exec backend npm --version
```

Run Prisma migration deployment:

```bash
docker compose exec backend npm run prisma:migrate:deploy
```

Check migration status:

```bash
docker compose exec backend npx prisma migrate status
```

Seed the database:

```bash
docker compose exec backend npm run prisma:seed
```

Important: the runtime image prunes development dependencies. Commands that require packages available only in `devDependencies` may not be available in the production runtime container.

---

## 16. Stop the normal stack

Stop and remove Compose containers/network:

```bash
docker compose down
```

This does NOT remove the named PostgreSQL volume by default, so normal database data remains available for the next startup.

Start again later:

```bash
docker compose up -d
```

---

## 17. Stop containers without removing them

```bash
docker compose stop
```

Meaning: stops the services but leaves their containers created.

Start those stopped containers again:

```bash
docker compose start
```

Difference:

```text
docker compose stop
  -> stop but keep containers

docker compose down
  -> stop and remove containers + Compose network
```

---

## 18. Restart services

Restart all current Compose services:

```bash
docker compose restart
```

Restart only backend:

```bash
docker compose restart backend
```

Important: `restart` does not rebuild the image. After changing source copied into the image or the Dockerfile, use:

```bash
docker compose up -d --build backend
```

---

# PART C - DATABASE AND PRISMA

## 19. Normal PostgreSQL database behavior

The normal Compose file creates a named volume:

```text
smart-tourist-postgres
```

Therefore:

```bash
docker compose down
```

removes containers but normally keeps database data.

To list Docker volumes:

```bash
docker volume ls
```

To inspect a volume:

```bash
docker volume inspect <volume-name>
```

Compose usually prefixes the declared volume name with the Compose project/directory name when creating the actual Docker volume.

---

## 20. Connect directly to PostgreSQL inside Docker

Open `psql` inside the PostgreSQL container:

```bash
docker compose exec postgres psql -U postgres -d smart_tourist_safety
```

Useful `psql` commands:

```text
\dt       list tables
\d NAME   describe a table
\l        list databases
\q        quit psql
```

---

## 21. Completely reset the normal Docker database

WARNING: the following removes the Compose volumes and therefore deletes the Docker-managed development PostgreSQL data.

```bash
docker compose down -v
```

Meaning:

```text
down -> remove containers/network
-v   -> also remove declared volumes
```

Then recreate everything:

```bash
docker compose up -d --build
```

Only use `down -v` when you intentionally want a fresh database.

---

# PART D - TEST DATABASE

## 22. Why the test database is separate

Automated tests may create, update, delete, or reset records. They should not run against the normal development database.

therefore has:

```text
Normal DB
  smart_tourist_safety
  host port 5432
  persistent named volume

Test DB
  smart_tourist_safety_test
  host port 5433
  temporary tmpfs storage
```

---

## 23. Start the Docker test database

From `server/`:

```bash
docker compose -f docker-compose.test.yml up -d
```

Meaning: starts the services defined in `docker-compose.test.yml`, currently `postgres-test`.

Check it:

```bash
docker compose -f docker-compose.test.yml ps
```

View its logs:

```bash
docker compose -f docker-compose.test.yml logs -f postgres-test
```

The host-side test database URL is:

```text
postgresql://postgres:postgres@localhost:5433/smart_tourist_safety_test?schema=public
```

---

## 24. Run Jest against the test database

The exact test environment variables should follow the project's test configuration. The key requirement is that database-backed tests point to port `5433` / `smart_tourist_safety_test`, not the normal development database.

A typical sequence is:

```text
1. Start postgres-test with Docker Compose
2. Set test DATABASE_URL
3. Apply/generate required Prisma state
4. Run Jest
5. Stop the test Compose stack
```

The repository's main test commands are:

```bash
npm test
```

Meaning: runs the full configured phase regression suite.

```bash
npm run test:unit
```

Meaning: runs unit tests.

```bash
npm run test:integration
```

Meaning: runs integration tests.

```bash
npm run test:e2e
```

Meaning: runs end-to-end tests.

```bash
npm run test:security
```

Meaning: runs security tests.

```bash
npm run test:coverage
```

Meaning: runs tests and produces coverage information.

Stop the test database:

```bash
docker compose -f docker-compose.test.yml down
```

Because PostgreSQL data is stored using `tmpfs` in this test Compose file, the test database is disposable and does not behave like the persistent normal development volume.

---

# PART E - EVERYDAY DEVELOPMENT WORKFLOW

## 25. First-time Docker workflow

After Docker Desktop is installed and the Compose environment is configured with the required production secrets:

```bash
cd path/to/server
docker compose config
docker compose build
docker compose up -d
docker compose ps
docker compose logs -f backend
```

Then verify:

```text
http://localhost:4000/health
```

---

## 26. Normal daily startup

```bash
docker compose up -d
```

Check status:

```bash
docker compose ps
```

Check backend logs if needed:

```bash
docker compose logs -f backend
```

---

## 27. After changing application source code

The current Compose file does not bind-mount the source directory into the production backend container. The code is copied into the image during `docker build`.

Therefore, after source changes, rebuild the backend image:

```bash
docker compose up -d --build backend
```

If Docker's cache appears stale:

```bash
docker compose build --no-cache backend
docker compose up -d backend
```

---

## 28. After changing `package.json` or `package-lock.json`

Rebuild:

```bash
docker compose up -d --build backend
```

The Dockerfile uses:

```text
npm ci
```

so dependencies are installed according to `package-lock.json`.

If debugging dependency-cache issues:

```bash
docker compose build --no-cache backend
```

---

## 29. After changing the Dockerfile

Use:

```bash
docker compose build --no-cache backend
docker compose up -d backend
```

Then verify the runtime if needed:

```bash
docker compose exec backend node --version
```

---

## 30. After changing Compose configuration

Validate first:

```bash
docker compose config
```

Then recreate services:

```bash
docker compose up -d
```

Use `--build` too if the image/build inputs changed:

```bash
docker compose up -d --build
```

---

# PART F - INSPECTION COMMANDS

## 31. List images

```bash
docker image ls
```

or:

```bash
docker images
```

Meaning: lists locally available Docker images.

---

## 32. Inspect an image

```bash
docker image inspect <image-name-or-id>
```

Meaning: displays image metadata such as layers, configuration, architecture, environment defaults, and entrypoint/command.

---

## 33. Inspect a container

```bash
docker inspect <container-name-or-id>
```

Meaning: shows detailed container configuration, mounts, networking, state, health, and other metadata.

---

## 34. View container resource usage

```bash
docker stats
```

Meaning: shows live CPU, memory, network, and I/O usage for running containers.

Stop the live view with `Ctrl + C`.

---

## 35. Show Docker disk usage

```bash
docker system df
```

Meaning: shows disk space used by Docker images, containers, local volumes, and build cache.

---

# PART G - CLEANUP

## 36. Remove stopped Compose containers

```bash
docker compose down
```

This is the normal safe cleanup command because it preserves the normal database volume.

---

## 37. Remove unused build cache

```bash
docker builder prune
```

Docker asks for confirmation.

Force without confirmation:

```bash
docker builder prune -f
```

Use this when old build cache is consuming unnecessary disk space.

---

## 38. Remove unused Docker objects

```bash
docker system prune
```

This can remove stopped containers, unused networks, dangling images, and build cache.

Be careful with broader cleanup commands on a machine that runs other Docker projects.

Do not casually add `--volumes` unless you understand which unused volumes may contain data you care about.

---

# PART H - TROUBLESHOOTING

## 39. `docker` command not found

### Windows

Make sure Docker Desktop is installed and running. Close and reopen PowerShell after installation if necessary.

Check:

```powershell
docker --version
```

### macOS

Start Docker Desktop and reopen Terminal if necessary.

Check:

```bash
docker --version
```

---

## 40. Cannot connect to Docker daemon/engine

Typical reason: Docker Desktop is installed but not running yet.

Check:

```bash
docker info
```

Start Docker Desktop and wait for its engine to become ready.

---

## 41. Port 4000 is already in use

Find the process or change the host-side backend port.

The Compose file supports:

```text
BACKEND_PORT
```

For example, when properly supplied to Compose:

```text
BACKEND_PORT=4001
```

maps host port `4001` to container port `4000`.

The backend would then be reached from the host at:

```text
http://localhost:4001
```

---

## 42. Port 5432 is already in use

A locally installed PostgreSQL instance may already use port `5432`.

The Compose file supports:

```text
POSTGRES_PORT
```

Choose another host port such as `5434` if required.

Remember: containers still communicate internally with the PostgreSQL service on container port `5432`.

---

## 43. Backend container immediately exits

Run:

```bash
docker compose ps -a
```

Then:

```bash
docker compose logs backend
```

Common causes include:

- required production environment variables are missing
- production JWT/OTP secrets are too short or still contain default `change-me` values
- Gmail credentials required by production validation are missing
- database is unavailable
- Prisma/database migration problems
- invalid CORS/environment configuration

Read the first meaningful application error in the logs rather than treating every container exit as a Docker problem.

---

## 44. PostgreSQL is not healthy

Check:

```bash
docker compose logs postgres
```

Then:

```bash
docker compose ps
```

The backend waits for PostgreSQL's health check before starting.

---

## 45. Backend cannot connect to PostgreSQL

Inside Compose, the backend must connect to:

```text
postgres:5432
```

not:

```text
localhost:5432
```

The Compose file already builds the in-container `DATABASE_URL` using the `postgres` service hostname.

From the host machine, however, you normally use:

```text
localhost:5432
```

This host/container distinction is one of the most common Docker networking mistakes.

---

## 46. Code changes are not appearing

The current backend service is image-based and does not mount the source directory as a development volume.

Rebuild:

```bash
docker compose up -d --build backend
```

For a guaranteed clean Dockerfile rebuild:

```bash
docker compose build --no-cache backend
docker compose up -d backend
```

---

## 47. See the exact final Compose configuration

Run:

```bash
docker compose config
```

This is especially useful when environment-variable substitution is involved.

Do not paste output containing secrets into public issues, screenshots, or chat messages.

---

# PART I - DOCKER COMMAND CHEAT SHEET

## 48. Essential commands

| Command                             | Meaning                                           |
| ----------------------------------- | ------------------------------------------------- |
| `docker --version`                | Show Docker CLI version                           |
| `docker compose version`          | Show Compose version                              |
| `docker info`                     | Show Docker engine/system information             |
| `docker run --rm hello-world`     | Verify Docker can run a container                 |
| `docker compose config`           | Validate/show resolved Compose configuration      |
| `docker compose build`            | Build Compose images                              |
| `docker compose build --no-cache` | Build without cached layers                       |
| `docker compose up`               | Start services in foreground                      |
| `docker compose up -d`            | Start services in background                      |
| `docker compose up -d --build`    | Build and start services                          |
| `docker compose ps`               | Show Compose service status                       |
| `docker ps`                       | Show running containers                           |
| `docker ps -a`                    | Show running and stopped containers               |
| `docker compose logs`             | Show service logs                                 |
| `docker compose logs -f backend`  | Follow backend logs                               |
| `docker compose exec backend sh`  | Open shell inside backend container               |
| `docker compose stop`             | Stop Compose services without removing containers |
| `docker compose start`            | Start previously stopped Compose containers       |
| `docker compose restart`          | Restart services without rebuilding               |
| `docker compose down`             | Stop/remove Compose containers and network        |
| `docker compose down -v`          | Also delete Compose volumes/data; destructive     |
| `docker image ls`                 | List images                                       |
| `docker volume ls`                | List volumes                                      |
| `docker stats`                    | View live container resource usage                |
| `docker system df`                | View Docker disk usage                            |
| `docker builder prune`            | Remove unused build cache                         |

---

# PART J - COMMAND CHEAT SHEET

## 49. Normal stack

Start:

```bash
docker compose up -d
```

Build + start:

```bash
docker compose up -d --build
```

Status:

```bash
docker compose ps
```

Backend logs:

```bash
docker compose logs -f backend
```

PostgreSQL logs:

```bash
docker compose logs -f postgres
```

Stop/remove containers while keeping DB volume:

```bash
docker compose down
```

Delete containers AND normal Docker DB volume:

```bash
docker compose down -v
```

---

## 50.test database

Start:

```bash
docker compose -f docker-compose.test.yml up -d
```

Status:

```bash
docker compose -f docker-compose.test.yml ps
```

Logs:

```bash
docker compose -f docker-compose.test.yml logs -f postgres-test
```

Stop:

```bash
docker compose -f docker-compose.test.yml down
```

Host test DB URL:

```text
postgresql://postgres:postgres@localhost:5433/smart_tourist_safety_test?schema=public
```

---

# PART K - WHAT TO REMEMBER FOR A DEMO OR VIVA

## 51. Docker

Docker provides a consistent containerized runtime so the project depends less on each developer's local Node.js, PostgreSQL, operating-system package, and configuration differences.

## 52. Image

An image is the packaged template containing the runtime, dependencies, application files, and startup configuration used to create containers.

## 53. Container

A container is an isolated running instance created from an image.

## 54. Dockerfile

The Dockerfile defines how the backend image is built.

## 55. Docker Compose

Docker Compose defines how multiple services/containers are configured and run together. it coordinate the backend and PostgreSQL.

## 56. Normal database versus test database

The normal Docker database uses persistent volume storage and host port `5432`. The test Compose database uses a separate database on host port `5433` with temporary `tmpfs` storage so automated tests do not modify normal development data.

## 57. Why `postgres` is used as the hostname in Docker

Compose services communicate over a Docker network using service names. Therefore the backend connects to the database at `postgres:5432` from inside Docker. A program running directly on the host instead uses `localhost:<published-port>`.

## 58. Why rebuild after code changes

The current backend Compose service copies source code into its Docker image and does not bind-mount the source directory. Source or dependency changes therefore require rebuilding the image before the container can run the updated code.

## 59. Why secrets should not be stored in the image

Images can be shared, cached, pushed to registries, and inspected. Runtime secrets such as JWT keys and Gmail App Passwords should be injected securely at runtime rather than committed to source control or baked into Docker image layers.

---

# PART L - RECOMMENDED SAFE WORKFLOW

For normal work, the commands worth memorizing are:

```bash
# Validate Compose
docker compose config

# Build and start
docker compose up -d --build

# Check status
docker compose ps

# Watch backend logs
docker compose logs -f backend

# Stop normally without deleting DB data
docker compose down
```

For the separate test database:

```bash
# Start test DB
docker compose -f docker-compose.test.yml up -d

# Run the project's Jest tests with the test DATABASE_URL
npm test

# Stop test DB
docker compose -f docker-compose.test.yml down
```

The destructive database-reset command to remember but not casually use is:

```bash
docker compose down -v
```

It removes the normal Compose volume and therefore deletes Docker-managed PostgreSQL data for that Compose project.

## Emergency dispatch schema startup

The runtime container now executes `npm run prisma:migrate:deploy` before `node src/server.js`. This is required so Police/Fire/Ambulance service accounts and unit-location fields exist before the emergency-service routes accept traffic.

## Emergency email environment in Docker Compose

The backend container now receives the same Brevo variables used by local/Render deployments:

```env
BREVO_API_KEY=...
BREVO_SENDER_EMAIL=...
BREVO_SENDER_NAME=QuantumCrew
PUBLIC_APP_URL=https://your-frontend.example
```

`PUBLIC_APP_URL` is required for clickable SOS/incident and responder-dispatch links. Do not put a backend URL here; it must be the frontend origin that implements `/login?redirect=...`.

## Latest Rakshak AI integration

Rakshak AI runs as a separate authenticated service under `ai-ml/`. It validates the same access JWT issued by the main Kavach backend (`JWT_ISSUER=smart-tourist-safety`, `JWT_AUDIENCE=smart-tourist-safety-client` by default), uses the maintained Markdown knowledge base in `ai-ml/kb/`, and persists user-scoped conversations/messages in PostgreSQL. Clearing chat hides prior messages from that user's UI without deleting the stored database history. Disaster Management also has authenticated provisioning for Police, Fire, and Ambulance/Hospital responder accounts; responders subsequently use the normal login flow.


## 2026-08-27 container/runtime note

Current local/production verification should include the backend, PostgreSQL, optional blockchain gateway, frontend, and Rakshak AI service as separate runtime concerns. A container being healthy does not prove CORS, email delivery, Google Maps client configuration, websocket/realtime delivery, or AI JWT compatibility; validate those integration paths explicitly after startup.
