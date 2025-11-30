# Branch Protection Rules Configuration

## Instructions pour configurer les règles de protection des branches sur GitHub

### 1. Accéder aux paramètres
1. Aller sur https://github.com/Admiralphp/OrderApp
2. Cliquer sur **Settings** → **Branches**
3. Cliquer sur **Add branch protection rule**

---

## 📌 Protection pour `main` (Production)

### Règle: `main`

**Branch name pattern:** `main`

#### Protections requises:

✅ **Require a pull request before merging**
- Require approvals: **2**
- Dismiss stale pull request approvals when new commits are pushed
- Require review from Code Owners (optionnel)

✅ **Require status checks to pass before merging**
- Require branches to be up to date before merging
- Status checks required:
  - `lint (user-service)`
  - `lint (product-service)`
  - `lint (order-service)`
  - `lint (payment-service)`
  - `lint (notification-service)`
  - `test`
  - `security-scan`
  - `build`

✅ **Require conversation resolution before merging**

✅ **Require signed commits** (recommandé)

✅ **Require linear history**

✅ **Include administrators** (appliquer les règles aux admins)

✅ **Restrict who can push to matching branches**
- Limiter aux: DevOps team, Release managers

✅ **Allow force pushes** → ❌ Désactivé

✅ **Allow deletions** → ❌ Désactivé

---

## 📌 Protection pour `develop` (Staging)

### Règle: `develop`

**Branch name pattern:** `develop`

#### Protections requises:

✅ **Require a pull request before merging**
- Require approvals: **1**
- Dismiss stale pull request approvals when new commits are pushed

✅ **Require status checks to pass before merging**
- Require branches to be up to date before merging
- Status checks required:
  - `lint (user-service)`
  - `lint (product-service)`
  - `lint (order-service)`
  - `lint (payment-service)`
  - `lint (notification-service)`
  - `test`
  - `security-scan`

✅ **Require conversation resolution before merging**

✅ **Allow force pushes** → ❌ Désactivé

✅ **Allow deletions** → ❌ Désactivé

---

## 📌 Protection pour branches `feature/**`

### Règle: `feature/**`

**Branch name pattern:** `feature/**`

#### Protections requises:

✅ **Require status checks to pass before merging** (pour PRs)
- Status checks required:
  - `lint (user-service)`
  - `lint (product-service)`
  - `lint (order-service)`
  - `lint (payment-service)`
  - `lint (notification-service)`
  - `test`

❌ Pas de restriction sur les force pushes (flexibilité en développement)

---

## 📌 Protection pour branches `hotfix/**`

### Règle: `hotfix/**`

**Branch name pattern:** `hotfix/**`

#### Protections requises:

✅ **Require a pull request before merging**
- Require approvals: **1**

✅ **Require status checks to pass before merging**
- Status checks required:
  - `lint (user-service)`
  - `lint (product-service)`
  - `lint (order-service)`
  - `lint (payment-service)`
  - `lint (notification-service)`
  - `test`
  - `security-scan`

✅ **Require conversation resolution before merging**

---

## 🔐 Environments Configuration

### 1. Créer l'environnement Staging

1. Aller dans **Settings** → **Environments**
2. Cliquer sur **New environment**
3. Nom: `staging`
4. Configurer:
   - **Deployment branches**: `develop` uniquement
   - **Environment secrets**:
     - `KUBECONFIG_STAGING`: kubeconfig en base64
   - **Reviewers** (optionnel): Pas nécessaire pour staging
   - **Wait timer**: 0 minutes

### 2. Créer l'environnement Production

1. Nom: `production`
2. Configurer:
   - **Deployment branches**: `main` uniquement
   - **Environment secrets**:
     - `KUBECONFIG_PRODUCTION`: kubeconfig en base64
   - **Required reviewers**: 2+ personnes (DevOps Lead, Tech Lead)
   - **Wait timer**: 5 minutes (sécurité)
   - **Prevent self-review**: ✅ Activé

---

## 🔑 Repository Secrets

Aller dans **Settings** → **Secrets and variables** → **Actions**

### Secrets à ajouter:

1. **KUBECONFIG_STAGING**
   ```bash
   cat ~/.kube/config-staging | base64 -w 0
   ```

2. **KUBECONFIG_PRODUCTION**
   ```bash
   cat ~/.kube/config-production | base64 -w 0
   ```

3. **SLACK_WEBHOOK_URL**
   - URL du webhook Slack pour notifications
   - Format: `https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX`

4. **CODECOV_TOKEN** (optionnel pour repo privé)
   - Token depuis https://codecov.io

5. **GHCR_TOKEN** (optionnel, utilise GITHUB_TOKEN par défaut)
   - Personal Access Token avec scope `write:packages`

---

## 📋 Workflow de Développement

### Création d'une Feature

```bash
# Depuis develop
git checkout develop
git pull origin develop
git checkout -b feature/my-new-feature

# Développement...
git add .
git commit -m "feat: add new feature"
git push origin feature/my-new-feature

# Créer PR vers develop sur GitHub
```

### Hotfix Urgent

```bash
# Depuis main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# Fix...
git add .
git commit -m "fix: resolve critical bug"
git push origin hotfix/critical-bug-fix

# Créer PR vers main ET develop sur GitHub
```

### Release vers Production

```bash
# Après validation sur staging
git checkout main
git pull origin main
git merge develop --no-ff
git push origin main

# Ou créer PR de develop vers main
```

---

## ✅ Checklist de Configuration

- [ ] Règles de protection pour `main` créées
- [ ] Règles de protection pour `develop` créées
- [ ] Règles de protection pour `feature/**` créées (optionnel)
- [ ] Règles de protection pour `hotfix/**` créées (optionnel)
- [ ] Environnement `staging` créé avec secrets
- [ ] Environnement `production` créé avec reviewers
- [ ] Secret `KUBECONFIG_STAGING` ajouté
- [ ] Secret `KUBECONFIG_PRODUCTION` ajouté
- [ ] Secret `SLACK_WEBHOOK_URL` ajouté
- [ ] Secret `CODECOV_TOKEN` ajouté (si repo privé)
- [ ] CODEOWNERS file créé (optionnel)
- [ ] Status checks configurés dans les règles

---

## 🔍 Vérification

Tester le workflow:

1. **Feature branch:**
   ```bash
   git checkout -b feature/test-workflow
   echo "test" > test.txt
   git add test.txt
   git commit -m "test: workflow verification"
   git push origin feature/test-workflow
   ```
   ✅ Devrait déclencher: lint + test uniquement

2. **PR vers develop:**
   - Créer PR sur GitHub
   ✅ Devrait déclencher: lint + test + security-scan

3. **Merge vers develop:**
   ✅ Devrait déclencher: full pipeline + deploy staging

4. **PR vers main:**
   - Créer PR de develop vers main
   ✅ Devrait nécessiter 2 reviews et tous les checks

5. **Merge vers main:**
   ✅ Devrait déclencher: full pipeline + deploy production + Slack notification

---

## 📚 Documentation Associée

- [CI/CD Pipeline README](./.github/workflows/README.md)
- [Main Project README](../../README.md)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [GitHub Environments](https://docs.github.com/en/actions/deployment/targeting-different-environments/using-environments-for-deployment)
