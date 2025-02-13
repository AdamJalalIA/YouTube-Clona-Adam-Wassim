import React, { useState, useEffect } from 'react';
import { Menu, Search, Bell, Video, User, Home, Compass, Library, History, ThumbsUp, Clock, ThumbsDown, Send } from 'lucide-react';
import { Auth } from './components/Auth';
import { supabase } from './supabase';

function App() {
  // pour gérer l'interface utilisateur
  const [isMenuOpen, setIsMenuOpen] = useState(true);          // Contrôle si le menu latéral est ouvert
  const [selectedVideo, setSelectedVideo] = useState(null);     // Vidéo actuellement sélectionnée
  const [comments, setComments] = useState({});                 // Liste des commentaires
  const [newComment, setNewComment] = useState('');            // Nouveau commentaire en cours de rédaction
  const [likes, setLikes] = useState({});                      // Nombre de "j'aime" par vidéo
  const [dislikes, setDislikes] = useState({});                // Nombre de "je n'aime pas" par vidéo
  const [videos, setVideos] = useState([]);                    // Liste des vidéos
  const [searchQuery, setSearchQuery] = useState('');          // Terme de recherche
  const [showAuth, setShowAuth] = useState(false);             // Afficher/masquer la fenêtre d'authentification
  const [user, setUser] = useState(null);                      // Utilisateur connecté
  const [userProfile, setUserProfile] = useState(null);        // Profil de l'utilisateur
  const [currentView, setCurrentView] = useState('home');      // Vue actuelle (accueil, explorer, etc.)
  const [watchHistory, setWatchHistory] = useState([]);        // Historique des vidéos regardées
  const [watchLater, setWatchLater] = useState([]);            // Liste "À regarder plus tard"
  const [likedVideos, setLikedVideos] = useState([]);         // Vidéos aimées

  // clé API YouTube
  const API_KEY = 'notre clé API';

  // effet qui s'exécute quand la vue change
  useEffect(() => {
    if (currentView === 'home') {
      fetchVideos('naruto fights');        // charges les vidéos que j'ai prédefinis 
    } else if (currentView === 'explore') {
      fetchVideos('anime fights');         // charges les vidéos que j'ai prédefinis 
    }
  }, [currentView]);

  // effet pour gérer l'authentification
  useEffect(() => {
    // vérifie s'il y a une session existante
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
        loadUserData(session.user.id);
      }
    });

    // écoute les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserProfile(session.user.id);
        loadUserData(session.user.id);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // charge les données de l'utilisateur depuis le stockage local
  const loadUserData = async (userId) => {
    const history = JSON.parse(localStorage.getItem(`watchHistory_${userId}`) || '[]');
    const later = JSON.parse(localStorage.getItem(`watchLater_${userId}`) || '[]');
    const liked = JSON.parse(localStorage.getItem(`likedVideos_${userId}`) || '[]');
    
    setWatchHistory(history);
    setWatchLater(later);
    setLikedVideos(liked);
  };

  // récupère le profil utilisateur depuis Supabase
  const fetchUserProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setUserProfile(data);
    }
  };

  // déconnexion de l'utilisateur
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  // récupère les vidéos depuis l'API YouTube
  const fetchVideos = async (query) => {
    try {
      // première requête pour obtenir les informations de base des vidéos
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${query}&type=video&key=${API_KEY}`
      );
      const data = await response.json();
      
      // deuxième requête pour obtenir les statistiques des vidéos
      const videoIds = data.items.map(item => item.id.videoId).join(',');
      const statsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}&key=${API_KEY}`
      );
      const statsData = await statsResponse.json();

      // formate les données des vidéos
      const formattedVideos = data.items.map((item, index) => ({
        id: item.id.videoId,
        thumbnail: item.snippet.thumbnails.high.url,
        title: item.snippet.title,
        channel: item.snippet.channelTitle,
        views: `${Number(statsData.items[index]?.statistics.viewCount || 0).toLocaleString()} views`,
        timestamp: new Date(item.snippet.publishedAt).toLocaleDateString(),
        avatar: `https://static.vecteezy.com/system/resources/previews/023/986/480/original/youtube-logo-youtube-logo-transparent-youtube-icon-transparent-free-free-png.png`,
        videoUrl: `https://www.youtube.com/embed/${item.id.videoId}`
      }));

      setVideos(formattedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  // gère la recherche de vidéos
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchVideos(searchQuery);
      setCurrentView('search');
    }
  };

  // sélectionne une vidéo et met à jour l'historique
  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    if (user) {
      const newHistory = [video, ...watchHistory.filter(v => v.id !== video.id)].slice(0, 50);
      setWatchHistory(newHistory);
      localStorage.setItem(`watchHistory_${user.id}`, JSON.stringify(newHistory));
    }
  };

  // gère les like
  const handleLike = (videoId) => {
    setLikes(prev => ({
      ...prev,
      [videoId]: (prev[videoId] || 0) + 1
    }));
    if (dislikes[videoId]) {
      setDislikes(prev => ({
        ...prev,
        [videoId]: Math.max(0, prev[videoId] - 1)
      }));
    }
    if (user) {
      const video = videos.find(v => v.id === videoId);
      if (video) {
        const newLikedVideos = [...likedVideos.filter(v => v.id !== videoId), video];
        setLikedVideos(newLikedVideos);
        localStorage.setItem(`likedVideos_${user.id}`, JSON.stringify(newLikedVideos));
      }
    }
  };

  // gère les dislike
  const handleDislike = (videoId) => {
    setDislikes(prev => ({
      ...prev,
      [videoId]: (prev[videoId] || 0) + 1
    }));
    if (likes[videoId]) {
      setLikes(prev => ({
        ...prev,
        [videoId]: Math.max(0, prev[videoId] - 1)
      }));
      if (user) {
        const newLikedVideos = likedVideos.filter(v => v.id !== videoId);
        setLikedVideos(newLikedVideos);
        localStorage.setItem(`likedVideos_${user.id}`, JSON.stringify(newLikedVideos));
      }
    }
  };

  // gère la liste à regarder plus tard
  const toggleWatchLater = (video) => {
    if (user) {
      const isInWatchLater = watchLater.some(v => v.id === video.id);
      const newWatchLater = isInWatchLater
        ? watchLater.filter(v => v.id !== video.id)
        : [...watchLater, video];
      setWatchLater(newWatchLater);
      localStorage.setItem(`watchLater_${user.id}`, JSON.stringify(newWatchLater));
    } else {
      setShowAuth(true);
    }
  };

  // ajoute un nouveau commentaire
  const handleComment = (videoId) => {
    if (newComment.trim()) {
      setComments(prev => ({
        ...prev,
        [videoId]: [...(prev[videoId] || []), {
          id: Date.now(),
          text: newComment,
          user: userProfile?.username || "User",
          timestamp: "Just now"
        }]
      }));
      setNewComment('');
    }
  };

  // affiche la grille de vidéos
  const renderVideoGrid = (videoList) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {videoList.map((video) => (
        <div 
          key={video.id} 
          className="flex flex-col gap-2 cursor-pointer group relative"
          onClick={() => handleVideoSelect(video)}
        >
          <div className="relative aspect-video">
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover rounded-xl"
            />
            {user && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleWatchLater(video);
                }}
                className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Clock className={`w-5 h-5 ${watchLater.some(v => v.id === video.id) ? 'text-blue-500' : 'text-white'}`} />
              </button>
            )}
          </div>
          <div className="flex gap-3 mt-2">
            <img
              src={video.avatar}
              alt={video.channel}
              className="w-9 h-9 rounded-full"
            />
            <div>
              <h3 className="font-medium line-clamp-2">{video.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{video.channel}</p>
              <p className="text-sm text-gray-400">
                {video.views} • {video.timestamp}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // gère l'affichage du contenu principal
  const renderContent = () => {
    // si une vidéo est sélectionnée, affiche la page de la vidéo
    if (selectedVideo) {
      return (
        <div className="max-w-6xl mx-auto">
          {/* Lecteur vidéo */}
          <div className="aspect-video mb-4">
            <iframe
              src={selectedVideo.videoUrl}
              className="w-full h-full rounded-xl"
              allowFullScreen
              title={selectedVideo.title}
            ></iframe>
          </div>

          {/* informations de la vidéo */}
          <div className="mb-4">
            <h1 className="text-2xl font-bold mb-2">{selectedVideo.title}</h1>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img src={selectedVideo.avatar} alt="" className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-medium">{selectedVideo.channel}</p>
                  <p className="text-sm text-gray-400">{selectedVideo.views}</p>
                </div>
              </div>
              {/* boutons d'interaction */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => handleLike(selectedVideo.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-[#272727]"
                >
                  <ThumbsUp className={`w-6 h-6 ${likes[selectedVideo.id] ? 'text-blue-500' : ''}`} />
                  <span>{likes[selectedVideo.id] || 0}</span>
                </button>
                <button 
                  onClick={() => handleDislike(selectedVideo.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-[#272727]"
                >
                  <ThumbsDown className={`w-6 h-6 ${dislikes[selectedVideo.id] ? 'text-blue-500' : ''}`} />
                  <span>{dislikes[selectedVideo.id] || 0}</span>
                </button>
                {user && (
                  <button
                    onClick={() => toggleWatchLater(selectedVideo)}
                    className="flex items-center gap-2 px-4 py-2 rounded-full hover:bg-[#272727]"
                  >
                    <Clock className={`w-6 h-6 ${watchLater.some(v => v.id === selectedVideo.id) ? 'text-blue-500' : ''}`} />
                    <span>Watch Later</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* section des commentaires */}
          <div className="mt-6">
            <h3 className="text-xl font-bold mb-4">Comments</h3>
            {user ? (
              <div className="flex gap-4 mb-6">
                <img
                  src={userProfile?.avatar_url || "https://i.pinimg.com/736x/6f/04/e9/6f04e9400b0fc761fb6a83a1f1443d30.jpg"}
                  alt={userProfile?.username || "User"}
                  className="w-10 h-10 rounded-full"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full bg-transparent border-b border-gray-600 focus:border-blue-500 outline-none pb-2"
                  />
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => handleComment(selectedVideo.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-500 rounded-full hover:bg-blue-600"
                    >
                      <Send className="w-4 h-4" />
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p>Please <button onClick={() => setShowAuth(true)} className="text-blue-500 hover:underline">sign in</button> to comment</p>
              </div>
            )}

            {/* liste des commentaires */}
            <div className="space-y-4">
              {(comments[selectedVideo.id] || []).map((comment) => (
                <div key={comment.id} className="flex gap-4">
                  <img
                    src="https://i.pinimg.com/736x/6f/04/e9/6f04e9400b0fc761fb6a83a1f1443d30.jpg"
                    alt={comment.user}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{comment.user}</span>
                      <span className="text-sm text-gray-400">{comment.timestamp}</span>
                    </div>
                    <p className="mt-1">{comment.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // affiche différentes vues en fonction de currentView
    switch (currentView) {
      case 'explore':
        return renderVideoGrid(videos);
      case 'library':
        return user ? (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Watch Later</h2>
              {watchLater.length > 0 ? renderVideoGrid(watchLater) : (
                <p className="text-gray-400">No videos saved for later</p>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-4">Liked Videos</h2>
              {likedVideos.length > 0 ? renderVideoGrid(likedVideos) : (
                <p className="text-gray-400">No liked videos</p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl mb-4">Sign in to access your library</p>
            <button
              onClick={() => setShowAuth(true)}
              className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            >
              Sign In
            </button>
          </div>
        );
      case 'history':
        return user ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">Watch History</h2>
            {watchHistory.length > 0 ? renderVideoGrid(watchHistory) : (
              <p className="text-gray-400">No watch history</p>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl mb-4">Sign in to see your watch history</p>
            <button
              onClick={() => setShowAuth(true)}
              className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            >
              Sign In
            </button>
          </div>
        );
      case 'liked':
        return user ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">Liked Videos</h2>
            {likedVideos.length > 0 ? renderVideoGrid(likedVideos) : (
              <p className="text-gray-400">No liked videos</p>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-xl mb-4">Sign in to see your liked videos</p>
            <button
              onClick={() => setShowAuth(true)}
              className="px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            >
              Sign In
            </button>
          </div>
        );
      default:
        return renderVideoGrid(videos);
    }
  };

  // structure principale de l'application
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* En-tête */}
      <header className="fixed top-0 left-0 right-0 bg-[#0f0f0f] h-14 flex items-center justify-between px-4 z-50">
        {/* Logo et bouton menu */}
        <div className="flex items-center gap-4">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 hover:bg-[#272727] rounded-full">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-1">
            <Video className="w-8 h-8 text-red-600" />
            <span className="text-xl font-semibold">YouTube</span>
          </div>
        </div>
        
        {/* Barre de recherche */}
        <div className="flex-1 max-w-2xl mx-4">
          <form onSubmit={handleSearch} className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search"
              className="w-full px-4 py-2 bg-[#121212] border border-[#303030] rounded-l-full focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="px-6 bg-[#222222] border border-l-0 border-[#303030] rounded-r-full hover:bg-[#272727]">
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* actions utilisateur */}
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-[#272727] rounded-full">
            <Video className="w-6 h-6" />
          </button>
          <button className="p-2 hover:bg-[#272727] rounded-full">
            <Bell className="w-6 h-6" />
          </button>
          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 p-2 hover:bg-[#272727] rounded-full">
                <img
                  src={userProfile?.avatar_url || "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&q=80"}
                  alt={userProfile?.username || "User"}
                  className="w-8 h-8 rounded-full object-cover"
                />
              </button>
              <div className="absolute right-0 mt-2 w-48 bg-[#282828] rounded-lg shadow-lg hidden group-hover:block">
                <div className="p-2">
                  <p className="px-4 py-2 text-sm">{userProfile?.username}</p>
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[#363636] rounded"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAuth(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* corps principal */}
      <div className="flex pt-14">
        {/* Menu latéral */}
        <aside className={`fixed left-0 top-14 h-full bg-[#0f0f0f] transition-all ${isMenuOpen ? 'w-60' : 'w-20'}`}>
          <div className="p-2">
            <div className="flex flex-col gap-1">
              <button 
                onClick={() => {
                  setSelectedVideo(null);
                  setCurrentView('home');
                }}
                className={`flex items-center gap-4 p-2 hover:bg-[#272727] rounded-lg ${currentView === 'home' ? 'bg-[#272727]' : ''}`}
              >
                <Home className="w-6 h-6" />
                {isMenuOpen && <span>Home</span>}
              </button>
              <button 
                onClick={() => {
                  setSelectedVideo(null);
                  setCurrentView('explore');
                }}
                className={`flex items-center gap-4 p-2 hover:bg-[#272727] rounded-lg ${currentView === 'explore' ? 'bg-[#272727]' : ''}`}
              >
                <Compass className="w-6 h-6" />
                {isMenuOpen && <span>Explore</span>}
              </button>
              <button 
                onClick={() => {
                  setSelectedVideo(null);
                  setCurrentView('library');
                }}
                className={`flex items-center gap-4 p-2 hover:bg-[#272727] rounded-lg ${currentView === 'library' ? 'bg-[#272727]' : ''}`}
              >
                <Library className="w-6 h-6" />
                {isMenuOpen && <span>Library</span>}
              </button>
              <button 
                onClick={() => {
                  setSelectedVideo(null);
                  setCurrentView('history');
                }}
                className={`flex items-center gap-4 p-2 hover:bg-[#272727] rounded-lg ${currentView === 'history' ? 'bg-[#272727]' : ''}`}
              >
                <History className="w-6 h-6" />
                {isMenuOpen && <span>History</span>}
              </button>
              <button 
                onClick={() => {
                  setSelectedVideo(null);
                  setCurrentView('liked');
                }}
                className={`flex items-center gap-4 p-2 hover:bg-[#272727] rounded-lg ${currentView === 'liked' ? 'bg-[#272727]' : ''}`}
              >
                <ThumbsUp className="w-6 h-6" />
                {isMenuOpen && <span>Liked Videos</span>}
              </button>
              <button 
                onClick={() => {
                  setSelectedVideo(null);
                  setCurrentView('library');
                }}
                className={`flex items-center gap-4 p-2 hover:bg-[#272727] rounded-lg`}
              >
                <Clock className="w-6 h-6" />
                {isMenuOpen && <span>Watch Later</span>}
              </button>
            </div>
          </div>
        </aside>

        {/* contenu principal */}
        <main className={`flex-1 p-6 ${isMenuOpen ? 'ml-60' : 'ml-20'}`}>
          {renderContent()}
        </main>
      </div>
      {/* fenêtre d'authentification */}
      {showAuth && <Auth onClose={() => setShowAuth(false)} />}
    </div>
  );
}

export default App;
