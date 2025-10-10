CREATE TABLE IF NOT EXISTS public.test_email_state (
  id INT PRIMARY KEY,
  last_sent_index INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the initial state if it doesn't exist
INSERT INTO public.test_email_state (id, last_sent_index)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- Enable Row-Level Security
ALTER TABLE public.test_email_state ENABLE ROW LEVEL SECURITY;

-- Allow full access for service roles (used by edge functions)
CREATE POLICY "Allow service_role full access"
ON public.test_email_state
FOR ALL
USING (true)
WITH CHECK (true);
