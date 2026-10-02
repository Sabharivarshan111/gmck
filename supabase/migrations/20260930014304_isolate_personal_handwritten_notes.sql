CREATE TABLE public.personal_handwritten_notes (user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, subtopic_key text NOT NULL, year text NOT NULL, subject text NOT NULL, subtopic_name text NOT NULL, content jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY (user_id, subtopic_key));
ALTER TABLE public.personal_handwritten_notes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.personal_handwritten_notes FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.personal_handwritten_notes TO service_role;
