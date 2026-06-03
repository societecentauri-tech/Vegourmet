# Charte éditoriale Vegourmet — extraite des 20 pages au meilleur ranking (GSC 16 mois)

> Source : analyse des 20 URLs au plus fort trafic réel (guacamole 4259 clics, galette sarrasin 2409, muffins salés 2378, margarine 2144…). Objectif : que toute nouvelle publication parle **exactement la même langue** que celles qui rankent déjà.

## 1. La voix : « Chloé », à la première personne, en tutoiement

- **Persona assumée** : Chloé parle en « je », s'adresse au lecteur en « tu ». Jamais de « nous » corporate, jamais de « vous » distant.
  - Ex. réels : *« Je te livre ma méthode exacte »*, *« Salut à toi ! Ici Chloé »*, *« Tu sais ce moment où tu cherches dans tes placards… »*
- **Anecdote personnelle ancrée** dès l'intro (lieu réel + personne réelle) :
  - *« Je me souviens encore de ce dimanche pluvieux à Quimper, où j'ai débarqué dans une crêperie avec Julien »*
  - *« la première fois que j'ai tenté une pâte à choux vegan, c'était pour l'anniversaire de ma nièce Emma. Elle avait 8 ans… »*
  - → Toujours un détail concret et crédible (prénom, âge, ville, météo, occasion). C'est le pilier E-E-A-T du site.
- **Registre** : chaleureux, complice, gourmand, jamais donneur de leçon. Enthousiaste sans être mièvre.

## 2. L'accroche : problème → promesse → résultat chiffré

Structure d'intro quasi systématique (≈ 60-100 mots) :
1. **Pain point** formulé en question/exclamation directe : *« Marre du guacamole tout mou qui finit en bouillie ? »* / *« Tu cherches comment obtenir un crumble qui ne détrempe pas ? »*
2. **Promesse** de la solution + ce qui fait la différence : *« Je te livre ma méthode exacte pour un résultat crémeux avec de la mâche, comme au Mexique »*
3. **Bénéfice concret + temps** : *« prêt en 10 minutes chrono »*, *« moelleux à chaque bouchée »*.

## 3. Vocabulaire sensoriel (le marqueur de marque le plus fort)

Toujours décrire la **texture, le son, la bouche**, pas juste le goût :
- « texture qui claque », « crémeux avec de la mâche », « moelleux à l'intérieur, doré à l'extérieur »
- « croustillant qui craque sous la fourchette, révélant des légumes fondants »
- « dense, riche, ne s'effondre pas au service », « côté gras et fondant »
→ Chaque recette doit contenir 3-5 de ces formules sensorielles.

## 4. Structure de page

### Gabarit RECETTE (le gros du trafic)
- **Corps éditorial fluide de 600-950 mots**, AUCUN `<h2>` lourd dans le corps (les recettes qui rankent ont 0 h2 — la structure ingrédients/étapes vient de la fiche Delicious Recipes injectée séparément).
- Privilégier : intro narrative → paragraphes courts avec **gras** sur les mots-clés (« le secret », « la clé », « adieu le … fade ») → astuces personnelles → variantes → conservation.
- La fiche recette structurée (ingrédients, étapes, temps, schema Recipe) = bloc Delicious, à ne PAS recréer en HTML.

### Gabarit GUIDE « meilleur·e X » (pilier commercial / affiliation)
- Plus structuré (le lecteur compare) : intro Chloé → critères de choix → **tableau comparatif** → recommandations par usage → FAQ.
- Garde la voix Chloé en intro et en transitions, même registre sensoriel.
- Ici les `<h2>`/`<h3>` sont légitimes (intention informationnelle/comparative), mais formulés en **questions réelles** issues de la GSC, pas en mots-clés secs.

## 5. Les visuels — storyboard type (5-7 images, JAMAIS de légende)

Les pages qui rankent ont **5 à 7 images, 0 figcaption**, avec des **alt riches et descriptifs** (1 phrase complète). Séquence narrative observée :

| # | Type de prise de vue | Exemple d'alt réel |
|---|---|---|
| 1 | **Ingrédients bruts** disposés | *« Ingrédients bruts pour la préparation du Mascarpone Vegan : cajou, citron, huile de coco »* |
| 2 | **Étape de préparation** (geste, poêle, saladier) | *« Galette dans la poêle, garnie de tofu, épinards et fromage juste avant le pliage »* |
| 3 | **Gros plan texture** (cuillère, tranche, coupe) | *« Gros plan sur la texture ferme et onctueuse du Mascarpone sur une cuillère »* |
| 4 | **Plat fini en situation conviviale** | *« Un Bo Bun pour un dîner entre amis dans un restaurant branché »* / *« apéro dînatoire »* |
| 5-6 | Variantes / autres angles du plat fini | *« cake aux olives servies pour l'apéritif »* |
| 7 | **Image de recette liée** (maillage interne visuel) | dernière vignette = autre recette (Burrito, Houmous, Gyozas…) |

**Ambiance / direction artistique** :
- Lumière naturelle douce, photographie culinaire éditoriale.
- Vaisselle sobre : **assiettes/plats blancs, céramique, table en bois clair**.
- Mise en contexte lifestyle : « apéro dînatoire », « dîner entre amis », « restaurant parisien/branché » → convivialité, pas de studio froid.
- Cadrage : vue 3/4 ou plongée légère pour le plat fini ; macro pour la texture.
- **Alt = 1 phrase descriptive complète** intégrant le mot-clé + le contexte (pas « guacamole » sec).

## 6. Règles SEO de marque
- **Title** : « [Plat] Vegan : [bénéfice/accroche] » ou « Meilleur·e [X] : [promesse] ». ≤ 60 car.
- **Meta** : reprend le pain point + la promesse, ≤ 155 car. (compté en Python).
- FAQ calquée sur les **vraies requêtes GSC** de la page (longue traîne).
- Maillage interne : 3-5 liens vers recettes/guides du même cluster (cf. SEO tree centauri_prod).

## 7. À éviter (anti-ligne)
- ❌ Ton « guide » impersonnel, listes de h2 mots-clés empilés (≠ recettes qui rankent).
- ❌ Tournures IA génériques (« dans le monde d'aujourd'hui », « il est important de noter », « plongeons dans »).
- ❌ Vouvoiement, « nous », absence d'anecdote.
- ❌ Images sans alt descriptif, ou légendes (le site n'en met pas).
