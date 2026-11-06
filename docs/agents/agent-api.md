# API des agents logiciels

Permet de brancher progressivement de vrais agents IA sur les postes. Toutes les routes exigent l'en-tête
`Authorization: Bearer <AGENT_API_TOKEN>` (24 caractères minimum, défini côté serveur). Sans jeton configuré, l'API est désactivée.

Un agent peut **demander** une validation ; il ne peut **jamais** la décider (décision réservée au fondateur authentifié).

| Méthode | Route | Corps | Effet |
|---|---|---|---|
| POST | `/api/agent/register` | `{ "name", "positionId" }` | Enregistre un agent réel sur un poste (remplace un agent de démonstration) |
| POST | `/api/agent/executions` | `{ "missionId", "agentId" }` | Démarre une exécution : mission `in_progress`, poste `working` |
| POST | `/api/agent/executions/{id}` | `{ "agentId", "action": "heartbeat" }` | Prolonge l'exécution (envoyer toutes les 30 s ; expiration à 90 s) |
| POST | `/api/agent/executions/{id}` | `{ "agentId", "action": "succeeded" \| "failed", "resultSummary"?, "errorMessage"? }` | Termine l'exécution |
| POST | `/api/agent/approvals` | `{ "requestedBy", "actionType", "description", "consequences", "riskLevel"?, "missionId"?, "agentId"? }` | Demande une validation ; la mission passe en attente de validation |

Contrôles appliqués : la mission doit être affectée au poste de l'agent, ne pas attendre de validation, et ne pas avoir déjà une
exécution en cours (pas d'exécutions concurrentes involontaires).

Exemple :

```bash
curl -X POST https://<site>/api/agent/executions \
  -H "Authorization: Bearer $AGENT_API_TOKEN" -H "content-type: application/json" \
  -d '{"missionId":"MIS-0001","agentId":"AGT-0001"}'
```

`actionType` : `spending`, `contract`, `sensitive_publication`, `mass_messaging`, `price_change`,
`irreversible_deletion`, `sensitive_data`, `permission_change`, `external_financial_legal`.
