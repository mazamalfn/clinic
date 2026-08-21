# 🏥 Documentation API - Backend Gestion de Clinique (Supabase)

Bienvenue dans la documentation officielle de l'API REST de gestion de clinique.
Cette API est développée avec **Node.js**, **Express** et connectée à une base de données **Supabase (PostgreSQL)**.

---

## 🛠️ 1. Configuration & Installation de Supabase

### Étape 1 : Créer votre projet Supabase
1. Rendez-vous sur [https://supabase.com](https://supabase.com) et créez un projet.
2. Allez dans **Project Settings** -> **API**.
3. Récupérez vos clés :
   - **Project URL** (ex: `https://xyzcompany.supabase.co`)
   - **service_role key** (clé secrète d'administration backend).

### Étape 2 : Exécuter les scripts SQL de structure et de test
1. Dans le tableau de bord Supabase, ouvrez l'onglet **SQL Editor**.
2. Créez une **New Query** et copiez-collez le contenu du fichier [`supabase/schema.sql`](../supabase/schema.sql) puis cliquez sur **Run**.
3. Créez une seconde requête et exécutez le fichier [`supabase/seed.sql`](../supabase/seed.sql) pour insérer les données initiales de test.

### Étape 3 : Configurer les variables d'environnement backend
Dans le fichier `server/.env` :
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_clinic_jwt_key_change_me_in_production_2026
JWT_EXPIRES_IN=24h
SUPABASE_URL=https://votre-projet.supabase.co
SUPABASE_SERVICE_ROLE_KEY=votre-cle-service-role-supabase
```

### Étape 4 : Lancer le serveur backend
```bash
cd server
npm install
npm run dev
```

---

## 🔑 2. Comptes de Démonstration (Seed)

| Rôle | Email | Mot de passe | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@clinic.com` | `Secretaire123!` | Gestion complète (Personnel, Patients, RDV, Consultations) |
| **Médecin** | `dr.dupont@clinic.com` | `Secretaire123!` | Patients, RDV, Consultations, Ordonnances |
| **Médecin** | `dr.martin@clinic.com` | `Secretaire123!` | Patients, RDV, Consultations, Ordonnances |
| **Secrétaire** | `secretaire@clinic.com` | `Secretaire123!` | Patients, Rendez-vous |

---

## 🔐 3. Authentification & Rôles (RBAC)

Toutes les routes sécurisées nécessitent l'envoi d'un en-tête HTTP **Authorization** avec le jeton JWT révisé lors du login :
```http
Authorization: Bearer <votre_token_jwt>
```

Rôles gérés :
- `admin`
- `medecin`
- `secretaire`

---

## 📑 4. Répertoire des Endpoints API

### 🔑 4.1 Authentification (`/api/auth`)

#### ➔ `POST /api/auth/login`
Authentification d'un membre du personnel de santé.

**Request Body :**
```json
{
  "email": "dr.dupont@clinic.com",
  "mot_de_passe": "Secretaire123!"
}
```

**Response (200 OK) :**
```json
{
  "message": "Connexion réussie",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "user": {
    "id": "d0000000-0000-0000-0000-000000000001",
    "nom": "Dr. Jean Dupont",
    "email": "dr.dupont@clinic.com",
    "role": "medecin"
  }
}
```

#### ➔ `GET /api/auth/me`
Récupère les informations de l'utilisateur connecté via le token Bearer.

---

### 👥 4.2 Gestion du Personnel (`/api/users`) - [Admin uniquement]

- `GET /api/users` : Liste tous les utilisateurs (filtrable par `?role=medecin`).
- `GET /api/users/:id` : Détails d'un utilisateur par UUID.
- `POST /api/users` : Créer un nouvel utilisateur (Nom, Email, Mot de passe, Rôle).
- `PUT /api/users/:id` : Modifier un utilisateur.
- `DELETE /api/users/:id` : Supprimer un compte du personnel.

---

### 🏥 4.3 Patients (`/api/patients`) - [Admin, Médecin, Secrétaire]

#### ➔ `GET /api/patients`
Recherche et liste des patients (filtre optionnel `?q=Kovacs` sur le nom, prénom ou téléphone).

#### ➔ `GET /api/patients/:id`
Dossier médical d'un patient incluant l'historique complet de ses rendez-vous, consultations et prescriptions.

#### ➔ `POST /api/patients`
Création d'un dossier patient.

**Request Body :**
```json
{
  "nom": "Dupont",
  "prenom": "Claire",
  "date_naissance": "1992-06-15",
  "telephone": "+33600112233",
  "adresse": "10 Rue Royale, Paris",
  "antecedents": "Diabète de type 1"
}
```

#### ➔ `PUT /api/patients/:id` & `DELETE /api/patients/:id`

---

### 📅 4.4 Rendez-vous (`/api/appointments`) - [Admin, Médecin, Secrétaire]

#### ➔ `GET /api/appointments`
Liste des rendez-vous avec filtres possibles : `?medecin_id=...`, `?patient_id=...`, `?date=2026-08-21`, `?statut=planifie`.

#### ➔ `POST /api/appointments`
Planifier un rendez-vous.

**Request Body :**
```json
{
  "patient_id": "p0000000-0000-0000-0000-000000000001",
  "medecin_id": "d0000000-0000-0000-0000-000000000001",
  "date_heure": "2026-08-21T14:30:00.000Z",
  "statut": "planifie"
}
```

#### ➔ `PATCH /api/appointments/:id/statut`
Mise à jour rapide du statut (`planifie`, `en_cours`, `honore`, `annule`).

---

### 🩺 4.5 Consultations (`/api/consultations`) - [Admin, Médecin, Secrétaire (lecture)]

#### ➔ `GET /api/consultations`
Liste des consultations médicales rédigées.

#### ➔ `POST /api/consultations`
Création d'une consultation par un médecin.

**Request Body :**
```json
{
  "patient_id": "p0000000-0000-0000-0000-000000000001",
  "medecin_id": "d0000000-0000-0000-0000-000000000001",
  "motif": "Vertiges et migraine",
  "diagnostic": "Syndrome d'épuisement / Tension basse",
  "notes": "Recommander repos et examen sanguin."
}
```

---

### 💊 4.6 Ordonnances & Médicaments (`/api/prescriptions`) - [Admin, Médecin]

#### ➔ `POST /api/prescriptions`
Créer une prescription associée à une consultation avec ses lignes de médicaments.

**Request Body :**
```json
{
  "consultation_id": "c0000000-0000-0000-0000-000000000001",
  "statut": "en_cours",
  "items": [
    {
      "medicament": "Ibuprofène",
      "dosage": "400 mg",
      "frequence": "2 fois par jour au cours des repas",
      "duree": "3 jours"
    },
    {
      "medicament": "Magnésium B6",
      "dosage": "1 gélule",
      "frequence": "Chaque matin",
      "duree": "1 mois"
    }
  ]
}
```

---

### 📊 4.7 Tableau de bord (`/api/dashboard`) - [Tout le personnel authentifié]

#### ➔ `GET /api/dashboard/stats`
Statistiques en temps réel : nombre de patients, médecins, RDV du jour, consultations du jour et liste des prochains rendez-vous.

**Response Body (200 OK) :**
```json
{
  "stats": {
    "totalPatients": 3,
    "totalMedecins": 2,
    "appointmentsToday": 2,
    "consultationsToday": 1
  },
  "upcomingAppointments": [...]
}
```
