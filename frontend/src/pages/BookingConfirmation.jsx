import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, QrCode } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const FALLBACK_IMAGES = [
    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=800&q=80',
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80',
    'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&q=80',
    'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=800&q=80'
];

export default function BookingConfirmation() {
    const { bookingId } = useParams();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_URL}/bookings/${bookingId}`)
            .then(res => res.json())
            .then(data => {
                setBooking(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [bookingId]);

    const getPosterUrl = (movieTitle) => {
        const idNum = movieTitle ? movieTitle.length : 0;
        return FALLBACK_IMAGES[idNum % FALLBACK_IMAGES.length];
    };

    if (loading) return null;
    
    if (!booking || booking.error) return <div style={{ textAlign: 'center', padding: '10rem', color: 'var(--c-text-primary)' }}>Error retrieving ticket.</div>;

    const dateStr = booking.ShowDate.split('T')[0];
    const timeStr = booking.ShowTime.substring(0,5);
    const posterUrl = getPosterUrl(booking.MovieTitle);

    return (
        <motion.div 
            initial={{ backgroundColor: 'var(--c-bg-main)' }}
            animate={{ backgroundColor: 'var(--c-bg-main)' }} 
            transition={{ duration: 1 }}
            style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '4rem 2rem',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                style={{ textAlign: 'center', marginBottom: '3rem', zIndex: 10 }}
            >
                <h2 className="font-serif" style={{ fontSize: '2.5rem', color: 'var(--c-text-primary)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>
                    BOOKING CONFIRMED
                </h2>
            </motion.div>

            {/* Premium Physical Ticket */}
            <motion.div 
                initial={{ rotate: -8, y: 100, opacity: 0, scale: 0.9 }}
                animate={{ rotate: 0, y: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 100, damping: 20, delay: 0.2 }}
                style={{ 
                    width: '100%', 
                    maxWidth: '850px', 
                    background: 'var(--c-surface)', // crisp white paper
                    display: 'flex',
                    boxShadow: '0 30px 60px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(176,138,62,0.1)',
                    zIndex: 10,
                    color: 'var(--c-text-primary)',
                    position: 'relative',
                    borderRadius: '8px'
                }}
            >
                {/* Paper texture overlay (subtle) */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    opacity: 0.05,
                    pointerEvents: 'none',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
                    borderRadius: '8px'
                }} />

                {/* Poster Side (Left) */}
                <div style={{ width: '35%', position: 'relative', overflow: 'hidden', borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px' }}>
                    <motion.img 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.95 }}
                        transition={{ delay: 1, duration: 1 }}
                        src={posterUrl} 
                        alt={booking.MovieTitle}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent 0%, var(--c-surface) 100%)' }} />
                </div>

                {/* Details Side (Right) */}
                <div style={{ flex: 1, padding: '4rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative' }}>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.2 }}>
                            <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--c-gold)', letterSpacing: '0.15em', marginBottom: '1rem', fontWeight: 700 }}>
                                ADMIT ONE
                            </div>
                            <h3 className="font-serif" style={{ fontSize: '2.5rem', lineHeight: 1, marginBottom: '0.5rem', textTransform: 'uppercase', color: 'var(--c-text-primary)' }}>
                                {booking.MovieTitle}
                            </h3>
                            <div className="font-sans" style={{ color: 'var(--c-text-secondary)', fontSize: '0.9rem', letterSpacing: '0.05em', fontWeight: 500 }}>
                                {booking.TheatreName} — Screen {booking.ScreenNumber}
                            </div>
                        </motion.div>
                    </div>

                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.4 }} style={{ display: 'flex', gap: '4rem', marginBottom: '3rem' }}>
                        <div>
                            <div className="font-sans" style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>
                                Date
                            </div>
                            <div className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--c-text-primary)' }}>{dateStr}</div>
                        </div>
                        <div>
                            <div className="font-sans" style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>
                                Time
                            </div>
                            <div className="font-serif" style={{ fontSize: '1.5rem', color: 'var(--c-text-primary)' }}>{timeStr}</div>
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1.6 }}
                        style={{ 
                            padding: '1.5rem 0', 
                            borderTop: '1px solid rgba(176,138,62,0.2)',
                            borderBottom: '1px solid rgba(176,138,62,0.2)',
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center' 
                        }}
                    >
                        <div>
                            <div className="font-sans" style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>
                                Seats ({booking.seats.length})
                            </div>
                            <div className="font-serif" style={{ fontSize: '2rem', color: 'var(--c-burgundy)' }}>
                                {booking.seats.join(', ')}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div className="font-sans" style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem', textTransform: 'uppercase', fontWeight: 600 }}>
                                Total
                            </div>
                            <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--c-text-primary)' }}>
                                ₹{booking.TotalAmount}
                            </div>
                        </div>
                    </motion.div>

                    {/* Perforation Line & QR Code */}
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8 }}
                        style={{ 
                            marginTop: '3rem', 
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-end'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <QrCode size={48} color="var(--c-text-primary)" strokeWidth={1} />
                            <div>
                                <div className="font-sans" style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.2rem', fontWeight: 600 }}>
                                    Booking ID
                                </div>
                                <div className="font-mono" style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--c-text-primary)' }}>
                                    #{booking.BookingID}
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--c-gold)' }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: 'rgba(176,138,62,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Check size={10} strokeWidth={3} />
                            </div>
                            <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 600 }}>PAID</span>
                        </div>
                    </motion.div>

                    {/* Perforated edge cuts using Ivory background color */}
                    <div style={{ position: 'absolute', top: -16, left: '60%', width: 32, height: 32, borderRadius: '50%', background: 'var(--c-bg-main)', boxShadow: 'inset 0 -2px 5px rgba(0,0,0,0.05)' }} />
                    <div style={{ position: 'absolute', bottom: -16, left: '60%', width: 32, height: 32, borderRadius: '50%', background: 'var(--c-bg-main)', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05)' }} />
                    <div style={{ position: 'absolute', top: 0, bottom: 0, left: '60%', width: 0, borderLeft: '2px dashed rgba(176,138,62,0.3)', transform: 'translateX(16px)' }} />

                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2 }}
                style={{ marginTop: '4rem', zIndex: 10 }}
            >
                <Link to="/" style={{ 
                    display: 'inline-block',
                    padding: '1rem 3rem',
                    color: 'var(--c-text-primary)',
                    border: '1px solid var(--c-gold)',
                    fontSize: '0.8rem',
                    letterSpacing: '0.15em',
                    textTransform: 'uppercase',
                    transition: 'all 0.3s ease',
                    fontWeight: 600
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--c-surface)';
                    e.currentTarget.style.backgroundColor = 'var(--c-gold)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--c-text-primary)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                }}
                >
                    RETURN TO REPERTOIRE
                </Link>
            </motion.div>
        </motion.div>
    );
}
