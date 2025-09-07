# MAS Case by Case — Production‑Ready Backend (Node.js + Fastify + Prisma)

This is a production‑ready backend for **MAS Case by Case** with authentication, RBAC, case management, duplicate protection, audit logging, and Dockerized Postgres.

## ✅ Features
- Fastify + Prisma (Postgres)
- JWT Auth (access + refresh) with token rotation
- Roles: `admin`, `manager`, `tech`
- **Duplicate prevention**: unique `(orgId, roNumber, vin)` constraint + app‑level check
- Cases, Notes, Attachments metadata
- Users management (admin only)
- Rate limiting on auth
- Dockerized for local/prod
- Seed with demo logins

---

## 🚀 Quick start (Local)

1) **Install dependencies**
```bash
npm install
```

2) **Copy env**
```bash
cp .env.example .env
# generate a long secret and paste as JWT_SECRET
```

3) **Start Postgres + API**
```bash
docker-compose up -d --build
```

4) **Create DB schema & seed**
```bash
npx prisma migrate dev --name init
npm run prisma:seed
```

5) **Run the API (dev)**
```bash
npm run dev
```
API → http://localhost:3000/health

---

## 🔐 Demo logins
By default, the seed creates these accounts in org **MAS**:
- **Admin**: `admin@masdemo.com` / `Admin!234`
- **Manager**: `manager@masdemo.com` / `Manager!234`
- **Tech**: `tech@masdemo.com` / `Tech!234`

> You can override with `.env` using `DEMO_USERS_JSON`:
> ```env
> DEMO_USERS_JSON='[
>   {"email":"admin@yourorg.com","password":"Strong!Pass1","role":"admin","org":"MAS"}
> ]'
> ```

---

## 🔌 API (high‑level)

Auth:
- `POST /api/auth/login` `{ email, password }`
- `POST /api/auth/refresh` header `x-user-id: <userId>` body `{ refreshToken }`
- `POST /api/auth/logout` body `{ refreshToken }`
- `POST /api/auth/signup` *(admin only)*

Cases:
- `GET /api/cases?status=&shopId=&vin=&roNumber=&limit=`
- `POST /api/cases` `{ roNumber, vin, issueType?, priority?, summary?, notes?, shopId? }`
- `GET /api/cases/:id`
- `PATCH /api/cases/:id` *(manager/admin)*

Notes:
- `POST /api/cases/:id/notes` `{ body }`
- `GET /api/cases/:id/notes`

Attachments (metadata only; wire to S3/Cloudflare/R2 later):
- `POST /api/cases/:id/attachments` `{ filePath, mimeType?, size? }`
- `GET /api/cases/:id/attachments`

Users *(admin)*:
- `GET /api/users`
- `PATCH /api/users/:id` `{ role?, isActive? }`

---

## 🧱 Scaling & Ops

- With modest containers, this comfortably serves **400+ users**. Fastify + Postgres are efficient.
- Configure `LOG_LEVEL=info` in prod; ship logs to your stack (ELK/Datadog).
- Use `prisma migrate deploy` in CI/CD for zero‑downtime DB updates.
- Add HTTPS & reverse proxy (NGINX/Traefik) as needed.

---

## 🧩 Connecting your React app

After logging in:
```ts
const res = await fetch('/api/cases', {
  headers: { Authorization: `Bearer ${accessToken}` }
})
```

Refresh flow:
```ts
const res = await fetch('/api/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
  body: JSON.stringify({ refreshToken })
})
```

---

## 📦 Notes
- Attachments here store **metadata** only; plug in S3/Cloudflare R2 and save the storage path.
- Duplicate case protection is enforced at **database** and **API** layers.
- All org data is scoped by `orgId` on queries.

---
