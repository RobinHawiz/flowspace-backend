BEGIN;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE app_user (
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
first_name VARCHAR(50) NOT NULL,
last_name VARCHAR(50) NOT NULL,
email CITEXT UNIQUE NOT NULL CHECK (email ~* '^[A-Za-z0-9._+%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
password_hash VARCHAR(200) NOT NULL
);

CREATE TABLE workspace (
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
title VARCHAR(100) NOT NULL
);

CREATE TABLE assigned_workspace_user (
workspace_id INT NOT NULL,
app_user_id INT NOT NULL,
role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
PRIMARY KEY (workspace_id, app_user_id),
FOREIGN KEY (workspace_id) REFERENCES workspace(id) ON DELETE CASCADE,
FOREIGN KEY (app_user_id) REFERENCES app_user(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX idx_workspace_role ON assigned_workspace_user (workspace_id, role) WHERE role = 'admin';

CREATE TABLE workspace_column (
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
workspace_id INT NOT NULL,
title VARCHAR(200) NOT NULL,
workspace_column_order INT NOT NULL CHECK (workspace_column_order >= 0),
FOREIGN KEY (workspace_id) REFERENCES workspace(id) ON DELETE CASCADE,
CONSTRAINT unique_workspace_column_order
UNIQUE (workspace_id, workspace_column_order)
DEFERRABLE INITIALLY DEFERRED
);

COMMIT;