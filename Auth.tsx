import React, { useState } from 'react';
import { supabase } from '../supabase';

// onction pour fermer la fenêtre modale
interface AuthProps {
  onClose: () => void;
}

export function Auth({ onClose }: AuthProps) {
  // États (variables) pour gérer le formulaire
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // gère la soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isSignUp) {
        // création d'un nouveau compte
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (authError) throw authError;

        if (authData.user) {
          // définit une image de profil par défaut
          const avatarUrl = "https://i.pinimg.com/736x/6f/04/e9/6f04e9400b0fc761fb6a83a1f1443d30.jpg";

          // crée ou met à jour le profil utilisateur dans la base de données
          const { error: updateError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              username,
              avatar_url: avatarUrl,
            });

          if (updateError) throw updateError;
        }
      } else {
        // authentification avec email et mot de passe
        const { error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) throw authError;
      }

      // ferme la fenêtre modale si tout s'est bien passé
      onClose();
    } catch (err) {
      // affiche l'erreur si quelque chose s'est mal passé
      setError(err.message);
    } finally {
      // désactive l'état de chargement
      setLoading(false);
    }
  };

  // interface utilisateur du formulaire
  return (
    // fond semi-transparent qui couvre tout l'écran
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {/* Boîte de dialogue */}
      <div className="bg-[#1a1a1a] p-8 rounded-lg max-w-md w-full">
        {/* Titre du formulaire */}
        <h2 className="text-2xl font-bold mb-6">{isSignUp ? 'Sign Up' : 'Sign In'}</h2>
        
        {/* formulaire d'authentification */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* champ nom d'utilisateur */}
          {isSignUp && (
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {/* champ email */}
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* champ mot de passe */}
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#2a2a2a] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* affichage des erreurs */}
          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          {/* bouton de soumission */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        {/* lien pour basculer entre inscription et connexion */}
        <p className="mt-4 text-center text-sm">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-500 hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>

        {/* bouton pour fermer la fenêtre modale */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}