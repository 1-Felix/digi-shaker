## ADDED Requirements

### Requirement: Dockerfile
The dashboard SHALL include a Dockerfile that builds a production-ready container image.

#### Scenario: Build image
- **WHEN** `docker build -t digi-shaker dashboard/` is run from the repo root
- **THEN** a container image SHALL be produced containing the Bun runtime, compiled server, and built SolidJS assets

#### Scenario: Container startup
- **WHEN** the container starts
- **THEN** the Hono server SHALL listen on port 3000 and serve the dashboard

#### Scenario: Data volume
- **WHEN** the container is run with a volume mount at `/app/data`
- **THEN** the SQLite database SHALL be persisted in that volume

### Requirement: Docker Compose example
The repository SHALL include a `docker-compose.example.yml` for easy deployment.

#### Scenario: Example file
- **WHEN** a user copies `docker-compose.example.yml` to `docker-compose.yml`
- **THEN** they SHALL only need to set the `ESP32_HOST` environment variable to deploy

#### Scenario: Volume configuration
- **WHEN** the docker-compose file is used
- **THEN** it SHALL mount a local `./data` directory to `/app/data` for SQLite persistence

### Requirement: GitHub Actions CI
The repository SHALL include a GitHub Actions workflow that builds and publishes the Docker image.

#### Scenario: Build on push to main
- **WHEN** code is pushed to the `main` branch
- **THEN** the workflow SHALL build the Docker image from `dashboard/Dockerfile`

#### Scenario: Publish to GHCR
- **WHEN** the Docker image is built successfully
- **THEN** the workflow SHALL push it to GitHub Container Registry (`ghcr.io`)

#### Scenario: Tag strategy
- **WHEN** the image is published
- **THEN** it SHALL be tagged with `latest` and the short commit SHA
