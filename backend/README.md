# Zone Detection Application Backend

This is the backend service for the Zone Detection Application, built with FastAPI and Pydantic, and containerized using Docker.

## Table of Contents

- [Project Structure](#project-structure)
- [Usage](#usage)

## Directory Structure

```
├── app
│   ├── client/
│   ├── config/
│   ├── data_management/
│   ├── database/
│   ├── routers/
│   ├── schemas/
│   ├── utils/
│   ├── __init__.py
│   ├── debugger.py
│   └── main.py
├── client_specs/
├── .env
├── Dockerfile
├── docker-compose.yml
├── docker-compose.dev.yml
├── pyproject.toml
└── README.md
```

The current directory contains the backend application built with FastAPI.

- **`.env`**: Environmental variables to be used in `docker-compose` files.
- **`Dockerfile`**: Docker configuration for containerizing the application backend.
- **`docker-compose.yml`**: Docker compose for running containerized backend.
- **`docker-compose.dev.yml`**: Docker compose for running containerized backend with development settings: with automatic update upon changes in the backend code and with debugging option.
- **`pyproject.toml`**: Python project configuration file.
- **`README.md`**: the current `README.md` file.

### `app/`

This folder contains the main source code of the application backend.

- **`app/client/`**: Implementation of main application logic for different types of Console clients and a factory for managing client instances.
- **`app/config/`**: Console configuration settings and environment variables.
- **`app/data_management/`**: Data processing/pipeline, flatbuffers and its generated python equivalent.<br/>
  The generated python equivalent was generated using the flatbuffers compiler `flatc` using the following command from `app/data_management/`: `flatc --python zonedetection.fbs`. More info on how to install flatbuffers compiler [https://github.com/google/flatbuffers?tab=readme-ov-file#quick-start](https://github.com/google/flatbuffers?tab=readme-ov-file#quick-start).
- **`app/database/`**: Database interactions, including models, connection utilities, and queries.
- **`app/routers/`**: API endpoint definitions of the current backend.
- **`app/schemas/`**: Pydantic models for data validation and serialization.
- **`app/utils/`**: Utility functions, including authentication and logging.
- **`app/main.py`**: The entry point of the application backend. It initializes the routers and runs the main workflow.
- **`app/debugger.py`**: Contains functions used to eneable backed debugging functionality.
- **`app/__init__.py`**: A file used to mark `app/` directory as a Python package.

### `client_specs/`

Contains OpenAPI specifications used to generate python clients.
- [**`aitrios-console-openapi.json`**](./app/client_specs/aitrios-console-openapi.json): AITRIOS Console v1 (1.8.2)
- [**`aitrios-console-v2-openapi.json`**](./app/client_specs/aitrios-console-v2-openapi.json): AITRIOS Console v2 (2.0.0)
- [**`local-console-openapi.json`**](./app/client_specs/local-console-openapi.json): Local Console (0.1.0)

## Usage

### Provide the credentials

Refer to the client application list of "Portal for AITRIOS" or register the client application for the sample application if necessary to get the following information:
See the chapter "Issuing a Client Secret for SDK" in ["Portal User Manual"](https://developer.aitrios.sony-semicon.com/en/edge-ai-sensing/documents/portal-user-manual/) for more information.

- Client ID
- Client Secret

To execute the REST APIs, please obtain the endpoint information as follows:
1. Log in to Portal.
2. From Support → Download, download the document Portal_Console_Endpoint_information_00_en.pdf.
3. Check the following information described in the document:
  - Console endpoint
  - Portal endpoint

And fill [console_access_settings.yaml](app/config/console_access_settings.yaml) file.

### Production

In production, you can use Docker Compose to set up both the backend and the PostgreSQL database.

1. Run the following command to build and start the application along with the database:
    ```bash
    docker compose up --build
    ```

    This command will build the Docker images and start both the backend and the PostgreSQL database containers. You don't need to manually build the Docker image; Docker Compose handles that for you.

2. Stop using:
    ```bash
    docker compose down
    ```

### Development

For development, we also use Docker Compose to run the backend and PostgreSQL database, with volume mounts to reflect code changes without needing to rebuild the image.

1. Ensure you have a .env file in the root directory for environment variables (example provided below).
2. Run the following command to start the backend and database with development settings:
    ```bash
    docker compose -f docker-compose.dev.yml up --build
    ```
3. Once the containers are up, you can edit the code in the app/ directory, and changes will be reflected automatically without needing to rebuild the image.
4. Stop the backend using:
    ```bash
    docker compose -f docker-compose.dev.yml down --volumes
    ```
    Notice the usage of the `--volumes`. This option will remove any volume created when starting the docker compose, including the ones related to the database.

    If you want the database to persist between sessions, remove the `--volumes` option. In this case, the instruction to stop the backend becomes the following:
    ```bash
    docker compose -f docker-compose.dev.yml down
    ```
