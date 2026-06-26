# VOLTPILOT — REDESIGN INTÉGRAL — DIRECTION COSMIQUE — MOBILE-FIRST — MULTI-SKILL ORCHESTRATION

## Objectif

Refonte complète de VoltPilot, logiciel de monitoring de panneaux solaires, avec une direction esthétique cosmique (espace profond), une animation 3D photorealistic d'un panneau solaire décomposé en ses couches, et une expérience mobile-first irréprochable. Qualité cible : logiciel à 50 000 €.

Chaque étape invoque les skills appropriés. Le mobile est une expérience co-égale au desktop à chaque étape, sans exception.

---

## ÉTAPE 0 — /sparc-methodology : Spécification

**Skill :** `/sparc-methodology` (phase Specification)

- Documenter les user stories desktop ET mobile séparément
- Définir les critères de succès pour chaque format
- Identifier les contraintes de connectivité terrain (mode dégradé mobile)
- Inventorier les composants existants à supprimer / remplacer
- Figer le périmètre : aucun ancien design ne subsiste

**Mobile (obligatoire) :** Rédiger des specs mobiles distinctes — navigation, gestes, densité d'information, mode hors-ligne.

---

## ÉTAPE 1 — frontend-design : Direction artistique cosmique

**Skill :** `frontend-design`

- Créer un système de tokens complet (couleurs, typographie, espacements, rayons, ombres) inspiré de l'espace profond
- Palette : noirs profonds, bleus nuit, violets nébuleuses, accents plasma/stellar
- Typo : association display + corps soigneusement choisie, non générique
- Wireframes pour desktop ET mobile simultanément
- Valider la lisibilité de la palette en extérieur (usage terrain photovoltaïque)
- Définir l'élément signature unique du design

**Mobile (obligatoire) :** Wireframes mobile-first avant desktop. Validation de la lisibilité au soleil.

---

## ÉTAPE 2 — ui-ux-pro-max : Système de design et composants

**Skill :** `ui-ux-pro-max`

- Surcharger entièrement shadcn/ui avec les tokens de l'étape 1
- Concevoir tous les composants : cartes métriques, graphiques, navigation, modales, toasts
- Appliquer les 99 guidelines UX : hiérarchie, feedback, états d'interaction
- Valider l'accessibilité (WCAG AA minimum)
- Touch targets minimum pour mobile, espacements adaptés aux pouces

**Mobile (obligatoire) :** Touch targets validés sur chaque composant interactif. Spacing adapté aux doigts, pas à la souris.

---

## ÉTAPE 3 — Three.js + gsap-core : Panneau solaire 3D photorealistic

**Skills :** `gsap-core` + Three.js (procédural, aucun asset externe)

**Couches du panneau à modéliser :**
1. Cadre aluminium anodisé
2. Verre trempé anti-reflet
3. Cellules monocristallines PERC avec busbars
4. Couche encapsulante EVA (avant)
5. Couche encapsulante EVA (arrière)
6. Backsheet
7. Boîtier de jonction avec câbles MC4

**Animation de décomposition :**
- Les couches s'écartent sur l'axe Z avec des trajectoires différenciées
- Matériaux PBR : réflexions, rugosités et métallicité déterminées par les skills (aucune valeur hardcodée)
- Éclairage HDRI simulant lumière solaire
- ResizeObserver pour canvas responsive

**Comportement responsive :**
- Desktop : décomposition horizontale avec labels flottants
- Mobile : décomposition verticale condensée, `gsap.matchMedia()` pour switcher les animations
- `prefers-reduced-motion` respecté via GSAP matchMedia

**Mobile (obligatoire) :** Canvas adapté à l'écran mobile. Décomposition verticale. Gestes touch pour rotation du panneau.

---

## ÉTAPE 4 — stop-slop : Audit et réécriture des textes

**Skill :** `stop-slop`

- Scorer tous les textes UI sur les 5 dimensions
- Réécrire chaque label, titre, message d'erreur, état vide, tooltip
- Version desktop (texte complet) ET version mobile (texte raccourci) pour chaque élément
- Éliminer tout jargon IA, toute formulation générique
- Vocabulaire ancré dans le monde du photovoltaïque

**Mobile (obligatoire) :** Deux versions de chaque texte — une pour desktop, une raccourcie pour mobile. Scorées séparément.

---

