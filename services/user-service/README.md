# User Service

Service de gestion des utilisateurs et authentification pour OrderApp+.

## Fonctionnalités

- **Authentification**
  - Inscription avec validation email
  - Connexion avec JWT
  - Hashage sécurisé des mots de passe (bcrypt)
  - Changement de mot de passe

- **Gestion Utilisateurs**
  - Profils utilisateurs complets
  - Gestion des adresses multiples
  - Rôles et permissions (user, admin)
  - Suivi de la dernière connexion

- **Administration**
  - CRUD complet pour administrateurs
  - Liste paginée des utilisateurs
  - Statistiques utilisateurs

## Technologies

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de données**: MongoDB + Mongoose
- **Authentification**: JWT + bcryptjs
- **Validation**: Joi
- **Monitoring**: Prometheus, Winston

## Installation

```bash
cd services/user-service
npm install
```

## Configuration

Créer un fichier `.env`:

```env
NODE_ENV=development
PORT=3001

# MongoDB
MONGODB_URI=mongodb://localhost:27017/user_db

# JWT
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=24h

# Logging
LOG_LEVEL=info
```

## Lancement

```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentification

```bash
# Inscription
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890"
}

# Connexion
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}

# Mon profil
GET /api/v1/auth/me
Authorization: Bearer <token>

# Mettre à jour mon profil
PUT /api/v1/auth/me
Authorization: Bearer <token>
{
  "firstName": "Jane",
  "phoneNumber": "+0987654321"
}

# Changer mon mot de passe
PUT /api/v1/auth/password
Authorization: Bearer <token>
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

### Utilisateurs (Admin)

```bash
# Lister tous les utilisateurs
GET /api/v1/users?page=1&limit=10&role=user
Authorization: Bearer <admin-token>

# Détails d'un utilisateur
GET /api/v1/users/:id
Authorization: Bearer <admin-token>

# Créer un utilisateur
POST /api/v1/users
Authorization: Bearer <admin-token>

# Mettre à jour un utilisateur
PUT /api/v1/users/:id
Authorization: Bearer <admin-token>

# Supprimer un utilisateur
DELETE /api/v1/users/:id
Authorization: Bearer <admin-token>
```

### Adresses

```bash
# Ajouter une adresse
POST /api/v1/users/me/addresses
Authorization: Bearer <token>
{
  "street": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "isDefault": true
}

# Mettre à jour une adresse
PUT /api/v1/users/me/addresses/:addressId
Authorization: Bearer <token>

# Supprimer une adresse
DELETE /api/v1/users/me/addresses/:addressId
Authorization: Bearer <token>
```

### Health Check

```bash
GET /health
GET /health/ready
GET /health/live
```

## Modèle de Données

### User

```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  phoneNumber: String,
  role: Enum ['user', 'admin'],
  addresses: [
    {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      isDefault: Boolean
    }
  ],
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

## Sécurité

- ✅ Mots de passe hashés avec bcrypt (10 rounds)
- ✅ JWT avec expiration configurée
- ✅ Validation stricte avec Joi
- ✅ Rate limiting sur les endpoints
- ✅ Helmet pour sécurité HTTP
- ✅ CORS configuré

## Métriques Prometheus

- `user_registrations_total` - Total inscriptions
- `active_users` - Utilisateurs actifs
- `http_request_duration_seconds` - Latence des requêtes
- `http_requests_total` - Total requêtes HTTP

## Structure

```
user-service/
├── src/
│   ├── config/          # Configuration
│   ├── models/          # Modèles Mongoose
│   ├── controllers/     # Logique métier
│   ├── middleware/      # Auth, validation, erreurs
│   ├── routes/          # Routes Express
│   ├── utils/           # Métriques
│   └── server.js        # Point d'entrée
├── package.json
├── Dockerfile
└── .env.example
```

## Tests

```bash
npm test
```

## Docker

```bash
# Build
docker build -t user-service .

# Run
docker run -p 3001:3001 --env-file .env user-service
```

## Troubleshooting

**MongoDB connection error**
- Vérifier `MONGODB_URI` dans `.env`
- S'assurer que MongoDB est démarré
- Vérifier les permissions réseau

**JWT token invalid**
- Vérifier que `JWT_SECRET` est cohérent entre tous les services
- Vérifier l'expiration du token

**Password not matching**
- S'assurer que bcrypt fonctionne correctement
- Vérifier le nombre de rounds (10 par défaut)
