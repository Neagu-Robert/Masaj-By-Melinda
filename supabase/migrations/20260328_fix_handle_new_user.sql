CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  raw_name text;
  safe_name text;
BEGIN
  raw_name := new.raw_user_meta_data->>'full_name';
  
  IF raw_name IS NOT NULL AND raw_name ~ '^[A-Za-zÀ-ÖØ-öø-ÿĂăÂâÎîȘșȚț \-'']{1,100}$' THEN
    safe_name := raw_name;
  ELSE
    safe_name := '';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, status)
  VALUES (new.id, new.email, safe_name, 'customer', 'active');
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN 
    CREATE TRIGGER on_auth_user_created 
    AFTER INSERT ON auth.users 
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 
  END IF; 
END $$;
