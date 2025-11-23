import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-rates-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rates-page.component.html',
  styleUrls: ['./rates-page.component.scss']
})
export class RatesPageComponent {
  consultationTypes = [
    {
      title: 'Consultation Initiale',
      price: '150',
      duration: '60 minutes',
      description: 'Première consultation pour évaluation complète',
      features: [
        'Évaluation psychologique complète',
        'Plan de traitement personnalisé',
        'Recommandations thérapeutiques',
        'Rapport détaillé'
      ],
      popular: false
    },
    {
      title: 'Consultation de Suivi',
      price: '120',
      duration: '50 minutes',
      description: 'Séances de suivi régulières',
      features: [
        'Suivi thérapeutique',
        'Ajustement du plan de traitement',
        'Soutien continu',
        'Notes de session'
      ],
      popular: true
    },
    {
      title: 'Consultation en Ligne',
      price: '100',
      duration: '45 minutes',
      description: 'Téléconsultation par vidéo',
      features: [
        'Consultation par vidéo sécurisée',
        'Flexible et pratique',
        'Même qualité de service',
        'Disponible partout'
      ],
      popular: false
    },
    {
      title: 'Thérapie de Couple',
      price: '200',
      duration: '90 minutes',
      description: 'Séances pour les couples',
      features: [
        'Séance avec les deux partenaires',
        'Techniques de communication',
        'Résolution de conflits',
        'Exercices pratiques'
      ],
      popular: false
    }
  ];

  specializedServices = [
    {
      name: 'Évaluation Psychologique Complète',
      price: '350 - 500',
      description: 'Évaluation approfondie avec tests psychométriques'
    },
    {
      name: 'Thérapie de Groupe',
      price: '60',
      description: 'Séances de groupe thématiques (par personne)'
    },
    {
      name: 'Consultation d\'Urgence',
      price: '180',
      description: 'Consultation en cas d\'urgence psychologique'
    },
    {
      name: 'Supervision Professionnelle',
      price: '150',
      description: 'Pour professionnels de la santé mentale'
    }
  ];

  packages = [
    {
      title: 'Package Bien-être',
      sessions: '5 séances',
      price: '550',
      savings: 'Économisez 50$',
      description: 'Idéal pour un suivi court terme'
    },
    {
      title: 'Package Thérapie',
      sessions: '10 séances',
      price: '1000',
      savings: 'Économisez 200$',
      description: 'Recommandé pour un suivi régulier',
      popular: true
    },
    {
      title: 'Package Intensif',
      sessions: '20 séances',
      price: '1800',
      savings: 'Économisez 600$',
      description: 'Pour un accompagnement approfondi'
    }
  ];
}
