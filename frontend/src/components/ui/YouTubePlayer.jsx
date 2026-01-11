/**
 * YouTube Video Player Component
 */
import { useState } from 'react';
import { FiPlay, FiExternalLink } from 'react-icons/fi';

const YouTubePlayer = ({ 
  videoId, 
  title = 'Video', 
  className = '',
  autoplay = false,
  showTitle = true 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!videoId) {
    return (
      <div className={`bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <p className="text-gray-500">No video available</p>
      </div>
    );
  }

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  const handlePlay = () => {
    setIsPlaying(true);
  };

  if (isPlaying) {
    return (
      <div className={`relative ${className}`}>
        <iframe
          src={embedUrl}
          title={title}
          className="w-full h-full rounded-lg"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        {showTitle && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg">
            <h3 className="text-white font-medium text-sm truncate">{title}</h3>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`relative group cursor-pointer ${className}`} onClick={handlePlay}>
      <img
        src={thumbnailUrl}
        alt={title}
        className="w-full h-full object-cover rounded-lg"
        onError={(e) => {
          // Fallback to medium quality thumbnail
          e.target.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }}
      />
      
      {/* Play button overlay */}
      <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors rounded-lg flex items-center justify-center">
        <div className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform shadow-lg">
          <FiPlay className="w-6 h-6 text-white ml-1" />
        </div>
      </div>

      {/* Title overlay */}
      {showTitle && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 rounded-b-lg">
          <h3 className="text-white font-medium text-sm truncate">{title}</h3>
        </div>
      )}

      {/* External link button */}
      <a
        href={watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
        title="Open in YouTube"
      >
        <FiExternalLink className="w-4 h-4" />
      </a>

      {/* Duration badge (if available) */}
      <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
        YouTube
      </div>
    </div>
  );
};

export default YouTubePlayer;