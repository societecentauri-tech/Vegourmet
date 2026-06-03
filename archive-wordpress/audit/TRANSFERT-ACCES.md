---
status: active
mission: vegourmet-acquisition
created: 2026-05-29
closing_target: 2026-06-01
---

# Checklist de transfert des accès — closing vegourmet.fr

> **Objectif** : liste exhaustive de TOUS les accès, credentials et transferts à exiger du vendeur (Alexis BADET) pendant la période d'inspection 7 jours post-funding Escrow.com. Tout élément non transféré = retenue sur séquestre.
>
> **Stack confirmée en live le 2026-05-29** : WordPress.com Business (Automattic Atomic) + Cloudflare (DNS + APO) + Titan Email + thème Yummy Bites Pro (WP Delicious) + suite de plugins premium. Registrar domaine : Key-Systems GmbH (back-end Automattic), expiration **2026-11-04**.

## Méthode de transfert recommandée

Pour chaque compte tiers, **deux modes possibles** :
1. **Transfert de propriété** (préféré) : le vendeur ajoute `societe.centauri@gmail.com` comme admin/owner puis se retire — l'historique et les données restent.
2. **Remise de credentials** : login + mot de passe + accès 2FA (numéro de tel / app authenticator / codes de secours). À changer immédiatement après réception.

Toujours privilégier le mode 1 quand la plateforme le permet (Google, Cloudflare, réseaux sociaux pro). Le mode 2 impose de récupérer aussi le **contrôle de l'e-mail et du 2FA** sinon le compte reste récupérable par le vendeur.

---

## Bloc 1 — Domaine & DNS

| Élément | Accès à exiger | Format / action | Priorité |
|---|---|---|---|
| Domaine `vegourmet.fr` | Code de transfert (AuthInfo/EPP) + déverrouillage registrar | Transfert sortant vers registrar Centauri OU conservation sur compte WP.com transféré | P0 |
| Compte registrar | Identifié : Key-Systems via Automattic (`registrar@automattic.com`) — géré dans le compte WordPress.com | Confirmer le canal de gestion du domaine (WP.com Domains) | P0 |
| Expiration domaine | Date : **2026-11-04** | Anticiper le renouvellement post-cession (ne pas laisser expirer) | P1 |
| DNS Cloudflare | Accès au compte Cloudflare (`kaiser`/`simone.ns.cloudflare.com`) | Transfert d'ownership de la zone OU recréation zone sur compte Centauri + bascule NS | P0 |
| Cloudflare APO | Réglages Automatic Platform Optimization (actif) | Inclus dans le transfert de zone | P1 |
| Cloudflare Managed robots.txt | Réglage Managed Content (bloque GPTBot/ClaudeBot/Google-Extended) | À récupérer + réviser post-cession | P2 |
| Enregistrements DNS complets | Export de zone (A, CNAME, MX, TXT/SPF/DKIM/DMARC) | Export avant toute bascule pour rejouer à l'identique | P0 |

## Bloc 2 — Hébergement & CMS WordPress

| Élément | Accès à exiger | Format / action | Priorité |
|---|---|---|---|
| Compte WordPress.com Business | Transfert de propriété du site WP.com OU credentials + e-mail + 2FA | Via outil « Transfer site » de WordPress.com (recommandé) | P0 |
| Admin WordPress (wp-admin) | Compte rôle **Administrateur** | Création compte admin pour `societe.centauri@gmail.com` | P0 |
| Accès SFTP/SSH | Identifiants SFTP/SSH (WP.com Business le permet) | Pour export brut wp-content + thèmes/plugins | P1 |
| Base de données | Accès phpMyAdmin / credentials DB | Dump SQL complet | P1 |
| Export contenu WXR | Outils → Exporter (tout le contenu) | Fichier `.xml` WordPress eXtended RSS (sauvegarde + future migration) | P0 |
| Médiathèque complète | Dossier `wp-content/uploads/` intégral | Archive zip (photos HD originales) | P0 |
| Snippets Code Snippets | Export du plugin Code Snippets | Fichier `.json`/`.xml` (logique custom embarquée) | P1 |
| Réglages thème & customizer | Export réglages Yummy Bites Pro / Customizer | Pour reproduction fidèle | P2 |

