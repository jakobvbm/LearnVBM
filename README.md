# 📚 Lern-App - Interactive Learning Platform

Eine vollständige Lernplattform mit Quest-System, Club-Management und Multi-Subject-Learning für kollaboratives Lernen in Gruppen.

## 🌟 Überblick

Die Lern-App ist eine webbasierte Bildungsplattform, die es Lehrern (Admins) ermöglicht, Lernquests für ihre Schüler zu erstellen und den Fortschritt zu verfolgen. Schüler können in Clubs organisiert werden und durch das Lösen von Aufgaben Punkte sammeln.

## ✨ Hauptfunktionen

### 🔐 Authentifizierung
- **Benutzerregistrierung** mit Benutzername und Passwort
- **Sichere Anmeldung** mit Sitzungsverwaltung
- **Automatische Session-Wiederherstellung** beim Neustart
- **Logout-Funktionalität** mit Bestätigung

### 🏛️ Club-System
- **Club-Erstellung** mit automatisch generiertem oder benutzerdefiniertem Code
- **Club-Beitritt** über 6-stellige Club-Codes
- **Club-Suche** mit Live-Vorschau
- **Club-Verlassen** mit Bestätigung
- **Mitgliederliste** mit Punktestand und Rollen

### 👑 Admin-Management
- **Automatische Admin-Rechte** für Club-Ersteller
- **Admin-Ernennung** durch bestehende Admins
- **Admin-Entfernung** (außer Club-Ersteller)
- **Admin-Panel** mit exklusiven Funktionen
- **Rollenbasierte UI** (Admin-Badge, spezielle Buttons)

### 📋 Quest-System
- **Quest-Erstellung** durch Admins
- **Multi-Subject-Support**: Mathematik, Deutsch, Englisch
- **3 Schwierigkeitsstufen**: Leicht, Mittel, Schwer
- **Flexible Zuweisung**: Alle Mitglieder oder spezifische Auswahl
- **Quest-Fortschritt** mit visueller Fortschrittsanzeige
- **Automatische Punktevergabe** (10 Punkte pro Aufgabe)
- **Quest-Completion-Tracking**

### 🎮 Lernmodi

#### 🧮 Mathematik
- **Leicht**: Addition/Subtraktion (0-10)
- **Mittel**: Grundrechenarten (0-50), Multiplikation (1-12)
- **Schwer**: Erweiterte Operationen (0-100), Division

#### 📝 Deutsch
- **Leicht**: Grundwortschatz, einfache Grammatik
- **Mittel**: Konjugation, Deklination, Adjektive
- **Schwer**: Perfekt, Genitiv, komplexe Grammatik

#### 🇬🇧 English
- **Leicht**: Grundvokabeln, einfache Strukturen
- **Mittel**: Vergangenheitsformen, Komparative
- **Schwer**: Konditionalsätze, Passiv, Gerund

### 🏆 Punkte-System
- **10 Punkte** pro korrekt gelöste Quest-Aufgabe
- **Automatische Punkteberechnung** bei Quest-Abschluss
- **Globale Bestenliste** mit Ranking
- **Club-interne Rangliste** nach Punkten sortiert
- **Echtzeit-Punkteanzeige** in der Kopfzeile

### 📊 Admin-Dashboard
- **Quest-Erstellung** mit detaillierter Konfiguration
- **Fortschritts-Monitoring** aller Club-Mitglieder
- **Admin-Verwaltung** (Befördern/Entfernen)
- **Quest-Status-Übersicht** (Nicht begonnen/In Bearbeitung/Abgeschlossen)
- **Mitglieder-Management** mit Statusanzeige

### 🔔 Benachrichtigungssystem
- **Quest-Notification-Badge** mit Anzahl offener Quests
- **Animierte Benachrichtigungen** (Pulsieren)
- **Tab-Badge** im Quest-Bereich
- **Quest-Modal** für schnellen Zugriff

## 🏗️ Technische Architektur

