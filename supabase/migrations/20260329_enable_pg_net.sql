-- Enable pg_net extension for async HTTP calls from database triggers.
-- Must be applied BEFORE the booking SMS trigger migration.
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;
