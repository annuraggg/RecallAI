# RecallAI
The Production Version is Deployed and Accessible at [https://recallai.anuragsawant.in](https://recallai.anuragsawant.in)

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

Screenshots:
<img width="1919" height="908" alt="image" src="https://github.com/user-attachments/assets/f002661a-7018-4cd5-aab9-73ca3eabf1b7" />

<img width="1919" height="909" alt="image" src="https://github.com/user-attachments/assets/8b98ff37-7e47-4621-8534-01801729c5c0" />

<img width="1919" height="913" alt="image" src="https://github.com/user-attachments/assets/c1853013-1559-4e1d-a621-687dad00c55f" />

<img width="1919" height="910" alt="image" src="https://github.com/user-attachments/assets/06c0861a-1ddf-4d77-813f-d6bfd7f780c5" />

<img width="1919" height="915" alt="image" src="https://github.com/user-attachments/assets/3f62df87-b6ca-4845-840f-479ab5f6f769" />

<img width="1919" height="908" alt="image" src="https://github.com/user-attachments/assets/950e8377-4a78-4a3e-bd74-ed0e64065532" />

<img width="1919" height="1020" alt="image" src="https://github.com/user-attachments/assets/f31e346e-3446-4fa9-a40f-31db2be91b79" />

<img width="1919" height="905" alt="image" src="https://github.com/user-attachments/assets/cdb59d03-ced4-4c7a-b50f-7bb0e5f0142d" />

<img width="1919" height="919" alt="image" src="https://github.com/user-attachments/assets/ef9bc08e-4be1-4556-a6a2-4976b85bb6dc" />

<img width="1919" height="911" alt="image" src="https://github.com/user-attachments/assets/77b0e11d-68b5-476b-bf2c-6d64d15488fb" />

<img width="1919" height="910" alt="image" src="https://github.com/user-attachments/assets/a361a66c-0989-473a-afec-92a96bd8e00e" />

<img width="1919" height="911" alt="image" src="https://github.com/user-attachments/assets/debb1dbd-52b2-4547-8ae4-96e1463e3ab1" />