### Frontend
- **HTML5** mit semantischem Markup
- **CSS3** mit CSS Custom Properties und Flexbox/Grid
- **Vanilla JavaScript** (ES6+) ohne externe Dependencies
- **Responsive Design** für alle Bildschirmgrößen
- **Progressive Web App** Features (Theme Color, Viewport)

### Backend Requirements
- **Python Flask/FastAPI** für REST API
- **SQLite/PostgreSQL** für Datenpersistierung
- **JWT Authentication** für sichere Sessions
- **CORS Support** für Frontend-Integration

### Datenstruktur

#### User Model
```json
{
  "id": "string",
  "username": "string",
  "password_hash": "string",
  "points": "integer",
  "club_id": "string|null",
  "is_admin": "boolean",
  "created_at": "datetime",
  "completed_quests": ["quest_id1", "quest_id2"]
}
```

#### Club Model
```json
{
  "id": "string",
  "name": "string",
  "code": "string (6 chars)",
  "creator_id": "string",
  "members": ["user_id1", "user_id2"],
  "admins": ["user_id1", "user_id3"],
  "created_at": "datetime"
}
```

#### Quest Model
```json
{
  "id": "string",
  "title": "string",
  "subject": "math|german|english",
  "difficulty": "easy|medium|hard",
  "task_count": "integer",
  "created_by": "string",
  "club_id": "string",
  "target_members": ["user_id1", "user_id2"],
  "created_at": "datetime"
}
```

#### QuestProgress Model
```json
{
  "id": "string",
  "quest_id": "string",
  "user_id": "string",
  "progress": "integer",
  "completed": "boolean",
  "completed_at": "datetime|null"
}
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Benutzerregistrierung
- `POST /api/auth/login` - Benutzeranmeldung
- `POST /api/auth/logout` - Benutzerabmeldung
- `GET /api/auth/profile` - Benutzerprofil abrufen

### Clubs
- `POST /api/clubs` - Club erstellen
- `GET /api/clubs/search?code={code}` - Club suchen
- `POST /api/clubs/{id}/join` - Club beitreten
- `POST /api/clubs/{id}/leave` - Club verlassen
- `GET /api/clubs/{id}` - Club-Details und Mitglieder
- `POST /api/clubs/{id}/admins` - Admin hinzufügen/entfernen

### Quests
- `POST /api/quests` - Quest erstellen
- `GET /api/quests/user/{user_id}` - Benutzer-Quests abrufen
- `GET /api/quests/club/{club_id}` - Club-Quests abrufen
- `PUT /api/quests/{id}/progress` - Quest-Fortschritt aktualisieren
- `POST /api/quests/{id}/complete` - Quest abschließen

### Leaderboard
- `GET /api/leaderboard/global` - Globale Bestenliste
- `GET /api/leaderboard/club/{club_id}` - Club-Bestenliste

## 🎨 UI/UX Features

### Design System
- **Gradient-basierte Farbpalette** (Lila/Blau-Töne)
- **Glassmorphism-Effekte** mit Backdrop-Blur
- **Konsistente Border-Radius** (20px für Cards)
- **Schatten-System** für Tiefe
- **Responsive Typography** mit System-Fonts

### Interaktive Elemente
- **Hover-Effekte** auf allen interaktiven Elementen
- **Smooth Transitions** für Zustandsänderungen
- **Loading-Animations** (Spinner)
- **Progress-Bars** mit animierten Füllständen
- **Modal-System** mit Overlay-Effekt

### Accessibility
- **Keyboard-Navigation** (Enter für Antworten)
- **Screen-Reader-freundliche Labels**
- **Hoher Kontrast** für bessere Lesbarkeit
- **Touch-friendly** Button-Größen (min. 44px)

## 📱 Progressive Web App

### PWA Features
- **Responsive Design** für Mobile/Desktop
- **Theme Color** für Browser-Integration
- **Viewport-Optimierung** für Mobile
- **Touch-optimierte UI** mit ausreichenden Tap-Targets

### Performance
- **Lazy Loading** für Quest-Daten
- **Local Storage** für Session-Persistierung
- **Optimierte Animationen** mit CSS Transforms
- **Minimale Dependencies** für schnelle Ladezeiten

## 🚀 Deployment-Pipeline

### GitHub Actions Workflow
```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      
      - name: Build frontend
        run: |
          python build.py
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Build Process
1. **Python Backend** für API-Endpunkte
2. **Frontend Build** mit Asset-Optimierung
3. **Static File Generation** für GitHub Pages
4. **Automatic Deployment** bei Git Push

