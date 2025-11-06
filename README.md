# 🧠 RecallAI — Full Stack Application

This project consists of:
- **Backend:** Django REST API served via Gunicorn & Nginx
- **Frontend:** Vite + React client app
- **Database:** PostgreSQL


##  Prerequisites

Make sure you have these installed:
- [Miniconda or Anaconda](https://docs.conda.io/en/latest/miniconda.html)
- [Node.js (>= 18)](https://nodejs.org/)
- [PostgreSQL (>= 14)](https://www.postgresql.org/download/)
- Git


## Backend Setup (Django)

### Create & Activate Conda Environment
```bash
conda create -n recallai python=3.11
conda activate recallai
```

### Install Dependencies
```bash
cd server
pip install -r requirements.txt
```

### Create PostgreSQL Database
Launch psql shell and type in the following command:
```bash
CREATE DATAABASE recallai;
```

### Django Configuration
In the server/ folder, create a .env file:

```bash
GEMINI_API_KEY=your-api-key
SECRET_KEY=your-secret-key-here

# PostgreSQL Database Configuration
POSTGRES_DB=recallai
POSTGRES_USER=your-postgres-username
POSTGRES_PASSWORD=your-postgress-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Django Debug Mode (set to False in production)
DEBUG=True

ALLOWED_HOSTS=localhost,127.0.0.1
```

### Run Django Backend
Apply migrations and run the server:
```bash
python manage.py migrate
python manage.py runserver
```

The backend is now running on http://127.0.0.1:8000

## Frontend Setup
In another terminal, do the following:

### Install Dependencies
```bash
cd ../client
npm install
```

### Initialize Environment Variables
Create a .env file inside the client folder and add the following to it:
```bash
VITE_API_BASE_URL =http://localhost:8000/api
```

### Run The Frontend Server
```bash
npm run dev
```

Your frontend will start at http://127.0.0.1:5173



