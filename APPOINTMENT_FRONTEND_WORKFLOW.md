# Workflow Frontend de Prise de Rendez-vous - Teranga

## Vue d'ensemble

Ce document décrit le parcours complet de prise de rendez-vous pour l'application Teranga, incluant les tâches à implémenter et le fil d'Ariane (breadcrumb) de navigation.

## 📋 Tâches à implémenter pour le parcours de prise de rendez-vous

### 1. Bouton d'accès au service
- **Action**: Ajouter un bouton « Prendre rendez-vous » sur le site
- **Localisation**: Page d'accueil (hero section)
- **Fonctionnalité**: Redirection vers le workflow de prise de rendez-vous

### 2. Choix du mode de consultation
- **Écran**: Interface de sélection du type de consultation
- **Options proposées**:
  - 🏥 Consultation en cabinet
  - 📹 Consultation en vidéo
- **Fonctionnalité**: Sélection qui influence le reste du parcours

### 3. Choix du type de patient
- **Écran**: Interface de sélection du statut patient
- **Options proposées**:
  - 👤 Nouveau patient
  - 🔄 Patient existant
- **Fonctionnalité**: Détermine le parcours à suivre

---

## 🔄 Parcours Nouveau Patient

### Fil d'Ariane (Breadcrumb)
```
Accueil > Prendre rendez-vous > Mode de consultation > Type de patient > Nouveau patient > [Étapes suivantes]
```

### 3.1 Sélection de la spécialité
- **Écran**: Liste des spécialités disponibles
- **Options**: 
  - 🧠 Psychologue
  - 💪 Coach de vie
  - 🩺 Médecin généraliste
  - 🏥 Autres spécialités médicales
- **Fonctionnalité**: Filtrage des professionnels par spécialité

### 3.2 Affichage de la liste des professionnels
- **Écran**: Grille/liste des professionnels correspondants
- **Informations affichées**:
  - Photo du professionnel
  - Nom et titre
  - Spécialité
  - Note/avis patients
  - Prix de consultation
  - Disponibilité générale
- **Fonctionnalité**: Sélection d'un professionnel

### 3.3 Sélection d'un professionnel
- **Action**: Clic sur un professionnel
- **Résultat**: Affichage des détails et disponibilités
- **Fonctionnalité**: Validation du choix

### 3.4 Affichage des disponibilités
- **Écran**: Calendrier des disponibilités du professionnel
- **Format**: Vue mensuelle/semaine avec créneaux horaires
- **Informations**:
  - Dates disponibles
  - Heures disponibles par jour
  - Durée des créneaux (30min, 1h, etc.)
  - Type de consultation (cabinet/vidéo)
- **Fonctionnalité**: Sélection d'un créneau

### 3.5 Sélection d'un créneau disponible
- **Action**: Clic sur un créneau horaire
- **Validation**: Vérification de la disponibilité en temps réel
- **Fonctionnalité**: Réservation temporaire du créneau

### 3.6 Formulaire de création de compte patient
- **Écran**: Formulaire multi-étapes
- **Informations requises**:
  - **Informations personnelles**:
    - Nom complet
    - Email (unique)
    - Mot de passe
    - Confirmation mot de passe
    - Date de naissance
    - Téléphone
  - **Informations de contact**:
    - Adresse
    - Ville
    - Contact d'urgence
  - **Préférences**:
    - Langue préférée
    - Méthodes de notification
    - Consentements (RGPD, marketing)

### 3.7 Soumission et confirmation du rendez-vous
- **Actions**:
  - Validation du formulaire
  - Création du compte patient
  - Réservation du créneau
  - Traitement du paiement (si applicable)
- **Notifications**:
  - Email de confirmation
  - SMS de rappel (optionnel)
  - Notification dans l'application
- **Résultat**: Rendez-vous confirmé

---

## 🔄 Parcours Patient Existant

### Fil d'Ariane (Breadcrumb)
```
Accueil > Prendre rendez-vous > Mode de consultation > Type de patient > Patient existant > [Étapes suivantes]
```

### 4.1 Formulaire de connexion
- **Écran**: Interface de connexion
- **Champs requis**:
  - Email
  - Mot de passe
- **Fonctionnalités**:
  - Connexion sécurisée
  - Mot de passe oublié
  - Validation des identifiants

### 4.2 Indication de la raison de consultation
- **Écran**: Formulaire de raison de consultation
- **Options**:
  - Suivi médical
  - Nouvelle consultation
  - Urgence
  - Autre (champ libre)
- **Fonctionnalité**: Personnalisation du parcours selon la raison

### 4.3 Affichage des disponibilités
- **Écran**: Calendrier interactif
- **Format**: Vue par jour (Lundi, Mardi, etc.)
- **Créneaux horaires**: 
  - Matin (8h-12h)
  - Après-midi (12h-17h)
  - Soir (17h-20h)
