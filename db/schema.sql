-- La Goëlette — schéma PostgreSQL CIBLE (non utilisé par la version 0.1, stockage en mémoire).
-- Cohérent avec src/types/domain.ts. À appliquer lors de l'activation de la persistance.

CREATE TABLE departments (
  id TEXT PRIMARY KEY,               -- DIR, MKT…
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  manager_position_id TEXT NOT NULL,
  color TEXT NOT NULL,
  room_x INT NOT NULL, room_y INT NOT NULL, room_width INT NOT NULL, room_height INT NOT NULL
);

CREATE TABLE positions (
  id TEXT PRIMARY KEY,               -- MKT-01…
  department_id TEXT NOT NULL REFERENCES departments(id),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  desk_x INT NOT NULL, desk_y INT NOT NULL,
  assigned_agent_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  position_id TEXT UNIQUE REFERENCES positions(id),
  department_id TEXT NOT NULL REFERENCES departments(id),
  status TEXT NOT NULL,
  connection_status TEXT NOT NULL,
  capabilities TEXT[] NOT NULL DEFAULT '{}',
  tools_allowed TEXT[] NOT NULL DEFAULT '{}',
  permissions TEXT[] NOT NULL DEFAULT '{}',
  provenance TEXT NOT NULL DEFAULT 'real',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);

CREATE TABLE missions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  objective TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('draft','pending','assigned','in_progress','waiting_approval','completed','failed','cancelled')),
  priority TEXT NOT NULL CHECK (priority IN ('low','normal','high','critical')),
  department_id TEXT NOT NULL REFERENCES departments(id),
  assigned_agent_id TEXT REFERENCES agents(id),
  assigned_position_id TEXT REFERENCES positions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ, completed_at TIMESTAMPTZ, due_at TIMESTAMPTZ,
  deliverable TEXT NOT NULL DEFAULT '',
  result_summary TEXT,
  created_by TEXT NOT NULL,
  provenance TEXT NOT NULL DEFAULT 'real'
);

CREATE TABLE mission_comments (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id) ON DELETE CASCADE,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE executions (
  id TEXT PRIMARY KEY,
  mission_id TEXT NOT NULL REFERENCES missions(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  status TEXT NOT NULL CHECK (status IN ('queued','running','succeeded','failed','cancelled')),
  started_at TIMESTAMPTZ, heartbeat_at TIMESTAMPTZ, finished_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'
);
-- Une seule exécution en cours par mission.
CREATE UNIQUE INDEX one_running_execution_per_mission ON executions(mission_id) WHERE status = 'running';

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  actor_type TEXT NOT NULL, actor_id TEXT NOT NULL,
  entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
  department_id TEXT,
  summary TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  provenance TEXT NOT NULL DEFAULT 'real',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX events_created_at ON events(created_at DESC);

CREATE TABLE approvals (
  id TEXT PRIMARY KEY,
  requested_by TEXT NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT NOT NULL,
  consequences TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','approved','rejected')),
  mission_id TEXT REFERENCES missions(id),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  decided_at TIMESTAMPTZ, decided_by TEXT, decision_comment TEXT,
  provenance TEXT NOT NULL DEFAULT 'real'
);
