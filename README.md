# Mini Inventory System

A full-stack inventory management application built with **Django REST Framework** and **React + TypeScript**. It supports authenticated inventory access, category-based filtering, product-name search, pagination, and product CRUD operations.

## Features

### Backend

- Django models for `Category` and `Product`.
- Django REST Framework `ModelViewSet` and serializers for category and product endpoints.
- JWT authentication using Simple JWT.
- Authenticated API access by default.
- Product list pagination (10 records per page).
- Search products by name and filter products by category.
- Serializer validation: price must be greater than zero and stock must be non-negative.
- A management command that seeds 24 sample products across four categories.
- Automated backend tests for serializer validation and API behavior.

### Frontend

- React + TypeScript application scaffolded with Vite.
- Login page connected to the Django JWT endpoint.
- Inventory table with server-side pagination, category filtering, and debounced product-name search.
- Add, edit, and delete product workflows, including delete confirmation.
- Client-side form validation and display of API validation errors.
- Loading, error, and empty states.
- Responsive layout for desktop and mobile screens.
- TanStack Query for fetching, caching, and refreshing inventory data after changes.

## Technology stack

| Area | Technologies |
|---|---|
| Backend | Python, Django, Django REST Framework |
| Authentication | Simple JWT |
| Database | PostgreSQL |
| Filtering | `django-filter`, DRF `SearchFilter` |
| Frontend | React, TypeScript, Vite |
| API requests | Axios |
| Client-side routing | React Router |
| Server-state management | TanStack Query |
| Backend tests | Django test runner, DRF `APITestCase` |

## Project structure

```text
mini-inventory-system/
├── backend/
│   ├── config/                 # Django project settings and URLs
│   ├── inventory/
│   │   ├── management/
│   │   │   └── commands/
│   │   │       └── seed_inventory.py
│   │   ├── migrations/
│   │   ├── tests/              # Serializer and API tests
│   │   ├── models.py
│   │   ├── serializers.py
│   │   └── views.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── .env                       
└── README.md
```

## Prerequisites

Install the following before setting up the project:

- Python 3.13 (or a compatible version supported by the installed Django release)
- PostgreSQL
- Node.js and npm (the project was developed with Node.js 22 and npm 10)
- Git

## Setup and run the backend

Run these commands from the repository root in **PowerShell on Windows**.

### 1. Create and activate a virtual environment

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r backend/requirements.txt
```

If PowerShell blocks activation due to the local execution policy, use the environment activation approach permitted by your machine's policy, or run the commands from a terminal where activation is allowed.

### 2. Configure PostgreSQL and environment variables

Create a PostgreSQL database for the application. The local database used during development is named `mini_inventory`; use the same name as the configured database, or update your environment to match your own database.

The project reads local settings from the root `.env` file. Keep the file private and **do not commit it**. Populate the database credentials and Django settings required by `backend/config/settings.py`. Variable names must match the names that file reads. A typical configuration contains values for:

```dotenv
SECRET_KEY=replace-with-a-local-development-secret
DEBUG=True
DB_NAME=mini_inventory
DB_USER=your_postgres_username
DB_PASSWORD=your_local_postgres_password
DB_HOST=127.0.0.1
DB_PORT=5432
```

This is an example only: retain the variable names required by your actual settings file, and replace every placeholder with local values. Do not use development settings or credentials in production.

### 3. Apply migrations

```powershell
cd backend
python manage.py migrate
```

### 4. Create a login account

Create a local account for the React login page:

```powershell
python manage.py createsuperuser
```

Follow the prompts and keep the username and password you choose. The project does not rely on a hard-coded default login. Use the account you create to sign in to the frontend.

### 5. Seed sample inventory data

```powershell
python manage.py seed_inventory
```

The command defines **24 sample products across four categories**: Electronics, Office Supplies, Furniture, and Accessories. It uses `update_or_create`, so rerunning the command updates matching seeded products instead of repeatedly creating duplicate records with the same product names.

### 6. Start Django

From the `backend` directory:

```powershell
python manage.py runserver
```

The API is available at `http://127.0.0.1:8000/` by default.

