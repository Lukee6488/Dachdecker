# CLAUDE.md — Dachdecker Dashboard (Güldenarm GmbH & Co. KG)

## Projekt-Überblick

Internes Business-Dashboard für **Güldenarm GmbH & Co. KG**, Warendorf. Verwaltet Leads, Aufträge, Termine und Mitarbeiter für ein Dachdecker-/Elektrikerbetrieb. Zwei Rollen: Sekretariat und Projektleiter.

**Live:** https://dachdecker-pied.vercel.app  
**GitHub:** https://github.com/Lukee6488/Dachdecker  
**Backend:** Self-hosted Supabase auf 192.168.0.58 (erreichbar via Cloudflare Tunnel)

---

## Tech Stack

- **React 18** + **TypeScript 5** + **Vite 5**
- **Tailwind CSS 3** + **shadcn/ui** (Radix UI primitives)
- **React Router DOM 6** (Browser Router)
- **Supabase JS 2** (Auth, DB, Realtime)
- **TanStack React Query 5** (Server State)
- **React Hook Form 7** + **Zod** (Formulare & Validierung)
- **Recharts 2** (Charts)
- **@dnd-kit** (Drag & Drop)
- **Sonner** (Toast Notifications)
- **Lucide React** (Icons)

---

## Befehle

```bash
bun dev          # Entwicklungsserver
bun build        # Production Build
bun lint         # ESLint
bun test         # Vitest (Unit)
```

**Deploy:** `git push dachdecker master` → Vercel deployt automatisch via GitHub-Hook.  
**Manuell:** `vercel deploy --prod` (Token in `$env:VERCEL_TOKEN` oder ~/.git-credentials)

---

## Projektstruktur

```
src/
├── context/           # Globale State-Provider
│   ├── AuthContext.tsx       # Auth, Session, Profile
│   ├── LeadsContext.tsx      # Leads CRUD + Realtime
│   ├── OrdersContext.tsx     # Aufträge CRUD + Logs
│   ├── TermineContext.tsx    # Termine CRUD
│   └── EmployeesContext.tsx  # Mitarbeiter CRUD
├── pages/             # Route-Komponenten
│   ├── Login.tsx             # Canvas-Animation + Auth-Form
│   ├── Index.tsx             # Sekretariat-Dashboard (Leads)
│   ├── Auftraege.tsx         # Auftragsverwaltung
│   ├── Termine.tsx           # Wochenkalender (7–16 Uhr)
│   ├── Mitarbeiter.tsx       # Mitarbeiterliste
│   ├── Projektleiter.tsx     # PM-Verwaltung (Admin)
│   ├── Analytics.tsx         # Statistiken
│   ├── Historie.tsx          # Archiv abgeschlossener Aufträge
│   ├── Einstellungen.tsx     # Einstellungen
│   └── projektleiter/        # PM-spezifische Seiten
│       ├── PLDashboard.tsx
│       ├── PLAnalytics.tsx
│       ├── PLHistorie.tsx
│       └── PLKalender.tsx
├── components/
│   ├── DashboardLayout.tsx   # Haupt-Layout (Sidebar + Header)
│   ├── AppSidebar.tsx        # Navigations-Sidebar
│   ├── PLAppSidebar.tsx      # PM-Sidebar
│   ├── ProtectedRoute.tsx    # Rollen-basierter Routenschutz
│   ├── OrdersTable.tsx       # Wiederverwendbare Auftragstabelle
│   ├── KpiCards.tsx          # Dashboard-KPI-Kacheln
│   ├── DashboardCharts.tsx   # Analytics-Charts
│   ├── AddOrderDialog.tsx    # Neuer Auftrag
│   ├── OrderDetailSheet.tsx  # Auftragsdetails
│   ├── AddEmployeeDialog.tsx # Neuer Mitarbeiter
│   ├── AccountSheet.tsx      # Benutzerprofil
│   ├── NotificationsPanel.tsx
│   └── ui/                   # shadcn/ui Komponenten (40+)
├── integrations/supabase/
│   ├── client.ts             # Supabase-Client (liest VITE_* Env)
│   ├── types.ts              # Auto-generierte DB-Typen
│   └── adminClient.ts
├── data/
│   ├── types.ts              # Employee Interface
│   └── mockOrders.ts         # Lead/Order Typen + Kategorien
├── lib/
│   ├── utils.ts              # cn() Tailwind-Helper
│   ├── formatDate.ts         # Datums-Utilities
│   └── orderValidation.ts    # Auftrags-Validierung
└── hooks/
    ├── use-mobile.tsx
    └── use-toast.ts
```

---

## Routing & Rollenschutz

```tsx
// App.tsx — grobe Struktur
<AuthProvider>
  <LeadsProvider>
    <TermineProvider>
      /login              → Login (öffentlich)
      /                   → Index (ProtectedRoute, role: secretary)
      /termine            → Termine
      /analytics          → Analytics
      /historie           → Historie
      /einstellungen      → Einstellungen
      /pl/*               → Projektleiter-Bereich (role: project_manager)
    </TermineProvider>
  </LeadsProvider>
</AuthProvider>
```

