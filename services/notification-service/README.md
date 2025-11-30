# Notification Service

Service de gestion des notifications et emails pour OrderApp+.

## Fonctionnalités

- **Gestion des Notifications**
  - Queue Redis pour traitement asynchrone
  - Retry automatique en cas d'échec
  - Monitoring des notifications échouées

- **Email**
  - Templates Handlebars
  - Support SMTP
  - Multiples types d'emails (confirmation commande, expédition, livraison, paiement, bienvenue)

- **Queue Processing**
  - Worker background pour traitement
  - Gestion des retry avec délai
  - Métriques de performance

## Technologies

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Queue**: Redis
- **Email**: Nodemailer + Handlebars
- **Monitoring**: Prometheus, Winston

## Installation

```bash
cd services/notification-service
npm install
```

## Configuration

Créer un fichier `.env`:

```env
NODE_ENV=development
PORT=3005

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@orderapp.com

# JWT
JWT_SECRET=your-jwt-secret

# Queue
QUEUE_MAX_RETRIES=3
QUEUE_RETRY_DELAY=5000

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

### Notifications

```bash
# Envoyer une notification (via queue)
POST /api/v1/notifications
{
  "to": "user@example.com",
  "type": "order_confirmation",
  "data": {
    "customerName": "John Doe",
    "orderNumber": "ORD-123",
    "orderDate": "2024-01-15",
    "status": "confirmed",
    "totalAmount": "99.99",
    "items": [...],
    "shippingAddress": {...}
  }
}

# Envoyer un email direct
POST /api/v1/notifications/email
{
  "to": "user@example.com",
  "subject": "Your Order",
  "template": "order-confirmation",
  "data": {...}
}

# Stats de la queue (admin)
GET /api/v1/notifications/queue/stats
Authorization: Bearer <token>

# Notifications échouées (admin)
GET /api/v1/notifications/failed
Authorization: Bearer <token>

# Retry notification échouée (admin)
POST /api/v1/notifications/failed/:id/retry
Authorization: Bearer <token>
```

### Health Check

```bash
GET /health
GET /health/ready
GET /health/live
```

## Types de Notifications

### order_confirmation
Confirmation de commande avec détails complets.

### order_shipped
Notification d'expédition avec tracking.

### order_delivered
Confirmation de livraison.

### payment_confirmation
Confirmation de paiement avec détails transaction.

### welcome
Email de bienvenue pour nouveaux utilisateurs.

## Templates Email

Tous les templates sont dans `src/templates/` et utilisent Handlebars:

- `order-confirmation.hbs`
- `order-shipped.hbs`
- `order-delivered.hbs`
- `payment-confirmation.hbs`
- `welcome.hbs`

## Queue Redis

### Clés Redis

- `notification:queue` - Queue principale
- `notification:processing` - Notifications en traitement
- `notification:failed` - Notifications échouées

### Flow

1. Notification ajoutée à la queue
2. Worker récupère et traite
3. Si succès: marquée comme complétée
4. Si échec: retry jusqu'à max retries
5. Après max retries: déplacée vers failed

## Métriques Prometheus

- `emails_sent_total{status}` - Total emails envoyés
- `email_queue_length` - Taille de la queue
- `notification_processing_time_seconds` - Temps de traitement
- `http_request_duration_seconds` - Latence des requêtes

## Structure

```
notification-service/
├── src/
│   ├── config/          # Configuration
│   ├── services/        # Email & Queue
│   ├── controllers/     # Logique métier
│   ├── middleware/      # Auth, validation, erreurs
│   ├── routes/          # Routes Express
│   ├── templates/       # Templates Handlebars
│   ├── workers/         # Queue processor
│   ├── utils/           # Métriques
│   └── server.js        # Point d'entrée
├── package.json
├── Dockerfile
└── .env.example
```

## Worker Background

Le worker `queueProcessor.js`:
- Démarre automatiquement avec le serveur
- Traite les notifications de manière continue
- Gère les retries automatiquement
- S'arrête proprement lors du shutdown

## Tests

```bash
npm test
```

## Docker

```bash
# Build
docker build -t notification-service .

# Run
docker run -p 3005:3005 --env-file .env notification-service
```

## Configuration Gmail

Pour utiliser Gmail:

1. Activer "App Passwords" dans votre compte Google
2. Utiliser le mot de passe d'application dans `SMTP_PASSWORD`

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password-here
```

## Troubleshooting

**Redis connection error**
- Vérifier `REDIS_HOST` et `REDIS_PORT`
- S'assurer que Redis est démarré

**Email not sending**
- Vérifier configuration SMTP
- Tester avec `verifyEmailConnection()`
- Vérifier les logs pour erreurs SMTP

**Queue not processing**
- Vérifier que le worker est démarré
- Consulter `GET /api/v1/notifications/queue/stats`
- Vérifier les logs du worker

**Template not found**
- S'assurer que le template existe dans `src/templates/`
- Vérifier le nom du template (sans extension .hbs)