## Setup and run the frontend

Open a **second terminal** at the repository root.

### 1. Install dependencies

```powershell
cd frontend
npm install
```

### 2. Configure the API URL

Create `frontend/.env.local` with the following value:

```dotenv
VITE_API_BASE_URL=http://127.0.0.1:8000/api/
```

Keep `.env.local` out of version control. If you change this file while Vite is running, restart the Vite development server so it reloads the environment variable.

### 3. Start Vite

```powershell
npm run dev
```

Open the local URL printed by Vite, normally `http://localhost:5173/`, and sign in using the Django account created with `createsuperuser`.

Both the Django and Vite servers must be running while using the local application.

## API endpoints

The main API endpoints are:

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/api/token/` | Obtain JWT access and refresh tokens |
| `POST` | `/api/token/refresh/` | Request a refreshed access token |
| `GET` | `/api/products/` | List products with pagination |
| `POST` | `/api/products/` | Create a product |
| `GET` | `/api/products/{id}/` | Retrieve one product |
| `PUT` / `PATCH` | `/api/products/{id}/` | Update a product |
| `DELETE` | `/api/products/{id}/` | Delete a product |
| `GET` | `/api/categories/` | List categories |
| `POST` | `/api/categories/` | Create a category |
| `GET` | `/api/categories/{id}/` | Retrieve one category |
| `PUT` / `PATCH` | `/api/categories/{id}/` | Update a category |
| `DELETE` | `/api/categories/{id}/` | Delete a category |

Product list query parameters include:

- `page`: page number (10 products per page by default).
- `search`: search product names; for example, `/api/products/?search=keyboard`.
- `category`: filter by category ID; for example, `/api/products/?category=1`.

Authenticated requests use the header `Authorization: Bearer <access-token>`.

## Run backend tests

From the `backend` directory:

```powershell
python manage.py test inventory
```

The current backend test suite contains **14 tests** covering serializer validation and API behavior, including authentication, product/category CRUD, search, and category filtering.

## Technical decisions

- **Django REST Framework ViewSets and ModelSerializers** provide consistent CRUD endpoints and keep request/response handling close to the models.
- **Simple JWT** provides token-based authentication suitable for a separate React frontend and Django API.
- **`PageNumberPagination`** limits responses to 10 products per page to keep the table manageable as inventory grows.
- **`SearchFilter` and `django-filter`** implement product-name search and category filtering on the server instead of loading all products into the browser.
- **Serializer validation** enforces valid prices and stock quantities at the API boundary, even when requests do not originate from the React UI.
- **Axios** centralizes the API base URL and attaches the access token to authenticated requests.
- **TanStack Query** manages API request state and cache invalidation after product changes, so the inventory table refreshes when records are added, edited, or deleted.
- **A reusable product form modal** is used for both creation and editing to avoid duplicating validation and form behavior.
- **A repeatable seed command** makes it easy to set up sample data for development and demonstrations.

## Test login credentials

There are no hard-coded default credentials in the repository. To obtain local test credentials, run `python manage.py createsuperuser` as described above and use the username and password you created. For a shared evaluation environment, provision a dedicated demo account and communicate its credentials securely; do not commit real or production credentials to the public repository.

## Known limitations and possible improvements

With more time, I would:

- Add frontend automated tests with Vitest and React Testing Library.
- Add CI to run backend and frontend checks on each pull request.
- Improve JWT lifecycle handling on the frontend, including automatic access-token refresh and a clearer reauthentication flow.
- Add role-based permissions if the application needs separate administrator and read-only users.
- Add Docker Compose to simplify local setup and provide a reproducible deployment environment.
- Deploy the frontend and backend and document the live application URL.
- Improve accessibility testing, keyboard focus management for dialogs, and end-to-end testing of the full user workflow.

## Security notes

- Never commit `.env`, `frontend/.env.local`, database passwords, private keys, or production secrets.
- The development CORS configuration allows the local Vite origins. Update allowed origins before deploying.
- Use production-appropriate secret management, HTTPS, secure token handling, and `DEBUG=False` when deploying.
