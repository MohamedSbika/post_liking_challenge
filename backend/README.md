# Debook — Backend Challenge (Node.js / NestJS)

Cette solution implémente une fonctionnalité d'interaction (like) sur des posts avec un flux de notification asynchrone, en mettant l'accent sur la performance et la maintenabilité.

## Architecture & Décisions Techniques

### 1. Performance & Scrutabilité (Compteurs)
Pour répondre à l'exigence de performance ("éviter de charger toutes les relations pour calculer les compteurs"), j'ai opté pour une **dénormalisation des compteurs** sur l'entité `Post` (`likesCount`, `commentsCount`).
- **Avantage** : Les lectures (`GET /v1/posts/:id`) sont extrêmement rapides car elles ne nécessitent pas de JOIN complexe ou de `COUNT(*)`.
- **Cohérence** : Les mises à jour sont effectuées dans une **transaction SQL** avec un **verrouillage pessimiste** (`PESSIMISTIC_WRITE`) sur le post pour éviter les race conditions lors de l'incrémentation.

### 2. Flux de Notification Asynchrone
L'interaction déclenche un événement interne via `@nestjs/event-emitter`.
- Un listener `NotificationsService` écoute cet événement de manière asynchrone (`async: true`).
- Cela permet de répondre immédiatement à l'utilisateur tout en traitant la notification en arrière-plan.
- *Note pour l'échelle* : Pour une production à plus grande échelle, ce mécanisme pourrait être remplacé par Bull/Redis ou RabbitMQ sans changer la logique métier.

### 3. Idempotence & Doublons
Une **contrainte d'unicité composite** (`postId`, `userId`) a été ajoutée sur la table `likes`. Cela garantit au niveau de la base de données qu'un utilisateur ne peut pas liker deux fois le même post, même en cas d'appels concurrents.

### 4. Authentification (Mock)
Un `AuthGuard` simple a été implémenté pour extraire l'ID de l'utilisateur du header `x-user-id`, simulant ainsi une session utilisateur.

---

## Installation et Lancement

### Prérequis
- Docker & Docker Compose
- Node.js (v18+) & npm

### Étapes
1. **Lancer la base de données** :
   ```bash
   docker-compose up -d
   ```

2. **Installer les dépendances** :
   ```bash
   cd backend
   npm install
   ```

3. **Lancer l'application** :
   ```bash
   npm run start:dev
   ```

---

## Utilisation de l'API

### 1. Créer un post (pour le test)
```bash
curl -X POST http://localhost:3000/v1/posts \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello World!", "authorId": "author-uuid-123"}'
```
*Note: Notez l'ID du post retourné.*

### 2. Liker le post
```bash
curl -X POST http://localhost:3000/v1/posts/<POST_ID>/like \
  -H "x-user-id: user-uuid-456"
```

### 3. Récupérer le post avec ses compteurs
```bash
curl http://localhost:3000/v1/posts/<POST_ID>
```

---

## Tests

### Tests Unitaires
```bash
npm run test
```
*Le test `likes.service.spec.ts` valide la logique métier, les transactions et la gestion des erreurs.*

### Tests E2E
```bash
npm run test:e2e
```
*Le test `interaction.e2e-spec.ts` valide le flux complet : création de interaction -> vérification du compteur -> rejet des doublons.*

---

## Scripts Disponibles
- `npm run start:dev` : Lancement en mode développement.
- `npm run test` : Lance les tests unitaires via Jest.
- `npm run test:e2e` : Lance les tests bout-en-bout.
- `npm run lint` : Vérifie la qualité du code.
