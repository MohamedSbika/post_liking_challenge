# Debook — Challenge de code Backend (NestJS)

Cette solution implémente un système d'interaction au sein d'un réseau social, permettant de "liker" des publications avec une gestion rigoureuse de la performance, de la cohérence des données et des notifications asynchrones.

---

## 🛠 Architecture & Choix Techniques

### 1. Performance : Compteurs Dénormalisés
Pour répondre à l'exigence d'efficacité, les compteurs (`likesCount`, `commentsCount`) sont stockés directement sur l'entité `Post`.
- **Pourquoi ?** Cela permet de récupérer les statistiques d'un post en **O(1)** sans jointure complexe ni agrégation SQL (`COUNT(*)`) coûteuse sur des millions de lignes.

### 2. Cohérence : Transactions & Verrous
- **Transactions** : La création d'un like et l'incrémentation du compteur sont atomiques.
- **Pessimistic Locking** : Utilisation de `PESSIMISTIC_WRITE` lors de la récupération du Post avant l'incrémentation pour éviter les *race conditions*.

### 3. Notifications Asynchrones
- Utilisation de `@nestjs/event-emitter`. Lorsqu'un like est validé, un événement `post.liked` est émis.
- Le `NotificationsService` écoute cet événement et traite la notification de façon **asynchrone**.

### 4. Intégrité : Unicité Composite
- Une contrainte `UNIQUE(postId, userId)` au niveau de la base de données empêche strictement un utilisateur de liker deux fois le même contenu.

---

## 🚀 Guide d'Exécution (Docker)

La solution est entièrement dockerisée pour faciliter le lancement.

### Prérequis
- **Docker Desktop**

### Lancement Complet
1. **Démarrer l'ensemble du projet (API + Base de données)** :
   ```bash
   docker-compose up --build -d
   ```

2. **Exécuter les migrations** (nécessaire au premier lancement) :
   ```bash
   # On exécute la commande à l'intérieur du conteneur API
   docker exec -it debook-api npm run migration:run
   ```

L'API est maintenant accessible sur `http://localhost:3000`.

---

## 💻 Développement Local (Sans Docker pour l'API)

Si vous préférez lancer l'API localement :

1.  **Démarrer uniquement Postgres** : `docker-compose up -d postgres`
2.  **Installer & Lancer** :
    ```bash
    cd backend
    npm install
    npm run migration:run
    npm run start:dev
    ```

---

## 📡 Scénario de Test Complet

### 1. Créer une publication
```bash
curl -X POST http://localhost:3000/v1/posts \
  -H "Content-Type: application/json" \
  -d '{"content": "Ceci est mon premier post Debook !", "authorId": "author-uuid-1"}'
```

### 2. Liker la publication
```bash
curl -X POST http://localhost:3000/v1/posts/<ID_DU_POST>/like \
  -H "x-user-id: user-A"
```

### 3. Vérifier les compteurs
```bash
curl http://localhost:3000/v1/posts/<ID_DU_POST>
```

---

## 🧪 Stratégie de Test

```bash
# Tests Unitaires
npm run test

# Tests E2E (Nécessite Postgres lancé sur le port 5433)
npm run test:e2e
```

---

## 📈 Passage en Production (Scaling)

Bien que la solution actuelle utilise `EventEmitter2` (asynchrone et non-bloquant), une architecture de production à grande échelle bénéficierait de **BullMQ** (Redis) pour garantir qu'aucune notification ne soit perdue en cas de crash serveur.

La logique BullMQ est déjà préparée (en commentaire) dans le code :
1.  **Dependencies** : `npm install @nestjs/bull bull`
2.  **Infrastructure** : Décommentez le service `redis` dans `docker-compose.yaml`.
3.  **Code** : Décommentez les blocs BullMQ dans :
    - `backend/src/app.module.ts` (Configuration globale Redis)
    - `backend/src/notifications/notifications.module.ts` (Enregistrement de la queue)
    - `backend/src/notifications/notifications.processor.ts` (Traitement du job)
    - `backend/src/likes/likes.service.ts` (Ajout du job à la queue)
