# Mise à jour du Calendrier - Séries avec Classement

## ✅ Changements effectués

### 1. Position des séries
- **Avant** : Les séries étaient affichées en bas, sous la légende
- **Après** : Les séries sont maintenant affichées **au-dessus de la légende**
- Position Y : `height - 100` (au lieu de `legendY + 35`)

### 2. Affichage sur plusieurs lignes
Les informations des séries sont maintenant organisées sur **3 lignes** :

```
Plus longue série de victoires:
12 matchs (3e sur 30)
15 Jan → 2 Fév
```

**Ligne 1** : Titre en gras avec couleur (vert pour victoires, rouge pour défaites)
**Ligne 2** : Nombre de matchs + classement par rapport aux 30 équipes
**Ligne 3** : Dates de début et fin de la série (en gris clair)

### 3. Nouveau système de classement

Fonction `calculateStreakRankings()` ajoutée :
- Calcule les séries pour **toutes les 30 équipes** NBA
- Compare la série de l'équipe actuelle avec les autres
- Retourne le rang : **1er** = meilleure série, **30e** = moins bonne

**Exemple :**
- OKC Thunder avec 10 matchs de suite : "3e sur 30"
- Signifie que 2 équipes ont fait mieux cette saison

### 4. Ajustements visuels


**Tailles de police :**
- Titre : 12px (gras)
- Détails : 11px (normal)
- Dates : 9px (gris clair)

**Icônes :**
- Carré coloré 14x14px avec coins arrondis
- Vert #28a745 pour victoires
- Rouge #dc3545 pour défaites

## 📊 Structure des données

### Calcul du classement

```javascript
// Pour chaque équipe
1. Parcourir tous les matchs chronologiquement
2. Détecter les séquences de W ou L
3. Garder la plus longue de chaque type

// Pour le classement
1. Trier toutes les équipes par longueur de série
2. Trouver la position de l'équipe actuelle
3. Retourner le rang (1 à 30)
```

### Exemples de séries remarquables (saison 2024-25)

**Longues séries de victoires :**
- OKC Thunder (68-14) : Séries impressionnantes
- Cleveland (64-18) : Très consistant
- Boston (61-21) : Champions dominants

**Longues séries de défaites :**
- Washington (18-64) : Saison difficile
- Utah (17-65) : En reconstruction
- Charlotte (19-63) : Nombreuses défaites

## 🎨 Layout final

```
┌────────────────────────────────────────────────┐
│         Calendrier ATL - Atlanta Hawks         │
│              Record: 40-42                      │
└────────────────────────────────────────────────┘
┌────────────────────────────────────────────────┐
│ [Oct] [Nov] [Déc] [Jan] [Fév] [Mar] [Avr] [Mai]│
└────────────────────────────────────────────────┘
┌────────────────────────────────────────────────┐
│           Grille calendrier 7x6                │
│         (jours avec couleurs W/L)              │
└────────────────────────────────────────────────┘
┌────────────────────────────────────────────────┐
│ 🟢 Plus longue série de      🔴 Plus longue    │
│    victoires:                   série de       │
│    8 matchs (12e sur 30)        défaites:      │
│    1 Nov → 15 Nov               7 matchs (8e/30│
│                                 20 Déc → 3 Jan  │
└────────────────────────────────────────────────┘
┌────────────────────────────────────────────────┐
│   [Victoire] [Défaite] [Pas de match]          │
│                           Ce mois: 10-5         │
└────────────────────────────────────────────────┘
```

## 🧪 Tests

### Fichier de test
```bash
python3 -m http.server 8000
# Ouvrir: http://localhost:8000/test_calendar_rankings.html
```

### Équipes à tester

**Pour voir de grandes séries de victoires :**
- OKC, CLE, BOS, HOU

**Pour voir de longues séries de défaites :**
- WAS, UTA, CHA, PHI

**Pour comparaison :**
- LAL, GSW, MIA, NYK

## 💡 Interprétation du classement

### Séries de victoires
- **1er à 5e** : Elite NBA, équipes dominantes
- **6e à 15e** : Bon niveau, séries respectables
- **16e à 30e** : Équipes avec difficultés à enchaîner

### Séries de défaites
- **1er à 10e** : Équipes en difficulté majeure
- **11e à 20e** : Quelques passages à vide
- **21e à 30e** : Peu de séries négatives (bon signe)

**Note :** Un bon classement en séries de défaites = rang élevé (moins de défaites consécutives)

## 🔧 Code technique

### Fonctions principales

```javascript
calculateStreaks()
// → Retourne les séries de l'équipe actuelle

calculateStreakRankings()  // NOUVEAU
// → Compare avec les 30 équipes
// → Retourne { winRank: number, lossRank: number }
```

### Performance
- Calcul en temps réel pour chaque équipe
- Cache via `allTeamSchedules` (452 KB en mémoire)
- Recalculé à chaque changement d'équipe

## 📝 Améliorations futures possibles

- [ ] Ajouter un graphique montrant la distribution des séries
- [ ] Marquer en couleur le classement (top 5 = or, bottom 5 = gris)
- [ ] Ajouter la série en cours (si différente de la plus longue)
- [ ] Permettre de cliquer pour voir les détails de chaque match de la série
- [ ] Comparer avec les records historiques NBA

## ⚠️ Notes importantes

1. **Classement = Position décroissante**
   - 1er = meilleure série
   - Plus le chiffre est petit, mieux c'est

2. **Données de la saison 2024-25 uniquement**
   - Les records historiques ne sont pas inclus
   - Comparaison entre les 30 équipes actuelles

3. **Calcul automatique**
   - Pas besoin de données externes
   - Tout est calculé à partir de `team_schedules_2024-25.json`