- **Fonctionnalité**: Sélection du jour et de l'heure

### 4.4 Sélection d'un créneau disponible
- **Action**: Clic sur un créneau horaire
- **Validation**: Vérification de la disponibilité
- **Fonctionnalité**: Réservation du créneau

### 4.5 Validation et soumission du rendez-vous
- **Écran**: Récapitulatif et confirmation
- **Informations affichées**:
  - Détails du professionnel
  - Date et heure du rendez-vous
  - Type de consultation
  - Raison de consultation
  - Informations de contact
- **Actions**:
  - Validation finale
  - Soumission du rendez-vous
  - Traitement du paiement
- **Confirmation**: Notification envoyée au patient

---

## 🎨 Composants Frontend Requis

### 1. Composants de Navigation
- `BreadcrumbComponent`: Fil d'Ariane
- `NavigationHeaderComponent`: En-tête de navigation
- `ProgressIndicatorComponent`: Indicateur de progression

### 2. Composants de Sélection
- `ConsultationModeSelectorComponent`: Choix du mode
- `PatientTypeSelectorComponent`: Nouveau/Existant
- `SpecialtySelectorComponent`: Sélection spécialité
- `ProfessionalListComponent`: Liste professionnels
- `AvailabilityCalendarComponent`: Calendrier disponibilités

### 3. Composants de Formulaire
- `PatientRegistrationFormComponent`: Création compte
- `LoginFormComponent`: Connexion patient
- `ConsultationReasonFormComponent`: Raison consultation
- `AppointmentSummaryComponent`: Récapitulatif

### 4. Composants de Confirmation
- `AppointmentConfirmationComponent`: Confirmation RDV
- `PaymentProcessingComponent`: Traitement paiement
- `NotificationComponent`: Notifications

---

## 🔄 États et Transitions

### États Principaux
1. **Home**: Page d'accueil
2. **ConsultationMode**: Choix mode consultation
3. **PatientType**: Choix type patient
4. **NewPatientFlow**: Parcours nouveau patient
5. **ExistingPatientFlow**: Parcours patient existant
6. **Confirmation**: Confirmation finale

### Transitions
```
Home → ConsultationMode → PatientType → [NewPatientFlow | ExistingPatientFlow] → Confirmation
```

---

## 📱 Responsive Design

### Desktop (1024px+)
- Interface en 2 colonnes
- Calendrier complet visible
- Formulaires en étapes horizontales

### Tablet (768px-1023px)
- Interface adaptée tactile
- Calendrier en vue semaine
- Formulaires en étapes verticales

### Mobile (< 768px)
- Interface en une colonne
- Calendrier compact
- Formulaires simplifiés
- Navigation par onglets

---

## 🔒 Sécurité et Validation

### Validation Frontend
- Validation en temps réel des formulaires
- Vérification de disponibilité des créneaux
- Validation des emails et téléphones
- Contrôle de cohérence des dates

### Sécurité
- Chiffrement des données sensibles
- Authentification sécurisée
- Protection contre les attaques CSRF
- Validation côté serveur

---

## 📊 Métriques et Analytics

### Métriques à Tracker
- Taux de conversion par étape
- Abandon par type de patient
- Temps passé sur chaque écran
- Taux d'erreur de validation
- Satisfaction utilisateur

### Points de Mesure
- Clic sur "Prendre rendez-vous"
- Sélection du mode de consultation
- Complétion du formulaire d'inscription
- Confirmation de rendez-vous
- Satisfaction post-consultation

---

## 🚀 Roadmap d'Implémentation

### Phase 1: Structure de Base
- [ ] Composants de navigation
- [ ] Routing et états
- [ ] Design system de base

### Phase 2: Parcours Nouveau Patient
- [ ] Sélection spécialité et professionnel
- [ ] Calendrier de disponibilités
- [ ] Formulaire d'inscription
- [ ] Confirmation de rendez-vous

### Phase 3: Parcours Patient Existant
- [ ] Interface de connexion
- [ ] Raison de consultation
- [ ] Sélection de créneaux
- [ ] Validation finale

### Phase 4: Optimisations
- [ ] Performance et chargement
- [ ] Tests automatisés
- [ ] Analytics et métriques
- [ ] Optimisations SEO

---

## 📝 Notes Techniques

### Technologies Utilisées
- **Frontend**: Angular 19, TypeScript, SCSS
- **State Management**: RxJS, Angular Services
- **UI Components**: Custom components, Angular Material (optionnel)
- **Validation**: Angular Reactive Forms
- **API**: HTTP Client pour communication backend

### Architecture
- **Modular**: Composants standalone
- **Reactive**: Programmation réactive avec RxJS
- **Type-safe**: TypeScript strict mode
- **Responsive**: Mobile-first design
- **Accessible**: Conformité WCAG 2.1

---

*Dernière mise à jour: Décembre 2024*
*Version: 1.0*