## ÉTAPE 5 — Layout global : Desktop + Mobile

**Skills :** `frontend-design` + `ui-ux-pro-max`

**Desktop :**
- Sidebar navigation latérale
- Dashboard principal avec métriques temps réel
- Zone hero avec panneau 3D
- Graphiques de production, rendement, alertes

**Mobile :**
- Bottom navigation bar (pas de sidebar)
- Cartes métriques swipeables (pas de scroll vertical infini)
- Aucun pinch-to-zoom sur le canvas Three.js
- Vue simplifiée prioritaire sur les données critiques

**Mobile (obligatoire) :** Bottom nav, swipe gestures, pas de zoom canvas, contenu masqué par la bottom nav évité.

---

## ÉTAPE 6 — senior-backend : API et temps réel

**Skill :** `senior-backend`

- Architecture REST + SSE (Server-Sent Events) pour les métriques temps réel
- Endpoint desktop : données complètes
- Endpoint mobile allégé : payload réduit, champs essentiels uniquement, paginé
- Mode dégradé SSE pour connectivité terrain médiocre (polling fallback)
- Cache local sécurisé côté mobile

**Mobile (obligatoire) :** Endpoint `/api/mobile/metrics` distinct. SSE avec mode dégradé automatique sur mauvaise connexion.

---

## ÉTAPE 7 — hyperframes : Vidéo de présentation produit

**Skills :** `hyperframes:product-launch-video` + `hyperframes:embedded-captions`

- Vidéo de lancement montrant le logiciel en action
- Séquences desktop ET mobile présentes dans la vidéo (les deux formats visibles)
- Animation 3D du panneau intégrée dans la vidéo
- Captions avec identité visuelle ancrée (police, couleur, position cohérente)
- Narration sobre, sans formulations IA génériques (applique `stop-slop`)

**Mobile (obligatoire) :** La vidéo montre explicitement l'interface mobile — bottom nav, swipe, métriques compactes.

---

## ÉTAPE 8 — gstack : Tests et qualité

**Skill :** `gstack`

- Tests unitaires sur les composants UI critiques
- Tests d'intégration sur les endpoints backend
- Test sur un appareil mobile milieu de gamme (performance réelle)
- Simulation de lisibilité en extérieur (luminosité écran réduite)
- Vérification que la bottom nav ne masque aucun contenu important

**Mobile (obligatoire) :** Tests sur appareil milieu de gamme. Simulation outdoor. Vérification bottom nav content masking.

---

## ÉTAPE 9 — code-review (mode high) : Revue complète

**Skill :** `code-review` (mode high)

- Revue architecture frontend et backend
- Validation canvas responsive (ResizeObserver, breakpoints)
- Vérification touch targets sur tous les composants interactifs
- Audit du mode SSE dégradé mobile
- Contrôle de la cohérence des tokens à travers tous les fichiers

**Mobile (obligatoire) :** Revue explicite : canvas responsive, breakpoints, touch targets, mode SSE dégradé, bottom nav.

---

## ÉTAPE 10 — security-review : Sécurité

**Skill :** `security-review`

- Audit des endpoints REST et SSE (authentification, autorisation)
- Sécurité du cache local mobile (données sensibles non exposées)
- Parité des contrôles d'accès entre endpoint desktop et endpoint mobile
- Validation des inputs, protection XSS, CSRF
- Pas de données de production exposées côté client

**Mobile (obligatoire) :** Audit du cache local mobile. Parité des contrôles d'accès mobile vs desktop. Sécurité endpoint mobile allégé.

---

## Stack technique

- **Frontend :** React + TypeScript + Tailwind CSS (tokens re-définis de zéro)
- **Composants :** shadcn/ui entièrement surchargé
- **3D :** Three.js procédural (aucun asset externe)
- **Animation :** GSAP (gsap.matchMedia, prefers-reduced-motion)
- **Temps réel :** SSE avec fallback polling
- **Backend :** Node.js / Fastify (ou Express)
- **Base :** PostgreSQL

## Règles absolues

1. Aucune valeur hardcodée dans le prompt — les skills et Claude Code décident
2. L'ancien design disparaît intégralement, aucun vestige
3. Le mobile est une expérience égale au desktop, pas une adaptation
4. Aucune formulation générique IA dans les textes UI
5. Qualité cible : logiciel à 50 000 €
