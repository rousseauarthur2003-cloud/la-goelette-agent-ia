# États visuels des postes

Distinguer impérativement l'affectation du poste et l'activité réelle de l'agent.

- `working` : agent affecté et exécution réelle en cours.
- `available` : agent connecté, affecté et disponible.
- `inactive` : agent affecté mais inactif ou déconnecté.
- `vacant` : aucun agent affecté au poste.

Un agent ne doit jamais être déclaré `working` sur la seule base d'une session ouverte. L'état doit provenir d'événements d'exécution vérifiables.

## Implémentation

- Règle codée dans `src/lib/status.ts` (`deriveDeskState`), testée dans `tests/status.test.ts`.
- Heartbeat valable 90 secondes. Au-delà, une exécution déclarée en cours affiche l'état `unknown` (personnage translucide, « ? »), jamais `working`.
- Autres états gérés : `error`, `paused`, `waiting_approval`, `offline`, `unknown`.
- Représentation dans le siège : `working` = assis et tape au clavier, écran allumé ; `available` = debout près du bureau ; `inactive` / `offline` = fauteuil vide, écran éteint ; `vacant` = bureau vide.
