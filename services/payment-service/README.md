# Payment Service

Service de gestion des paiements avec Stripe et PayPal pour OrderApp+.

## Fonctionnalités

- **Gestion des Paiements**
  - Création de paiements (Stripe et PayPal)
  - Confirmation des paiements
  - Remboursements
  - Suivi des transactions

- **Intégrations**
  - Stripe Payment Intents
  - PayPal Orders API
  - Webhooks pour les deux fournisseurs

- **Sécurité**
  - Authentification JWT
  - Validation des données
  - Gestion sécurisée des clés API

## Technologies

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de données**: MongoDB + Mongoose
- **Fournisseurs**: Stripe SDK, PayPal SDK
- **Monitoring**: Prometheus, Winston

## Installation

```bash
cd services/payment-service
npm install
```

## Configuration

Créer un fichier `.env`:

```env
NODE_ENV=development
PORT=3004

# MongoDB
MONGODB_URI=mongodb://localhost:27018/payment_db

# JWT
JWT_SECRET=your-jwt-secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
PAYPAL_MODE=sandbox

# External Services
ORDER_SERVICE_URL=http://localhost:3003
NOTIFICATION_SERVICE_URL=http://localhost:3005

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

### Paiements

```bash
# Créer un paiement
POST /api/v1/payments
Authorization: Bearer <token>
{
  "orderId": "uuid",
  "amount": 99.99,
  "currency": "USD",
  "provider": "stripe",
  "paymentMethod": "card"
}

# Confirmer un paiement
POST /api/v1/payments/:id/confirm
Authorization: Bearer <token>
{
  "transactionId": "pi_..."
}

# Rembourser un paiement (admin)
POST /api/v1/payments/:id/refund
Authorization: Bearer <token>
{
  "amount": 50.00,
  "reason": "Customer request"
}

# Lister mes paiements
GET /api/v1/payments?page=1&limit=10&status=completed
Authorization: Bearer <token>

# Détails d'un paiement
GET /api/v1/payments/:id
Authorization: Bearer <token>
```

### Webhooks

```bash
# Stripe webhook
POST /webhooks/stripe
Stripe-Signature: <signature>

# PayPal webhook
POST /webhooks/paypal
```

### Health Check

```bash
GET /health
GET /health/ready
GET /health/live
```

## Providers

### Stripe

- **Payment Intents** pour les paiements
- **Automatic payment methods** activé
- **Webhooks** pour les mises à jour en temps réel

### PayPal

- **Orders API** pour les paiements
- **Sandbox/Live** mode configurable
- **Webhooks** pour les confirmations

## Métriques Prometheus

- `payments_total{provider, status}` - Total des transactions
- `payment_amount_total{provider, currency}` - Montant total traité
- `active_payments{status}` - Paiements actifs
- `http_request_duration_seconds` - Latence des requêtes

## Statuts des Paiements

- `pending` - Paiement créé
- `processing` - En cours de traitement
- `completed` - Paiement réussi
- `failed` - Paiement échoué
- `refunded` - Paiement remboursé
- `cancelled` - Paiement annulé

## Structure

```
payment-service/
├── src/
│   ├── config/          # Configuration
│   ├── models/          # Modèles Mongoose
│   ├── controllers/     # Logique métier
│   ├── providers/       # Stripe & PayPal
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
docker build -t payment-service .

# Run
docker run -p 3004:3004 --env-file .env payment-service
```

## Sécurité

- ✅ Clés API stockées dans variables d'environnement
- ✅ Webhooks avec vérification de signature
- ✅ Rate limiting sur les endpoints
- ✅ Validation des montants
- ✅ Logs des transactions sensibles

## Troubleshooting

**Stripe not configured**
- Vérifier `STRIPE_SECRET_KEY` dans `.env`

**PayPal not configured**
- Vérifier `PAYPAL_CLIENT_ID` et `PAYPAL_CLIENT_SECRET`

**Webhook verification failed**
- Vérifier `STRIPE_WEBHOOK_SECRET` ou PayPal webhook ID

**MongoDB connection error**
- Vérifier `MONGODB_URI`
- S'assurer que MongoDB est démarré
