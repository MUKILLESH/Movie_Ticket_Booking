export const POSTER_MAP = {
    'Avatar': '/posters/avatar.jpg',
    'Baahubali': '/posters/baahubali.jpg',
    'The Dark Knight': '/posters/darkknight.jpg',
    'Inception': '/posters/Inception.jpg',
    'Interstellar': '/posters/interstellar.jpg',
    'KGF': '/posters/KGF.webp',
    'Parasite': '/posters/parasite.jpg',
    'RRR': '/posters/RRR.jpg'
};

const FALLBACK_POSTERS = [
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80',
    'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80'
];

export function getMoviePosterUrl(movie, fallbackId = 0) {
    if (!movie) return FALLBACK_POSTERS[0];
    
    // Check our local poster map first
    if (movie.Title && POSTER_MAP[movie.Title]) {
        return POSTER_MAP[movie.Title];
    }
    
    // Sometimes the booking object has MovieTitle instead of Title
    const title = movie.Title || movie.MovieTitle;
    if (title && POSTER_MAP[title]) {
        return POSTER_MAP[title];
    }
    
    // If the DB provides a valid PosterURL that isn't a fallback, use it
    if (movie.PosterURL && !movie.PosterURL.includes('source.unsplash.com')) {
        return movie.PosterURL;
    }
    
    // Default fallback
    return FALLBACK_POSTERS[fallbackId % FALLBACK_POSTERS.length];
}
