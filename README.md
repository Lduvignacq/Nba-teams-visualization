## Visualisation interactive des équipes NBA

Tableau de bord D3.js pour explorer l'histoire, les performances et les tirs des franchises NBA. L'interface met côte à côte cartes, graphiques temporels et heatmaps de tirs afin de parcourir les saisons et comparer les équipes en un coup d'œil.

### Fonctionnalités principales
- Sélection de saison avec mise à jour instantanée des visualisations.
- Heatmap de tirs (hexbin) par saison avec court tracé en SVG.
- Carte interactive des franchises (positions géographiques et logos).
- Réseau de passes et radar de statistiques collectives.
- Timeline des dates de création des franchises et courbes d'évolution des points moyens.
- Statistiques d'équipe (points moyens, bilan) avec infobulles détaillées.
- Composants supplémentaires : calendrier de matchs, waffle chart pour répartitions.

### Structure du projet
- Page d'entrée : [mainpage.html](mainpage.html) charge l'ensemble des scripts et définit la grille des visuels.
- Styles : [style.css](style.css) contient la charte graphique et les animations.
- Scripts D3 :
	- [script.js](script.js) gère le sélecteur de saison et plusieurs graphiques (heatmap de tirs, timeline, tendances de scoring, stats équipes).
	- Modules complémentaires : [js/nbajs.js](js/nbajs.js), [js/radarchart.js](js/radarchart.js), [js/team-map.js](js/team-map.js), [js/team_stats.js](js/team_stats.js), [js/players.js](js/players.js), [js/calendar.js](js/calendar.js), [js/waffle-chart.js](js/waffle-chart.js).
- Données : répertoires sous [data](data) (stats d'équipes, tendances de scoring, tirs par saison, logos, cartes, calendriers, résultats de playoffs, etc.).

### Prérequis
- Navigateur moderne (Chrome/Edge/Firefox) avec JavaScript activé.
- Serveur web local (évite les blocages CORS lors du chargement des fichiers JSON/CSV).

### Lancer le projet en local
1) Cloner ou télécharger ce dépôt puis ouvrir un terminal à la racine du projet.
2) Démarrer un petit serveur HTTP, par exemple avec Python :
	 - `python -m http.server 8000`
3) Ouvrir le navigateur sur `http://localhost:8000/mainpage.html`.

Alternatives : l'extension VS Code « Live Server » fonctionne aussi. Éviter l'ouverture directe du fichier via `file://` (les requêtes fetch seraient bloquées).

### Utilisation
- Choisir la saison dans le menu déroulant (barre supérieure) puis cliquer sur « Apply » si présent.
- Survoler les graphiques pour afficher les infobulles détaillées et mettre à jour le panneau d'informations.
- Redimensionner la fenêtre : les visualisations se recalculent automatiquement.

### Données disponibles
- [data/teams_simple.json](data/teams_simple.json) : franchises, abréviations, villes, années de création.
- [data/scoring_trends.json](data/scoring_trends.json) : évolution des points moyens par saison.
- [data/team_stats.json](data/team_stats.json) : points moyens, bilan, pourcentage de victoires.
- [data/nba_api/shot_per_season](data/nba_api/shot_per_season) : coordonnées de tirs par saison (CSV).
- Autres dossiers : logos d'équipes, cartes US (GeoJSON/CSV), brackets playoffs, plannings, passes, rosters.

### Personnalisation rapide
- Palette et marges : éditer l'objet `config` en tête de [script.js](script.js).
- Changer le fond/gradient : section `body` dans [style.css](style.css).
- Ajouter une nouvelle source de données : déposer le fichier dans `data/` puis adapter le module concerné dans `js/`.

### Problèmes connus
- Si rien ne s'affiche, vérifier que le serveur local tourne et que le chemin d'accès aux fichiers `data/` est correct.
- Certaines visualisations requièrent des données spécifiques (passes, waffle) : assurez-vous que les CSV/JSON correspondants sont présents.

### Credits
Projet de data visualisation NBA réalisé en D3.js. Données issues de fichiers fournis dans le dossier `data/`.
