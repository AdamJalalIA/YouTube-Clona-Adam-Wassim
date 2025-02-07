-- création de la table des profils  
CREATE TABLE IF NOT EXISTS profiles (
  -- clé primaire liée aux utilisateurs Supabase  
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,  
  -- nom d'utilisateur unique obligatoire  
  username text UNIQUE NOT NULL,  
  -- URL de l'avatar  
  avatar_url text,  
  -- date de création automatique  
  created_at timestamptz DEFAULT now()  
);  

-- activation de la sécurité niveau ligne (RLS)  
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;  

-- règle 1: Tout le monde peut voir les profils  
CREATE POLICY "Public profiles are viewable by everyone"  
  ON profiles  
  FOR SELECT  
  USING (true);  

-- règle 2: Les utilisateurs peuvent créer leur propre profil  
CREATE POLICY "Users can insert their own profile"  
  ON profiles  
  FOR INSERT  
  WITH CHECK (auth.uid() = id);  

-- règle 3: les utilisateurs peuvent modifier leur propre profil  
CREATE POLICY "Users can update their own profile"  
  ON profiles  
  FOR UPDATE  
  USING (auth.uid() = id);  

-- création du dossier de stockage pour les avatars  
INSERT INTO storage.buckets (id, name)  
VALUES ('avatars', 'avatars')  
ON CONFLICT DO NOTHING;  

-- règle 1: Tout le monde peut voir les avatars  
CREATE POLICY "Avatar images are publicly accessible"  
  ON storage.objects  
  FOR SELECT  
  USING (bucket_id = 'avatars');  

-- règle 2: Les utilisateurs peuvent télécharger leur propre avatar  
CREATE POLICY "Users can upload their own avatar"  
  ON storage.objects  
  FOR INSERT  
  WITH CHECK (  
    bucket_id = 'avatars' AND  
    auth.uid() = (storage.foldername(name))[1]::uuid  
  );  