## Bloc 3 — Thème & plugins (licences premium à transférer)

> Toute licence premium est nominative : exiger le **compte vendeur de chaque éditeur** OU la **clé de licence + e-mail du compte** pour réémission. Vérifier la date de renouvellement de chacune (coûts récurrents ~400-650 €/an).

| Logiciel | Type | Accès à exiger | Priorité |
|---|---|---|---|
| Thème **Yummy Bites Pro** (WP Delicious) | Premium | Compte WP Delicious + clé de licence | P0 |
| **WP Rocket** 3.17.3.1 | Premium | Compte wp-rocket.me + clé de licence | P1 |
| **Rank Math** (Pro probable) | Premium | Compte Rank Math + clé + connexion Analytics | P0 |
| **Delicious Recipes** (Pro) | Premium | Compte/licence (lié au thème) | P0 |
| **Popup Maker PRO** | Premium (confirmé via wp-json `popup-maker-pro/v1`) | Compte + clé de licence | P1 |
| **WPForms** (vérifier Lite vs Pro) | Freemium | Compte + clé si Pro | P2 |
| **WP Table Builder** (vérifier Lite vs Pro) | Freemium | Compte + clé si Pro | P2 |
| **Cookie Notice** (+ Compliance ?) | Freemium | Compte cookie-script/hu-manity si payant | P2 |
| **Jetpack** (Backup, Protect, Boost, Stats, Blaze) | Abonnement | Lié au compte WP.com — inclus dans transfert WP.com | P1 |
| **Akismet** | Clé API | Clé + plan associé (commercial vs perso) | P2 |
| **Code Snippets** | Gratuit | Pas de licence, mais exporter les snippets (cf. Bloc 2) | P1 |
| **Newspack Blocks** (Automattic) | Gratuit | Lié WP.com | P3 |

## Bloc 4 — Analytics, Search & indexation

| Élément | Accès à exiger | Format / action | Priorité |
|---|---|---|---|
| **Google Analytics 4** | Propriété `466965823` (compte `Vegourmet` `336268931`) | Passer `societe.centauri@gmail.com` de Viewer → **Administrateur**, idéalement transfert d'ownership | P0 |
| **Google Search Console** | `sc-domain:vegourmet.fr` | Passer de `siteRestrictedUser` → **Propriétaire** (vérif via DNS TXT) | P0 |
| Compte Google propriétaire | `vegourmet.contact@gmail.com` | Délégation owner ou transfert ; sinon revalider propriété par DNS après bascule | P1 |
| Bing Webmaster Tools | Compte si existant | Transfert / revalidation | P3 |
| Connexion Rank Math ↔ Google | Comptes Search Console / Analytics liés dans Rank Math | Reconnecter au compte Centauri | P2 |
| Pinterest claim domaine | Rich Pins / domaine vérifié sur Pinterest | Re-claim post-cession | P2 |

## Bloc 5 — Monétisation & affiliations

| Plateforme | Accès à exiger | Détail | Priorité |
|---|---|---|---|
| **Greenweez** (affiliation principale) | Compte affilié + ID tracking + dashboard 12 mois + contrat | Vérifier clause de cession/transfert du programme | P0 |
| **Fnty.co** (matériel cuisine) | Compte affilié + liens/tracking | — | P1 |
| **Amazon Partenaires** | Compte + tracking ID | Confirmer si réellement utilisé | P2 |
| **Grow.me / Mediavine** (confirmé actif via `grow/v1`) | Compte Grow.me/Mediavine + dashboard revenus | Transfert ou clôture ; vérifier seuils d'éligibilité | P0 |
| Google AdSense | Vérifier qu'aucun pub-id n'est rattaché | Non détecté — confirmer absence | P3 |
| Autres régies (Awin/Effiliation/etc.) | Inventaire exhaustif | Demander la liste de TOUTES les sources de revenu | P1 |

## Bloc 6 — Réseaux sociaux (cession + credentials)

> Pour chaque compte : login + e-mail associé + accès 2FA + transfert de propriété (Business Manager pour Meta). À changer dès réception.

