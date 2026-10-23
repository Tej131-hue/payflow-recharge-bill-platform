# PayFlow — Recharge & Bill Payment Platform

A modern full-stack demo platform for mobile recharge and utility bill payments.

## Stack
- Next.js + TypeScript + Tailwind CSS
- FastAPI + Python
- PostgreSQL
- SQLAlchemy
- REST APIs
- Mock payment processing

## Features
- Dashboard with spending/payment statistics
- Mobile recharge and utility bill payment forms
- Transaction history
- Mock success/failure payment flow
- REST API backend
- PostgreSQL persistence via Docker Compose

> This project uses a mock payment gateway. It does not process real money.

## Run locally

### 1. Start PostgreSQL
```bash
docker compose up -d db
```

### 2. Backend
```bash
cd backend
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
Backend: http://localhost:8000
Docs: http://localhost:8000/docs

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend: http://localhost:3000

## Git
```bash
git init
git add .
git commit -m "feat: build PayFlow recharge and bill payment platform"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```
