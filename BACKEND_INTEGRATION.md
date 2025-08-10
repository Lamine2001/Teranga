# Configuration du Backend DjolofMed

## Structure des endpoints attendus

Le service d'authentification Angular communique avec les endpoints suivants :

### Authentification

#### POST `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123",
  "userType": "doctor" // ou "patient"
}
```

**Réponse attendue :**
```json
{
  "user": {
    "id": "1",
    "email": "user@example.com",
    "firstName": "Prénom",
    "lastName": "Nom",
    "userType": "doctor",
    "phone": "+221 XX XXX XX XX",
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "lastLogin": "2024-01-01T00:00:00.000Z",
    // Champs spécifiques au médecin
    "specialization": "Médecine générale",
    "licenseNumber": "MD-12345",
    "department": "Consultation générale",
    "availableHours": ["09:00", "10:00", "11:00"]
  },
  "token": "jwt-token-here"
}
```

#### POST `/api/auth/register`
```json
{
  "email": "user@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "firstName": "Prénom",
  "lastName": "Nom",
  "phone": "+221 XX XXX XX XX",
  "userType": "patient", // ou "doctor"
  "dateOfBirth": "1990-01-01", // pour les patients
  "address": "Adresse complète", // pour les patients
  "specialization": "Cardiologie", // pour les médecins
  "licenseNumber": "MD-12345" // pour les médecins
}
```

**Réponse attendue :** Même format que pour le login

#### POST `/api/auth/logout`
Headers: `Authorization: Bearer <token>`

**Réponse attendue :**
```json
{
  "success": true
}
```

#### GET `/api/auth/verify`
Headers: `Authorization: Bearer <token>`

**Réponse attendue :**
```json
{
  "user": {
    // Données utilisateur complètes
  }
}
```

## Configuration

### Variables d'environnement

Modifiez le fichier `src/environments/environment.ts` :

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api', // URL de votre backend
  appName: 'DjolofMed'
};
```

Pour la production, modifiez `src/environments/environment.prod.ts` :

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.djolofmed.sn/api', // URL de production
  appName: 'DjolofMed'
};
```

## Gestion des erreurs

Le backend doit retourner des erreurs HTTP appropriées :

- `400 Bad Request` : Données invalides
- `401 Unauthorized` : Identifiants incorrects
- `403 Forbidden` : Accès interdit
- `404 Not Found` : Utilisateur non trouvé
- `409 Conflict` : Email déjà existant
- `422 Unprocessable Entity` : Erreurs de validation
- `500 Internal Server Error` : Erreur serveur

Format des erreurs :
```json
{
  "message": "Description de l'erreur",
  "error": "ERROR_CODE" // optionnel
}
```

## Sécurité

- Les tokens JWT doivent avoir une durée de vie appropriée
- Implémenter la rotation des tokens si nécessaire
- Utiliser HTTPS en production
- Configurer CORS correctement

## Test

Pour tester l'intégration :

1. Démarrez votre backend sur le port configuré (par défaut 3000)
2. Lancez l'application Angular : `npm start`
3. Testez l'inscription et la connexion via l'interface

## Modifications nécessaires

Si votre backend a une structure différente, vous devrez modifier :

1. Les endpoints dans `auth.service.ts`
2. La structure des données dans les interfaces `user.ts`
3. La gestion des erreurs dans `error-handler.service.ts`
