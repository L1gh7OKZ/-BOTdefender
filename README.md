# 🛡️ BOTdefender - Discord ID OSINT & Lookup

Un outil complet, moderne et puissant pour **rechercher des données sur n'importe quel utilisateur ou bot Discord à partir de son identifiant (ID / Snowflake)**.

Disponible sous 4 formes complémentaires :
1. 🌐 **Dashboard Web Interactif** (Thème Discord sombre, prévisualisation d'avatars & bannières HD, graphiques et métadonnées).
2. 📡 **API REST JSON** (`/api/lookup/:id`, `/api/decode/:id`).
3. 🤖 **Bot Discord (discord.js & discord.py)** avec commandes slash `/lookup`, `/check`, `/snowflake` et boutons interactifs.
4. 💻 **Outils CLI en ligne de commande** (Node.js et Python 3).

---

## 🔍 Données récupérables via un ID Discord

Grâce à l'analyse mathématique du **Discord Snowflake (64 bits)** et à l'interrogation de l'**API Discord v10** :

| Donnée | Mode 100% Hors-ligne (Snowflake) | Mode API Discord (avec Token) |
| :--- | :---: | :---: |
| **Date & Heure exacte de création** (UTC & Locale) | ✅ **Oui** (Précision à la milliseconde) | ✅ Oui |
| **Âge précis du compte** (Années, mois, jours) | ✅ **Oui** | ✅ Oui |
| **Tags de temps Discord** (`<t:timestamp:R>`, `<t:timestamp:F>`) | ✅ **Oui** | ✅ Oui |
| **Horodatage interne, Worker ID & Process ID** | ✅ **Oui** | ✅ Oui |
| **Décomposition binaire 64-bit** | ✅ **Oui** | ✅ Oui |
| **Évaluation de sécurité Anti-Raid / Alt Account** | ✅ **Oui** | ✅ **Oui** (Enrichie) |
| **Pseudo & Nom d'affichage (Global Name)** | — | ✅ **Oui** |
| **Avatar HD & Décoration d'avatar** (PNG, WebP, GIF) | Avatar par défaut | ✅ **Oui** (HD 4096px) |
| **Bannière HD & Couleur d'accentuation (Hex)** | — | ✅ **Oui** |
| **Badges publics & Drapeaux officiels** (Staff, Partner, HypeSquad, Dev, Mod...) | — | ✅ **Oui** |
| **Statut Robot vs Humain certifié** | — | ✅ **Oui** |
| **Activité en temps réel & Spotify** (Lanyard) | ✅ Si connecté | ✅ Si connecté |

---

## 🚀 Démarrage Rapide

### 1. Installation des dépendances

```bash
npm install
```

### 2. Configuration (Optionnel)

Créez un fichier `.env` à la racine (ou copiez `.env.example`) :

```env
PORT=3000
HOST=0.0.0.0

# Optionnel : Ajoutez votre token de bot Discord pour récupérer les profils en direct
DISCORD_BOT_TOKEN=votre_token_ici
DISCORD_CLIENT_ID=votre_client_id_ici
BOT_PREFIX=!
```

> **Note :** L'outil fonctionne **parfaitement sans token** grâce au décodeur mathématique Snowflake Discord et aux fallbacks publics. Vous pouvez également entrer un token directement dans l'interface Web ou en argument CLI.

### 3. Lancement du Serveur Web & API

```bash
npm start
```
Ouvrez ensuite votre navigateur sur **`http://localhost:3000`** !

---

## 💻 Utilisation en Ligne de Commande (CLI)

### En Node.js :
```bash
# Recherche simple
node cli/lookup.js 155149108183695360

# Sortie au format JSON brut
node cli/lookup.js 155149108183695360 --json

# Avec token de bot spécifique
node cli/lookup.js 155149108183695360 --token MTAx...
```

### En Python 3 :
```bash
# Recherche simple
python3 cli/lookup.py 155149108183695360

# Sortie JSON
python3 cli/lookup.py 155149108183695360 --json
```

---

## 🤖 Commandes du Bot Discord

### Commandes Slash (Recommandé) :
- `/lookup utilisateur:<ID ou @mention>` : Affiche la fiche d'information complète avec boutons d'assets HD.
- `/check utilisateur:<ID ou @mention>` : Effectue un audit de sécurité Anti-Raid et de réputation pour le compte.
- `/snowflake id:<Snowflake>` : Décompose techniquement les 64 bits du Snowflake.
- `/avatar utilisateur:<ID>` : Affiche l'avatar haute résolution.
- `/banner utilisateur:<ID>` : Affiche la bannière haute résolution.

### Commandes textuelles classiques :
- `!lookup <ID ou @mention>`
- `!check <ID>`
- `!snowflake <ID>`

---

## 📡 Documentation API REST

### `GET /api/lookup/:id`
Récupère l'intégralité des données d'un utilisateur par son ID Discord.
- **Paramètre URL :** `id` (ex: `155149108183695360`)
- **Query param optionnel :** `?token=...` (Token Discord Bot)
- **Exemple de réponse :**
```json
{
  "success": true,
  "source": "discord_api",
  "data": {
    "id": "155149108183695360",
    "user": {
      "username": "example_user",
      "globalName": "Exemple",
      "badges": [
        {
          "id": "HOUSE_BRAVERY",
          "labelFr": "HypeSquad Bravery (Bravoure)",
          "emoji": "🟣"
        }
      ],
      "avatar": {
        "main": "https://cdn.discordapp.com/avatars/155149108183695360/....png?size=1024"
      }
    },
    "snowflake": {
      "createdAtFr": "vendredi 4 mars 2016 à 03:07:09 (UTC)",
      "age": {
        "formattedFr": "10 ans, 6 mois, 15 jours",
        "totalDays": 3851
      }
    },
    "safety": {
      "safetyScore": 100,
      "riskLevel": "LOW",
      "riskLabelFr": "Compte Sûr & Établi"
    }
  }
}
```

### `GET /api/decode/:id`
Décode instantanément et mathématiquement n'importe quel Snowflake Discord (100% sans connexion externe).

### `GET /api/health`
Vérifie l'état de l'API.

---

## 🧪 Tests Unitaires

Pour exécuter la suite de tests unitaires :
```bash
npm test
```

---

## 🛡️ Structure du Projet

```
-BOTdefender/
├── index.js                     # Point d'entrée principal (Web + API + Bot)
├── package.json                 # Dépendances et scripts
├── .env.example                 # Modèle des variables d'environnement
├── src/
│   ├── services/
│   │   ├── snowflakeService.js  # Décodeur mathématique Snowflake Discord
│   │   ├── discordApiService.js # Client API Discord v10 & décodeur de Badges
│   │   ├── lanyardService.js    # Statut en direct, Spotify & activités Lanyard
│   │   └── defenderService.js   # Évaluation de sécurité & score Anti-Raid
│   ├── bot/
│   │   ├── bot.js               # Client Discord.js v14
│   │   └── commands/            # Commandes Discord (/lookup, /check, /snowflake)
│   ├── server/
│   │   ├── api.js               # Routes API REST Express
│   │   └── index.js             # Démarrage du serveur Web
│   └── public/
│       ├── index.html           # Interface Web moderne Discord Dark Theme
│       ├── styles.css           # Feuilles de style Glassmorphism & Discord
│       └── app.js               # Logique frontend interactive
├── cli/
│   ├── lookup.js                # CLI Node.js
│   └── lookup.py                # CLI Python 3
├── python_bot/
│   ├── bot.py                   # Alternative Bot en discord.py
│   └── requirements.txt         # Dépendances Python
└── tests/
    └── test.js                  # Suite de tests unitaires
```

---

## 📜 Licence

Projet open-source sous licence **MIT**. Développé par [L1gh7OKZ](https://github.com/L1gh7OKZ).
