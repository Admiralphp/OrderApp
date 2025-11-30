# 🚀 Configuration Complète du Projet OrderApp+

## ✅ État Actuel

### Branches Créées
- ✅ `main` - Branche de production
- ✅ `develop` - Branche de staging
- ✅ `feature/example-feature` - Exemple de branche feature
- ✅ `hotfix/example-hotfix` - Exemple de branche hotfix

### Fichiers de Configuration GitHub
- ✅ `.github/workflows/ci-cd.yml` - Pipeline CI/CD complet
- ✅ `.github/BRANCH_PROTECTION.md` - Instructions de protection des branches
- ✅ `.github/CODEOWNERS` - Propriétaires du code
- ✅ `.github/pull_request_template.md` - Template pour les PRs
- ✅ `.github/dependabot.yml` - Mises à jour automatiques des dépendances

---

## 📋 Prochaines Étapes à Suivre sur GitHub

### 1️⃣ Configurer les Règles de Protection des Branches

👉 **Rendez-vous sur:** https://github.com/Admiralphp/OrderApp/settings/branches

#### Pour `main` (Production):
1. Cliquer sur **Add branch protection rule**
2. Branch name pattern: `main`
3. Cocher:
   - ✅ Require a pull request before merging (2 approvals)
   - ✅ Require status checks to pass before merging
   - ✅ Require conversation resolution before merging
   - ✅ Require linear history
   - ✅ Include administrators
4. Status checks requis:
   - `lint (user-service)`
   - `lint (product-service)`
   - `lint (order-service)`
   - `lint (payment-service)`
   - `lint (notification-service)`
   - `test`
   - `security-scan`
   - `build`

#### Pour `develop` (Staging):
1. Cliquer sur **Add branch protection rule**
2. Branch name pattern: `develop`
3. Cocher:
   - ✅ Require a pull request before merging (1 approval)
   - ✅ Require status checks to pass before merging
   - ✅ Require conversation resolution before merging
4. Status checks requis (mêmes que main)

---

### 2️⃣ Configurer les Environments

👉 **Rendez-vous sur:** https://github.com/Admiralphp/OrderApp/settings/environments

#### Environment: `staging`
1. Cliquer sur **New environment**
2. Nom: `staging`
3. Deployment branches: `develop` seulement
4. Ajouter les secrets:
   - `KUBECONFIG_STAGING`

#### Environment: `production`
1. Nom: `production`
2. Deployment branches: `main` seulement
3. Required reviewers: 2+ personnes
4. Wait timer: 5 minutes
5. Ajouter les secrets:
   - `KUBECONFIG_PRODUCTION`

---

### 3️⃣ Configurer les Secrets du Repository

👉 **Rendez-vous sur:** https://github.com/Admiralphp/OrderApp/settings/secrets/actions

#### Secrets à ajouter:

**1. KUBECONFIG_STAGING**
```bash
# Générer le secret
cat ~/.kube/config-staging | base64 -w 0 > kubeconfig-staging.txt
# Copier le contenu et l'ajouter sur GitHub
```

**2. KUBECONFIG_PRODUCTION**
```bash
# Générer le secret
cat ~/.kube/config-production | base64 -w 0 > kubeconfig-production.txt
# Copier le contenu et l'ajouter sur GitHub
```

**3. SLACK_WEBHOOK_URL**
1. Aller sur https://api.slack.com/apps
2. Créer une app → Incoming Webhooks
3. Activer et ajouter au workspace
4. Copier l'URL du webhook
5. Format: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX`

**4. CODECOV_TOKEN** (optionnel si repo public)
1. Aller sur https://codecov.io
2. Lier le repository
3. Copier le token
4. Ajouter sur GitHub

---

### 4️⃣ Activer Dependabot

👉 **Rendez-vous sur:** https://github.com/Admiralphp/OrderApp/settings/security_analysis

1. Activer **Dependabot alerts**
2. Activer **Dependabot security updates**
3. Le fichier `dependabot.yml` est déjà configuré ✅

Dependabot va maintenant:
- 📅 Vérifier les dépendances tous les lundis (GitHub Actions)
- 📅 Vérifier les dépendances npm tous les mardis (tous les services)
- 📅 Vérifier les images Docker tous les mercredis
- 🔒 Créer des PRs automatiquement pour les mises à jour de sécurité

---

## 🔄 Workflow de Développement

### Créer une Feature

```bash
# 1. Partir de develop
git checkout develop
git pull origin develop

# 2. Créer la branche feature
git checkout -b feature/ma-nouvelle-fonctionnalite

# 3. Développer et commiter
git add .
git commit -m "feat: add new feature"

# 4. Pousser la branche
git push origin feature/ma-nouvelle-fonctionnalite

# 5. Créer une Pull Request sur GitHub vers develop
```

### Créer un Hotfix

```bash
# 1. Partir de main
git checkout main
git pull origin main

# 2. Créer la branche hotfix
git checkout -b hotfix/correction-critique

# 3. Corriger le bug
git add .
git commit -m "fix: resolve critical issue"

# 4. Pousser la branche
git push origin hotfix/correction-critique

