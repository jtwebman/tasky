CREATE EXTENSION IF NOT EXISTS citext;  

CREATE TABLE IF NOT EXISTS  users (
  id UUID NOT NULL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS logins (
  id UUID NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES users(id),
  username TEXT NOT NULL UNIQUE,
  password TEXT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emails (
  id UUID NOT NULL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  email CITEXT NOT NULL UNIQUE,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE users
  ADD primary_email_id UUID NULL UNIQUE REFERENCES emails(id);