| Réseau | Compte | Priorité | Note |
|---|---|---|---|
| **Pinterest** | (asset clé — 9 % du trafic) | P0 | Plus gros levier social transférable |
| **Instagram** | @vegourmetoff | P1 | Via Meta Business Suite si pro |
| **Facebook** | Page + compte admin | P1 | Transfert via Business Manager |
| **X (Twitter)** | Compte | P2 | — |
| **TikTok** | Compte | P2 | — |
| **YouTube** | Compte si existant | P3 | À confirmer |
| Inventaire chiffré | Followers + engagement par réseau | P1 | Pour valoriser l'actif social |

## Bloc 7 — E-mail & newsletter

| Élément | Accès à exiger | Détail | Priorité |
|---|---|---|---|
| **Boîte mail pro Titan** (MX `titan.email`) | Credentials boîte (`contact@vegourmet.fr` probable) + panel Titan | **Détecté live 2026-05-29** — non documenté avant. Contient affiliations/comptes liés | P0 |
| Plateforme newsletter | Compte (Mailchimp / Brevo / autre — à confirmer) | Export liste abonnés + preuve de consentement RGPD | P1 |
| Base d'abonnés | Export CSV + double opt-in documenté | Conformité RGPD obligatoire avant import | P1 |
| Redirections / alias e-mail | Liste des alias et forwards configurés | À rejouer post-bascule DNS | P2 |

## Bloc 8 — Propriété intellectuelle & contenu

| Élément | Accès à exiger | Détail | Priorité |
|---|---|---|---|
| Droits photographies | Cession écrite explicite (auteur « Julien ») | Clause de cession globale dans l'APA | P0 |
| Logo & identité visuelle | Fichiers sources (AI/PSD/SVG) | Banque de marque complète | P1 |
| Marque « Vegourmet » | Dépôt INPI ? | **Vérifier collision** avec l'app iOS suédoise Vegourmet (Filibaba AB) | P1 |
| Contenus éditoriaux | Cession des textes (172 recettes + 37 articles) | Inclus dans l'APA | P0 |
| Médias HD originaux | Photos non compressées hors médiathèque WP | Si stockage externe (Drive/Dropbox) | P2 |
| Persona « Chloé » | Statut du persona fictif | Pas de transfert juridique mais E-E-A-T à reconstruire | P2 |

## Bloc 9 — Documents administratifs & légaux

| Élément | Accès à exiger | Détail | Priorité |
|---|---|---|---|
| Factures hébergement & licences | 12 mois | Dates de renouvellement + coûts récurrents réels | P1 |
| Contrats prestataires | Rédacteur web, photographe | À reprendre ou dénoncer | P1 |
| Mentions légales / CGU actuelles | Version en ligne | À réécrire post-cession (SIRET Centauri, hébergeur réel, cookies CNIL) | P2 |
| Statut juridique vendeur | SIRET / forme | Pour l'APA (déjà : red flags identité Alexis BADET) | P1 |
| Outils annexes éventuels | Canva, Notion/Trello, banque d'images payante | Demander l'inventaire des outils utilisés | P2 |

---

## Synthèse — accès P0 bloquants (séquestre conditionné)

1. Domaine `vegourmet.fr` (code EPP + déverrouillage)
2. Compte Cloudflare (zone DNS + APO)
3. Compte WordPress.com Business (transfert site) + export WXR + médiathèque
4. GA4 (ownership) + GSC (propriétaire)
5. Greenweez + Grow.me/Mediavine (comptes + dashboards revenus)
6. Pinterest (asset social clé)
7. Boîte mail Titan `contact@vegourmet.fr`
8. Cession écrite droits photos + contenus
9. Licences thème Yummy Bites Pro + Rank Math + Delicious Recipes

> **Règle de closing** : aucun déblocage du séquestre Escrow.com tant que les 9 éléments P0 ne sont pas transférés et vérifiés pendant la fenêtre d'inspection 7 jours. PayPal refusé en toute circonstance.

## Historique

| Date | Changement |
|---|---|
| 2026-05-29 | Création du document — checklist exhaustive de transfert des accès, enrichie par détection live de la stack (Titan Email, Cloudflare APO, registrar Key-Systems, Popup Maker PRO, Grow.me/Mediavine, Newspack confirmés) |
