# Order Service

Service de gestion des commandes et paniers pour OrderApp+.

## Fonctionnalités

- **Gestion des Commandes**
  - Création de commandes avec validation produits
  - Suivi du statut (pending → confirmed → processing → shipped → delivered)
  - Historique des commandes
  - Annulation de commandes

- **Panier d'Achat**
  - Ajouter/Modifier/Supprimer des articles
  - Récupération enrichie avec détails produits
  - Calcul automatique des totaux
  - Vider le panier

- **Intégrations**
  - Communication avec Product Service (validation stock)
  - Communication avec Payment Service (confirmation paiement)
  - Communication avec Notification Service (emails)

## Technologies

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Base de données**: PostgreSQL + Sequelize
- **Communication**: Axios pour inter-service
- **Validation**: Joi
- **Monitoring**: Prometheus, Winston

## Installation

```bash
cd services/order-service
npm install
```

## Configuration

Créer un fichier `.env`:

```env
NODE_ENV=development
PORT=3003

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=order_db
DB_USER=order_user
DB_PASSWORD=order_pass

# JWT
JWT_SECRET=your-jwt-secret

# External Services
PRODUCT_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3004
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

### Commandes

```bash
# Créer une commande
POST /api/v1/orders
Authorization: Bearer <token>
{
  "items": [
    {
      "productId": "uuid",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "credit_card",
  "notes": "Optional notes"
}

# Mes commandes
GET /api/v1/orders?page=1&limit=10&status=confirmed
Authorization: Bearer <token>

# Détails d'une commande
GET /api/v1/orders/:id
Authorization: Bearer <token>

# Mettre à jour le statut (admin)
PUT /api/v1/orders/:id/status
Authorization: Bearer <admin-token>
{
  "status": "shipped"
}

# Annuler une commande
POST /api/v1/orders/:id/cancel
Authorization: Bearer <token>
```

### Panier

```bash
# Mon panier
GET /api/v1/cart
Authorization: Bearer <token>

# Ajouter au panier
POST /api/v1/cart/items
Authorization: Bearer <token>
{
  "productId": "uuid",
  "quantity": 1
}

# Modifier quantité
PUT /api/v1/cart/items/:itemId
Authorization: Bearer <token>
{
  "quantity": 3
}

# Retirer du panier
DELETE /api/v1/cart/items/:itemId
Authorization: Bearer <token>

# Vider le panier
DELETE /api/v1/cart
Authorization: Bearer <token>
```

### Health Check

```bash
GET /health
GET /health/ready
GET /health/live
```

## Modèles de Données

### Order

```javascript
{
  id: UUID,
  userId: String,
  orderNumber: String (unique),
  status: Enum ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
  totalAmount: Decimal,
  shippingAddress: JSONB,
  paymentMethod: String,
  paymentStatus: Enum ['pending', 'completed', 'failed', 'refunded'],
  paymentId: String,
  notes: Text,
  shippedAt: Date,
  deliveredAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### OrderItem

```javascript
{
  id: UUID,
  orderId: UUID (FK),
  productId: UUID,
  productName: String,
  productSku: String,
  quantity: Integer,
  price: Decimal,
  subtotal: Decimal,
  createdAt: Date,
  updatedAt: Date
}
```

### Cart / CartItem

```javascript
Cart {
  id: UUID,
  userId: String (unique),
  createdAt: Date,
  updatedAt: Date
}

CartItem {
  id: UUID,
  cartId: UUID (FK),
  productId: UUID,
  quantity: Integer,
  createdAt: Date,
  updatedAt: Date
}
```

## Statuts de Commande

1. **pending** - Commande créée, en attente de paiement
2. **confirmed** - Paiement confirmé
3. **processing** - En cours de préparation
4. **shipped** - Expédiée (shippedAt défini)
5. **delivered** - Livrée (deliveredAt défini)
6. **cancelled** - Annulée

## Transactions

La création de commande utilise des transactions Sequelize pour garantir l'intégrité:
- Validation des produits (stock, disponibilité)
- Création de l'Order
- Création des OrderItems
- Commit ou Rollback automatique

## Communication Inter-Service

### Product Service
- Validation des produits avant création commande
- Vérification du stock disponible
- Récupération des détails produits pour le panier

### Payment Service
- Notification après création de commande
- Vérification du statut de paiement

### Notification Service
- Email de confirmation commande
- Email de tracking expédition
- Email de confirmation livraison

## Métriques Prometheus

- `orders_created_total{status}` - Total commandes créées
- `cart_operations_total{operation}` - Total opérations panier
- `active_orders{status}` - Commandes actives par statut
- `http_request_duration_seconds` - Latence des requêtes

## Structure

```
order-service/
├── src/
│   ├── config/          # Configuration
│   ├── models/          # Modèles Sequelize
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
docker build -t order-service .

# Run
docker run -p 3003:3003 --env-file .env order-service
```

## Troubleshooting

**Database connection error**
- Vérifier PostgreSQL est démarré
- Vérifier credentials dans `.env`
- Vérifier le port (5432 par défaut)

**Product validation failed**
- Vérifier que Product Service est accessible
- Vérifier `PRODUCT_SERVICE_URL`
- Vérifier le token JWT est bien passé

**Order creation failed**
- Vérifier le stock des produits
- Consulter les logs de transaction
- Vérifier les données du shipping address
