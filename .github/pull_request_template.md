# Pull Request Template

## 📝 Description

<!-- Décrivez brièvement les changements apportés -->

## 🎯 Type de changement

- [ ] 🐛 Bug fix (changement qui corrige un problème)
- [ ] ✨ Nouvelle fonctionnalité (changement qui ajoute une fonctionnalité)
- [ ] 💥 Breaking change (correction ou fonctionnalité qui cassera les fonctionnalités existantes)
- [ ] 📝 Documentation (changements dans la documentation uniquement)
- [ ] 🔧 Configuration (changements dans les fichiers de configuration)
- [ ] ♻️ Refactoring (changement de code qui ne corrige pas de bug et n'ajoute pas de fonctionnalité)
- [ ] ⚡ Performance (changement qui améliore les performances)
- [ ] ✅ Tests (ajout ou correction de tests)

## 🔗 Issue liée

<!-- Si applicable, référencez l'issue: Closes #123 -->

## 📋 Checklist

### Code Quality
- [ ] Mon code suit les conventions de style du projet
- [ ] J'ai effectué une auto-revue de mon code
- [ ] J'ai commenté mon code, particulièrement dans les zones complexes
- [ ] J'ai fait les changements correspondants dans la documentation
- [ ] Mes changements ne génèrent pas de nouveaux warnings
- [ ] Le code compile sans erreurs

### Tests
- [ ] J'ai ajouté des tests qui prouvent que ma correction est efficace ou que ma fonctionnalité fonctionne
- [ ] Les tests unitaires nouveaux et existants passent localement avec mes changements
- [ ] Tous les tests passent sur la CI

### Security
- [ ] J'ai vérifié qu'aucune information sensible n'est exposée (mots de passe, clés API, etc.)
- [ ] J'ai validé les entrées utilisateur si applicable
- [ ] Les dépendances ajoutées sont sûres (npm audit pass)

### Documentation
- [ ] J'ai mis à jour le README si nécessaire
- [ ] J'ai mis à jour la documentation API si des endpoints ont changé
- [ ] J'ai ajouté/mis à jour les commentaires JSDoc

### Deployment
- [ ] Les variables d'environnement nécessaires sont documentées
- [ ] Les migrations de base de données sont incluses si nécessaire
- [ ] Le fichier .env.example est à jour
- [ ] Les secrets Kubernetes sont documentés si nécessaire

## 🧪 Comment tester

<!-- Décrivez les étapes pour tester vos changements -->

1. 
2. 
3. 

## 📸 Screenshots (si applicable)

<!-- Ajoutez des captures d'écran pour les changements UI -->

## 🔄 Impact

### Services impactés
- [ ] user-service
- [ ] product-service
- [ ] order-service
- [ ] payment-service
- [ ] notification-service
- [ ] Infrastructure
- [ ] CI/CD

### Breaking Changes
<!-- Listez les breaking changes si applicable -->

## 📊 Performance

<!-- Si applicable, décrivez l'impact sur les performances -->

- Temps de réponse: 
- Utilisation mémoire: 
- Utilisation CPU: 

## 🚀 Post-deployment

<!-- Actions à effectuer après le déploiement -->

- [ ] Vérifier les logs
- [ ] Vérifier les métriques Prometheus
- [ ] Tester les endpoints impactés
- [ ] Notifier l'équipe

## 💡 Notes supplémentaires

<!-- Toute information supplémentaire pour les reviewers -->
