# Whisky Tasting App

Eine Webanwendung zur Organisation und Durchführung von Whisky-Tastings mit Bewertung, Leaderboard und Admin-Funktionen.

## Features

- **Frontend:** React, Vite, React Bootstrap
- **Backend:** Express.js, MongoDB (Atlas), Mongoose
- **Funktionen:**
  - Tasting erstellen und verwalten
  - Teilnehmer können Drams bewerten (Punkte, Notizen, Aromen)
  - Bewertungen werden gespeichert und synchronisiert
  - Leaderboard mit Freigabe durch den Organisator
  - Admin-Setup und PIN-geschützte Orga-Funktionen

## Installation

### Voraussetzungen

- Node.js (empfohlen: LTS)
- npm
- MongoDB Atlas Account

### Setup

1. **Repository klonen:**
   ```bash
   git clone https://github.com/Quovadis1212/whiskytasting-app.git
   cd whiskytasting-app
   ```

2. **Backend konfigurieren:**
   - `.env` Datei in `backend/` anlegen:
     ```
     MONGODB_URI=dein_mongodb_atlas_uri
     JWT_SECRET=dein_geheimes_token
     CORS_ORIGIN=http://localhost:5173
     ```
   - Abhängigkeiten installieren:
     ```bash
     cd backend
     npm install
     ```

3. **Frontend konfigurieren:**
   - Abhängigkeiten installieren:
     ```bash
     cd ../frontend
     npm install
     ```

## Entwicklung

- **Backend starten:**
  ```bash
  cd backend
  npm run dev
  ```
- **Frontend starten:**
  ```bash
  cd frontend
  npm run dev
  ```
- Die App ist erreichbar unter [http://localhost:5173](http://localhost:5173)

## Deployment

- Für Produktion Umgebungsvariablen anpassen und mit z.B. [Vercel](https://vercel.com/) oder [Heroku](https://heroku.com/) deployen.

## API Endpunkte (Auszug)

- `POST /api/tastings` – Neues Tasting erstellen
- `GET /api/tastings/:id` – Tasting-Details abrufen
- `POST /api/tastings/:id/ratings` – Bewertung speichern
- `GET /api/tastings/:id/leaderboard` – Leaderboard abrufen