## 📋 Setup-Anweisungen

### Lokale Entwicklung
```bash
# Repository klonen
git clone https://github.com/username/lern-app.git
cd lern-app

# Backend-Dependencies installieren
pip install -r requirements.txt

# Datenbank initialisieren
python init_db.py

# Development Server starten
python app.py

# Frontend Development (optional)
npm install
npm run dev
```

### Produktions-Deployment
```bash
# Environment Variables setzen
export DATABASE_URL="postgresql://..."
export SECRET_KEY="your-secret-key"
export FLASK_ENV="production"

# Datenbank migrieren
python migrate.py

# Production Server starten
gunicorn app:app
```

## 🔒 Sicherheitsfeatures

### Authentication
- **Password Hashing** mit bcrypt
- **JWT Tokens** für Session-Management
- **CSRF Protection** für Forms
- **Rate Limiting** für API-Endpunkte

### Data Protection
- **Input Sanitization** für alle User-Inputs
- **SQL Injection Prevention** mit Parameterized Queries
- **XSS Protection** mit Content Security Policy
- **Data Validation** auf Frontend und Backend

## 🧪 Testing Strategy

### Frontend Testing
- **Unit Tests** für JavaScript-Funktionen
- **Integration Tests** für API-Calls
- **E2E Tests** mit Cypress/Playwright
- **Visual Regression Tests** für UI-Komponenten

### Backend Testing
- **Unit Tests** für alle API-Endpunkte
- **Database Tests** mit Test-Fixtures
- **Authentication Tests** für Sicherheit
- **Performance Tests** für Skalierbarkeit

## 📈 Analytics & Monitoring

### Tracking
- **User Engagement** (Quest-Completion-Rate)
- **Learning Progress** (Punkteverteilung)
- **Error Tracking** mit Sentry
- **Performance Monitoring** mit Core Web Vitals

### Dashboards
- **Admin Analytics** für Quest-Erfolg
- **User Progress** Visualisierung
- **Club Activity** Monitoring
- **System Health** Checks

## 🔄 Entwicklungsroadmap

### Phase 1 - Core Features ✅
- Basis-Authentication
- Club-System
- Quest-Erstellung
- Grundlegende Lernmodi

### Phase 2 - Enhanced Features
- **Erweiterte Quest-Typen** (Multiple Choice, Drag & Drop)
- **Gamification** (Badges, Achievements, Streaks)
- **Social Features** (Chat, Comments)
- **Mobile App** (React Native/Flutter)

### Phase 3 - Advanced Features
- **KI-basierte Aufgaben** (ChatGPT Integration)
- **Adaptive Learning** (Schwierigkeit basierend auf Performance)
- **Video/Audio Content** (Multimedia-Quests)
- **Offline Mode** (Service Worker)

### Phase 4 - Enterprise Features
- **Multi-Tenancy** (Schulen/Organisationen)
- **Advanced Analytics** (Learning Insights)
- **Integration APIs** (LMS-Konnektoren)
- **White-Label Solutions**

## 🤝 Contribution Guidelines

### Code Standards
- **PEP 8** für Python-Code
- **ESLint** für JavaScript
- **Prettier** für Code-Formatierung
- **Conventional Commits** für Git-Messages

### Pull Request Process
1. Fork das Repository
2. Erstelle Feature Branch (`feature/neue-funktion`)
3. Schreibe Tests für neue Features
4. Dokumentiere Änderungen
5. Erstelle Pull Request mit detaillierter Beschreibung

## 📄 Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei für Details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/username/lern-app/issues)
- **Dokumentation**: [Wiki](https://github.com/username/lern-app/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/username/lern-app/discussions)
- **Email**: support@lern-app.de

---

**Entwickelt mit ❤️ für bessere Bildung**