# 5. Créer des Pull Requests sur GitHub:
#    - Une vers main (production)
#    - Une vers develop (staging)
```

### Déployer en Staging

```bash
# Merge de feature vers develop via PR
# → Déclenche automatiquement le déploiement sur staging
```

### Déployer en Production

```bash
# 1. S'assurer que develop est stable
# 2. Créer PR de develop vers main
# 3. Attendre 2 approvals
# 4. Merger
# → Déclenche automatiquement le déploiement en production
```

---

## 🎯 Ce qui est Automatisé

### Sur Push Feature Branch
✅ Lint (tous les services en parallèle)
✅ Tests avec couverture
✅ Scan de sécurité (Trivy + NPM Audit)

### Sur Pull Request
✅ Tout ce qui est ci-dessus
✅ Vérification des règles de protection
✅ Review obligatoire

### Sur Merge vers Develop
✅ Tout ce qui est ci-dessus
✅ Build des images Docker
✅ Push vers GitHub Container Registry
✅ Déploiement automatique sur staging
✅ Tests de smoke sur staging

### Sur Merge vers Main
✅ Tout ce qui est ci-dessus
✅ Déploiement automatique en production
✅ Tests de smoke en production
✅ Notification Slack (succès/échec)
✅ Wait timer de 5 minutes (sécurité)

---

## 📊 Monitoring du Pipeline

### GitHub Actions
- **Voir tous les workflows:** https://github.com/Admiralphp/OrderApp/actions
- **Badges de statut:** Ajouter au README principal
  ```markdown
  ![CI/CD Pipeline](https://github.com/Admiralphp/OrderApp/workflows/CI%2FCD%20Pipeline/badge.svg)
  ```

### Codecov
- **Dashboard:** https://codecov.io/gh/Admiralphp/OrderApp
- **Coverage par service**
- **Tendances de couverture**

### GitHub Security
- **Alerts:** https://github.com/Admiralphp/OrderApp/security
- **Dependabot PRs**
- **Code scanning (Trivy)**

---

## 🔍 Vérification de la Configuration

### Test 1: Feature Branch
```bash
git checkout -b feature/test-workflow
echo "test" > test.txt
git add test.txt
git commit -m "test: verify workflow"
git push origin feature/test-workflow
```
✅ **Attendu:** Workflow déclenché avec lint + test uniquement

### Test 2: Pull Request vers Develop
- Créer une PR de `feature/test-workflow` vers `develop` sur GitHub
✅ **Attendu:** Tous les checks doivent passer, 1 approval requis

### Test 3: Merge vers Develop
- Merger la PR
✅ **Attendu:** Full pipeline + déploiement staging

### Test 4: Pull Request vers Main
- Créer une PR de `develop` vers `main`
✅ **Attendu:** 2 approvals requis, tous les checks doivent passer

### Test 5: Merge vers Main
- Merger la PR (après approvals)
✅ **Attendu:** Full pipeline + déploiement production + notification Slack

---

## 📚 Documentation de Référence

- 📖 [CI/CD Pipeline README](.github/workflows/README.md)
- 📖 [Branch Protection Guide](.github/BRANCH_PROTECTION.md)
- 📖 [Architecture Overview](docs/architecture-overview.md)
- 📖 [API Design](docs/api-design.md)
- 📖 [Agile Backlog](docs/agile-backlog.md)
- 📖 [Main README](README.md)

---

## 🎓 Formation Équipe

### Pour les Développeurs
1. Lire la [documentation du workflow](#-workflow-de-développement)
2. Comprendre la [stratégie de branches](#-ce-qui-est-automatisé)
3. Utiliser le [template de PR](.github/pull_request_template.md)

### Pour les DevOps
1. Configurer les [secrets Kubernetes](#3️⃣-configurer-les-secrets-du-repository)
2. Configurer les [environments](#2️⃣-configurer-les-environments)
3. Monitorer les [pipelines](#-monitoring-du-pipeline)

### Pour les Reviewers
1. Vérifier le [CODEOWNERS](.github/CODEOWNERS)
2. Suivre le [template de PR](.github/pull_request_template.md)
3. S'assurer que tous les checks passent

---

## ✅ Checklist Finale

Configuration GitHub:
- [ ] Règles de protection `main` configurées
- [ ] Règles de protection `develop` configurées
- [ ] Environment `staging` créé avec secrets
- [ ] Environment `production` créé avec reviewers
- [ ] Secret `KUBECONFIG_STAGING` ajouté
- [ ] Secret `KUBECONFIG_PRODUCTION` ajouté
- [ ] Secret `SLACK_WEBHOOK_URL` ajouté
- [ ] Secret `CODECOV_TOKEN` ajouté (optionnel)
- [ ] Dependabot activé
- [ ] CODEOWNERS configuré

Tests:
- [ ] Workflow testé sur feature branch
- [ ] PR vers develop testée
- [ ] Déploiement staging testé
- [ ] PR vers main testée
- [ ] Déploiement production testé
- [ ] Notification Slack testée

Documentation:
- [ ] Équipe formée sur le workflow
- [ ] Documentation lue et comprise
- [ ] Contacts définis pour support

---

## 🆘 Support

Pour toute question:
1. Consulter la [documentation](.github/workflows/README.md)
2. Vérifier les [issues GitHub](https://github.com/Admiralphp/OrderApp/issues)
3. Contacter l'équipe DevOps

---

**Projet:** OrderApp+ Microservices Platform
**Repository:** https://github.com/Admiralphp/OrderApp
**Date de configuration:** 30 Novembre 2025
