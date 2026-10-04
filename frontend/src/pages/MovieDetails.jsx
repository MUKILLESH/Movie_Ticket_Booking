import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchMovie, fetchShowsForMovie } from '../services/api';
import { getMoviePosterUrl } from '../utils/helpers';
import { format, parseISO } from 'date-fns';
import { ArrowLeft } from 'lucide-react';

export default function MovieDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [movie, setMovie] = useState(null);
    const [shows, setShows] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Selection state
    const [selectedCinema, setSelectedCinema] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [selectedShow, setSelectedShow] = useState(null);

    useEffect(() => {
        Promise.all([fetchMovie(id), fetchShowsForMovie(id)])
            .then(([movieData, showsData]) => {
                setMovie(movieData);
                setShows(showsData);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [id]);



    if (loading) return null;
    if (!movie) return <div style={{ textAlign: 'center', padding: '10rem', color: 'var(--c-text-primary)' }}>Movie not found</div>;

    const showsByTheatre = shows.reduce((acc, show) => {
        if (!acc[show.Theatre]) acc[show.Theatre] = [];
        acc[show.Theatre].push(show);
        return acc;
    }, {});

    const posterUrl = getMoviePosterUrl(movie, parseInt(id));

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{ position: 'relative', minHeight: '100vh', paddingBottom: '6rem', overflow: 'hidden', backgroundColor: 'var(--c-bg-main)' }}
        >
            <div style={{ padding: '8rem 4rem 2rem 4rem', maxWidth: '1440px', margin: '0 auto' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        color: 'var(--c-text-muted)', fontSize: '0.8rem',
                        letterSpacing: '0.15em', textTransform: 'uppercase',
                        marginBottom: '4rem', opacity: 0.8, transition: 'all 0.3s',
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontWeight: 600
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.opacity = 1;
                        e.currentTarget.style.color = 'var(--c-text-primary)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.opacity = 0.8;
                        e.currentTarget.style.color = 'var(--c-text-muted)';
                    }}
                >
                    <ArrowLeft size={16} /> RETURN TO REPERTOIRE
                </button>

                <div style={{ display: 'flex', gap: '8rem', alignItems: 'flex-start' }}>
                    {/* Poster Column - Physical entry from behind */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, z: -200, rotateY: 10, rotateX: 5 }}
                        animate={{ opacity: 1, scale: 1, z: 0, rotateY: 0, rotateX: 0 }}
                        transition={{ delay: 0.1, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        style={{ flexShrink: 0, width: '460px', perspective: '1200px' }}
                    >
                        <div style={{
                            width: '100%',
                            aspectRatio: '2/3',
                            backgroundColor: 'var(--c-surface)',
                            boxShadow: '0 40px 80px rgba(0,0,0,0.1), 0 10px 20px rgba(0,0,0,0.05)',
                            position: 'relative',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            transformStyle: 'preserve-3d',
                            border: '1px solid rgba(176,138,62,0.15)'
                        }}>
                            <img
                                src={posterUrl}
                                alt={movie.Title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                            {/* Inner gold frame */}
                            <div style={{ position: 'absolute', inset: '1rem', border: '1px solid rgba(176,138,62,0.3)', pointerEvents: 'none' }} />
                        </div>
                    </motion.div>

                    {/* Editorial Detail Column - Enters from front/side */}
                    <motion.div
                        initial={{ opacity: 0, x: 80, z: 50 }}
                        animate={{ opacity: 1, x: 0, z: 0 }}
                        transition={{ delay: 0.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        style={{ flex: 1, paddingTop: '4rem' }}
                    >
                        <h1 className="font-serif" style={{ fontSize: '5rem', lineHeight: 0.9, marginBottom: '2rem', letterSpacing: '-0.02em', color: 'var(--c-text-primary)' }}>
                            {movie.Title}
                        </h1>

                        <div className="font-mono" style={{
                            display: 'flex', gap: '2.5rem', color: 'var(--c-gold)',
                            fontSize: '0.85rem', letterSpacing: '0.15em', textTransform: 'uppercase',
                            marginBottom: '4rem', paddingBottom: '2.5rem', borderBottom: '1px solid rgba(176,138,62,0.2)'
                        }}>
                            <span>{movie.Genre}</span>
                            <span>{movie.Language}</span>
                            <span>{movie.Duration} MIN</span>
                        </div>

                        {/* STEP-BY-STEP SELECTION FLOW */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
                            
                            {/* STEP 1: SELECT CINEMA */}
                            <div>
                                <h3 className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--c-text-secondary)', marginBottom: '1.5rem', fontWeight: 400 }}>
                                    1. Select Cinema
                                </h3>
                                {Object.keys(showsByTheatre).length === 0 ? (
                                    <div className="font-sans" style={{ color: 'var(--c-text-muted)', fontStyle: 'italic' }}>
                                        No upcoming screenings available.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        {Object.keys(showsByTheatre).map(theatre => {
                                            const isSelected = selectedCinema === theatre;
                                            return (
                                                <button key={theatre}
                                                    onClick={() => {
                                                        setSelectedCinema(theatre);
                                                        setSelectedDate(null);
                                                        setSelectedShow(null);
                                                    }}
                                                    style={{
                                                        padding: '1rem 2rem',
                                                        backgroundColor: isSelected ? 'var(--c-gold)' : 'transparent',
                                                        color: isSelected ? '#fff' : 'var(--c-text-primary)',
                                                        border: `1px solid ${isSelected ? 'var(--c-gold)' : 'var(--c-border)'}`,
                                                        borderRadius: '4px',
                                                        fontSize: '0.85rem',
                                                        letterSpacing: '0.1em',
                                                        textTransform: 'uppercase',
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    {theatre}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* STEP 2: SELECT DATE */}
                            <AnimatePresence mode="wait">
                                {selectedCinema && (
                                    <motion.div
                                        key="dates"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <h3 className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--c-text-secondary)', marginBottom: '1.5rem', fontWeight: 400 }}>
                                            2. Select Date
                                        </h3>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                            {/* Get unique dates for selected cinema */}
                                            {Array.from(new Set(showsByTheatre[selectedCinema].map(s => s.ShowDate))).sort().map(dateStr => {
                                                const isSelected = selectedDate === dateStr;
                                                const formattedDate = format(parseISO(dateStr), 'EEE, MMM dd');
                                                return (
                                                    <button key={dateStr}
                                                        onClick={() => {
                                                            setSelectedDate(dateStr);
                                                            setSelectedShow(null);
                                                        }}
                                                        style={{
                                                            padding: '1rem 2rem',
                                                            backgroundColor: isSelected ? 'var(--c-gold)' : 'transparent',
                                                            color: isSelected ? '#fff' : 'var(--c-text-primary)',
                                                            border: `1px solid ${isSelected ? 'var(--c-gold)' : 'var(--c-border)'}`,
                                                            borderRadius: '4px',
                                                            fontSize: '0.85rem',
                                                            letterSpacing: '0.1em',
                                                            textTransform: 'uppercase',
                                                            fontWeight: 600,
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                    >
                                                        {formattedDate}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* STEP 3: SELECT SHOWTIME */}
                            <AnimatePresence mode="wait">
                                {selectedDate && (
                                    <motion.div
                                        key="shows"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4 }}
                                    >
                                        <h3 className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--c-text-secondary)', marginBottom: '1.5rem', fontWeight: 400 }}>
                                            3. Select Showtime
                                        </h3>
                                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                            {showsByTheatre[selectedCinema].filter(s => s.ShowDate === selectedDate).sort((a, b) => a.ShowTime.localeCompare(b.ShowTime)).map(show => {
                                                const isSelected = selectedShow?.ShowID === show.ShowID;
                                                const timeStr = show.ShowTime.substring(0, 5);
                                                return (
                                                    <button key={show.ShowID}
                                                        onClick={() => setSelectedShow(show)}
                                                        style={{
                                                            padding: '1rem 2rem',
                                                            backgroundColor: isSelected ? 'var(--c-gold)' : 'transparent',
                                                            color: isSelected ? '#fff' : 'var(--c-text-primary)',
                                                            border: `1px solid ${isSelected ? 'var(--c-gold)' : 'var(--c-border)'}`,
                                                            borderRadius: '4px',
                                                            fontSize: '1.1rem',
                                                            fontFamily: 'var(--font-serif)',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.3s ease'
                                                        }}
                                                    >
                                                        {timeStr}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* STEP 4: CONTINUE TO SEATS */}
                            <AnimatePresence mode="wait">
                                {selectedShow && (
                                    <motion.div
                                        key="continue"
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.4 }}
                                        style={{ marginTop: '2rem' }}
                                    >
                                        <button
                                            onClick={() => navigate(`/shows/${selectedShow.ShowID}/seats`)}
                                            style={{
                                                padding: '1.25rem 3rem',
                                                backgroundColor: 'var(--c-text-primary)',
                                                color: 'var(--c-surface)',
                                                border: 'none',
                                                borderRadius: '4px',
                                                fontSize: '0.9rem',
                                                letterSpacing: '0.15em',
                                                textTransform: 'uppercase',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                                boxShadow: '0 10px 20px rgba(0,0,0,0.1)',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--c-gold)';
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.backgroundColor = 'var(--c-text-primary)';
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                        >
                                            CONTINUE TO SEATS
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