`ProtectedRoute` prüft `allowedRoles` und leitet sonst auf `/login` oder die rollenspezifische Startseite um.

---

## Authentifizierung

- **Supabase Auth** (E-Mail + Passwort)
- **Remember Me:** `elk_remember` in localStorage → Session bleibt über Neustarts
- **Ohne Remember Me:** `elk_session` in sessionStorage → Session endet beim Tab-Schließen
- **Profile:** Tabelle `profiles` mit Feldern `display_name` und `role`
- **Rollen:** `secretary` (Standardrolle) | `project_manager`
- Profil wird automatisch bei neuem Auth-User per Trigger erstellt

Login-Credentials (lokale Entwicklung): siehe `ZUGANGSDATEN.txt` (nicht im Repo)

---

## Datenbank (Supabase Self-Hosted)

**Server:** 192.168.0.58 | **Port:** 8000 (Kong Gateway) | **Studio:** :3000

### Tabellen

| Tabelle | Wichtige Felder |
|---|---|
| `profiles` | id, display_name, role (secretary\|project_manager) |
| `leads` | id, name, kontakt, kategorie, nachricht, quelle, datum, status |
| `termine` | id, lead_id, name, datum, uhrzeit, dauer, status, notiz |
| `customers` | id, name, industry |
| `uploads` | id, customer_id, filename, filetype, status |
| `reports` | id, customer_id, status, html_cache |

**Kategorien** (leads.kategorie): Dacharbeiten, Klempnerarbeiten, Elektroinstallation, Wärmedämmung, Fassadenarbeiten, Sanitärinstallation, Sonstiges

**Lead-Status:** Neu | In Bearbeitung | Abgeschlossen | Abgelehnt

**Termin-Status:** Angefragt | Bestätigt | Abgesagt | Erledigt

### Migrations
Liegen in `supabase/migrations/`. Neueste: `20260602000000_gueldenarm_leads.sql`

---

## Environment Variables

Werden in Vercel gesetzt und vom Tunnel-Dienst automatisch aktualisiert:

```env
VITE_SUPABASE_URL=https://<tunnel-url>.trycloudflare.com
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Lokal: `.env` Datei anlegen (wird von `.gitignore` ausgeschlossen):
```env
VITE_SUPABASE_URL=http://192.168.0.58:8000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Infrastruktur

### Vercel
- **Projekt-ID:** `prj_TAzi0JDb94q1Kx9A5GWSv4fdaY9u`
- **Team-ID:** `team_MLqtl2BH3rrtVD5NJUOhNXYN`
- GitHub-Verbindung aktiv → jeder Push auf `master` triggert Auto-Deploy
- Deploy Hook für Tunnel-Restart: in Vercel-Einstellungen hinterlegt

### Supabase Tunnel (Server → Internet)
- Läuft auf `192.168.0.58` als systemd User-Service (`supabase-tunnel.service`)
- Cloudflare Quick Tunnel → neue URL bei Neustart
- Script: `~/supabase-tunnel/start-tunnel.sh`
- Bei URL-Wechsel: Vercel Env-Var wird automatisch aktualisiert + Redeploy getriggert
- Logs: `~/supabase-tunnel/tunnel.log`
- Service verwalten: `systemctl --user [status|restart|stop] supabase-tunnel.service`

### GitHub
- **Remote:** `dachdecker` → `https://github.com/Lukee6488/Dachdecker.git`
- **Branch:** `master`
- Credentials in `~/.git-credentials` (HTTPS mit PAT)

---

## Styling-Konventionen

- **Utility-first** mit Tailwind — keine separaten CSS-Dateien für Komponenten
- **Custom CSS Variables** in `src/index.css` für Brand-Farben + Dark Mode
- **Primärfarbe:** Teal `hsl(174, 72%, 36%)` — Markenfarbe Güldenarm
- **Dark Mode:** via `.dark` Klasse (next-themes)
- **Schrift:** Inter (Google Fonts, 300–800)
- **Login-Klassen:** Präfix `lg-` (z.B. `lg-card`, `lg-input`, `lg-btn`)
- **Animationen:** `slide-from-left`, `slide-from-right` in index.css
- Login-Canvas-Animation: Gauss-Zonen (finanz-dashboard-Stil), langsame Drift

---

## Konventionen & Muster

- **Sprache:** Deutsch durchgehend (UI, Variablen, Commits)
- **Komponenten:** PascalCase, funktional mit Hooks
- **State:** Context API für globalen State, React Query für Server-State
- **Formulare:** React Hook Form + Zod-Schema-Validierung
- **Modals:** Dialog für Erstellen/Bearbeiten, Sheet für Detailansichten, AlertDialog für Löschen
- **Echtzeit:** Supabase Realtime-Channels (`postgres_changes`)
- **Optimistic Updates:** UI-Update vor DB-Bestätigung, Rollback bei Fehler
- **Fehler:** `console.error` + Toast für User-Feedback
- **IDs:** UUID (`gen_random_uuid()`) für alle Primärschlüssel

---

## Was NICHT committen

- `.env` Dateien
- `ZUGANGSDATEN.txt`
- `node_modules/`, `dist/`
- `.vercel/`
- `.claude/`
