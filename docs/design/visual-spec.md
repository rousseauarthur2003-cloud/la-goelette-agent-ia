# Cahier des charges visuel

- Direction artistique : pixel art original inspiré de la lisibilité des RPG sur consoles portables, sans reprendre aucune ressource protégée.
- Perspective : vue orthogonale du dessus.
- Architecture : bureaux modernes, lumineux et chaleureux.
- Palette : bleu marine, bleu clair, blanc cassé, vert doux, bois clair.
- Carte cible : 120 x 88 tuiles.
- Taille logique d'une tuile : 32 x 32 px.
- Les personnages, meubles et décors doivent être des créations originales.
- Les états visuels doivent refléter les événements réels du système.

## Implémentation

Toutes les ressources graphiques (tuiles, mobilier, personnages, icônes) sont dessinées par code dans `src/game/art/`
(créations originales, aucune image externe). Un « pixel » art = 2 pixels écran. Personnages 16 × 24 pixels art,
apparence dérivée de l'identifiant du poste (peau, coiffure, vêtements, accessoires).
Aucun logo n'est fabriqué : le nom « La Goélette » est affiché en texte.
