# États visuels des postes

Distinguer impérativement l'affectation du poste et l'activité réelle de l'agent.

- `working` : agent affecté et exécution réelle en cours.
- `available` : agent connecté, affecté et disponible.
- `inactive` : agent affecté mais inactif ou déconnecté.
- `vacant` : aucun agent affecté au poste.

Un agent ne doit jamais être déclaré `working` sur la seule base d'une session ouverte. L'état doit provenir d'événements d'exécution vérifiables.
