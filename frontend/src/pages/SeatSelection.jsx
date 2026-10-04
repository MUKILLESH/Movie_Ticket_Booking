import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Ticket } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// --- 2D Seat Grid Component ---
function SeatGrid({ seats, selectedSeats, recommendedSeats, onSeatClick, algorithmState }) {
    // Group seats by row (assuming SeatNumber is like 'A1', 'A2')
    const rows = {};
    seats.forEach(seat => {
        const row = seat.SeatNumber.charAt(0);
        if (!rows[row]) rows[row] = [];
        rows[row].push(seat);
    });

    // Sort rows (A-Z) and seats within rows by number
    const sortedRows = Object.keys(rows).sort();
    sortedRows.forEach(row => {
        rows[row].sort((a, b) => {
            const numA = parseInt(a.SeatNumber.slice(1));
            const numB = parseInt(b.SeatNumber.slice(1));
            return numA - numB;
        });
    });

    return (
        <div style={{ padding: '2rem 4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            
            {/* Legend */}
            <div style={{ display: 'flex', gap: '2rem', marginBottom: '3rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--c-text-secondary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 24, height: 24, backgroundColor: '#eaeaea', borderRadius: '4px' }}></div>
                    <span>Standard</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 24, height: 24, backgroundColor: '#f7f0df', border: '1px solid #d4c5a3', borderRadius: '4px' }}></div>
                    <span>Premium</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 24, height: 24, backgroundColor: '#222222', borderRadius: '4px' }}></div>
                    <span>Booked</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 24, height: 24, backgroundColor: '#5D111A', borderRadius: '4px' }}></div>
                    <span>Selected</span>
                </div>
            </div>

            {/* Screen indicator */}
            <div style={{ marginBottom: '4rem', width: '80%', maxWidth: '800px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '100%', height: '8px', background: 'linear-gradient(to bottom, #d4c5a3, transparent)', borderRadius: '50% 50% 0 0 / 100% 100% 0 0' }}></div>
                <span className="font-sans" style={{ marginTop: '0.5rem', fontSize: '0.65rem', letterSpacing: '0.3em', color: 'var(--c-text-muted)' }}>SCREEN</span>
            </div>

            {/* Seats Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%', maxWidth: '800px' }}>
                {sortedRows.map(row => (
                    <div key={row} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                        <div className="font-mono" style={{ width: '30px', color: 'var(--c-text-muted)', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>
                            {row}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', flex: 1 }}>
                            {rows[row].map(seat => {
                                const isBooked = seat.Status === 'booked' || seat.Status === 'BOOKED';
                                const isSelected = selectedSeats.has(seat.SeatID);
                                const isRecommended = recommendedSeats.has(seat.SeatID);
                                const isPremium = seat.SeatType?.toUpperCase() === 'PREMIUM';

                                let bgColor = '#eaeaea';
                                let textColor = '#171615';
                                let border = '1px solid transparent';
                                let cursor = 'pointer';

                                if (isBooked) {
                                    bgColor = '#222222';
                                    textColor = '#444';
                                    cursor = 'not-allowed';
                                } else if (isSelected) {
                                    bgColor = '#5D111A';
                                    textColor = '#fff';
                                } else if (isRecommended) {
                                    bgColor = '#B08A3E';
                                    textColor = '#fff';
                                } else if (isPremium) {
                                    bgColor = '#f7f0df';
                                    textColor = '#B08A3E';
                                    border = '1px solid #d4c5a3';
                                }

                                return (
                                    <button
                                        key={seat.SeatID}
                                        onClick={() => !isBooked && onSeatClick(seat)}
                                        disabled={isBooked || algorithmState === 'analyzing' || algorithmState === 'finding'}
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            backgroundColor: bgColor,
                                            color: textColor,
                                            border: border,
                                            borderRadius: '6px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '0.75rem',
                                            fontFamily: 'var(--font-sans)',
                                            fontWeight: 600,
                                            cursor: cursor,
                                            transition: 'all 0.2s',
                                            opacity: (algorithmState === 'analyzing' || algorithmState === 'finding') ? 0.6 : 1,
                                            boxShadow: isSelected ? '0 4px 10px rgba(93,17,26,0.3)' : 'none',
                                            transform: isSelected ? 'scale(1.1)' : 'scale(1)'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isBooked && !isSelected && algorithmState === 'idle') {
                                                e.currentTarget.style.transform = 'scale(1.05)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isBooked && !isSelected) {
                                                e.currentTarget.style.transform = 'scale(1)';
                                            }
                                        }}
                                    >
                                        {seat.SeatNumber.slice(1)}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="font-mono" style={{ width: '30px', color: 'var(--c-text-muted)', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>
                            {row}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Main Component
export default function SeatSelection() {
    const { showId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState(new Set());
    const [recommendedSeats, setRecommendedSeats] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState(null);
    const [groupSize, setGroupSize] = useState(2);
    const [algorithmState, setAlgorithmState] = useState('idle');

    useEffect(() => {
        setLoading(true);
        fetchSeatsForShow(showId)
            .then(data => {
                setSeats(data);
                setLoading(false);
            })
            .catch(err => {
                setError(err.message);
                setLoading(false);
            });
    }, [showId]);

    const handleSeatClick = (seat) => {
        if (algorithmState === 'analyzing' || algorithmState === 'finding') return;

        const newSelected = new Set(selectedSeats);
        if (newSelected.has(seat.SeatID)) {
            newSelected.delete(seat.SeatID);
        } else {
            newSelected.add(seat.SeatID);
        }
        setSelectedSeats(newSelected);
        setRecommendedSeats(new Set());
        setAlgorithmState('idle');
    };

    const handleFindBestSeats = async () => {
        if (algorithmState === 'analyzing' || algorithmState === 'finding') return;

        setError(null);
        setRecommendedSeats(new Set());
        setSelectedSeats(new Set());

        // Phase 1: Analyzing...
        setAlgorithmState('analyzing');
        await new Promise(r => setTimeout(r, 1200));

        // Phase 2: Scanning...
        setAlgorithmState('finding');
        await new Promise(r => setTimeout(r, 1500));

        try {
            // Phase 3: Backend returns
            const result = await recommendSeats(showId, groupSize);
            const recSeatIds = result.recommendedSeats.map(s => s.SeatID);

            setRecommendedSeats(new Set(recSeatIds));
            setSelectedSeats(new Set(recSeatIds));

            // Phase 4: Focus and elevate
            setAlgorithmState('done');
        } catch (err) {
            setError(err.message);
            setAlgorithmState('idle');
        }
    };

    const handleBook = async () => {
        if (selectedSeats.size === 0) return;
        setBooking(true);
        setError(null);
        try {
            const result = await createBooking(showId, Array.from(selectedSeats), 'UPI');
            setTimeout(() => navigate(`/booking/${result.booking.bookingId}`), 500);
        } catch (err) {
            setError(err.message);
            fetchSeatsForShow(showId).then(setSeats);
            setSelectedSeats(new Set());
            setBooking(false);
        }
    };

    if (loading) return null;

    const totalPrice = Array.from(selectedSeats).reduce((total, id) => {
        const seat = seats.find(s => s.SeatID === id);
        return total + parseFloat(seat.Price || 0);
    }, 0);

    const selectedSeatNames = Array.from(selectedSeats).map(id => seats.find(s => s.SeatID === id)?.SeatNumber).sort().join(' · ');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                overflow: 'hidden',
                backgroundColor: 'var(--c-bg-main)'
            }}
        >
            {/* Top Navigation Overlay */}
            <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                display: 'flex',
                height: '80px',
                zIndex: 50,
                pointerEvents: 'none' // Let clicks pass through except on nav items
            }}>
                {/* Left side (72%) Nav */}
                <div style={{ width: '72%', padding: '0 4rem', display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <button
                        onClick={() => navigate('/')}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                            color: 'var(--c-text-primary)', pointerEvents: 'auto'
                        }}
                    >
                        <ArrowLeft size={20} />
                        <span className="font-serif" style={{ fontSize: '1.5rem', fontWeight: 600 }}>CineTicket</span>
                    </button>
                </div>
                {/* Right side (28%) Nav */}
                <div style={{ width: '28%', padding: '0 3rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', gap: '2rem', pointerEvents: 'auto' }}>
                        <Link to="/" className="font-sans" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', cursor: 'pointer', color: 'var(--c-text-primary)', textDecoration: 'none' }}>MOVIES</Link>
                        <Link to="/my-bookings" className="font-sans" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', cursor: 'pointer', color: 'var(--c-text-primary)', textDecoration: 'none' }}>MY BOOKINGS</Link>
                    </div>
                    {user?.role === 'ADMIN' && (
                        <Link to="/demo" className="font-sans" style={{ textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', color: 'var(--c-gold)', display: 'flex', alignItems: 'center', gap: '0.5rem', pointerEvents: 'auto' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--c-gold)' }} /> DBMS LAB
                        </Link>
                    )}
                </div>
            </div>

            {/* Left: 72% 2D Theatre Grid Viewport */}
            <div style={{ width: '72%', position: 'relative', backgroundColor: 'var(--c-bg-main)', overflowY: 'auto', paddingTop: '6rem' }}>
                <SeatGrid
                    seats={seats}
                    selectedSeats={selectedSeats}
                    recommendedSeats={recommendedSeats}
                    onSeatClick={handleSeatClick}
                    algorithmState={algorithmState}
                />

                {/* Visualizer Status Overlay */}
                <AnimatePresence mode="wait">
                    {algorithmState !== 'idle' && (
                        <motion.div
                            key={algorithmState}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            style={{
                                position: 'absolute',
                                bottom: '4rem',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                zIndex: 10,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                pointerEvents: 'none'
                            }}
                        >
                            <span className="font-sans" style={{
                                fontSize: '1rem',
                                letterSpacing: '0.2em',
                                textTransform: 'uppercase',
                                color: algorithmState === 'done' ? 'var(--c-gold)' : 'var(--c-text-primary)',
                                marginBottom: '0.5rem',
                                fontWeight: 600
                            }}>
                                {algorithmState === 'analyzing' && 'ANALYZING SEATING...'}
                                {algorithmState === 'finding' && 'LOCATING OPTIMAL BLOCK...'}
                                {algorithmState === 'done' && 'RECOMMENDED POSITION'}
                            </span>
                            {algorithmState === 'done' && (
                                <span className="font-serif" style={{ fontSize: '2rem', color: 'var(--c-text-primary)' }}>
                                    {selectedSeatNames}
                                </span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Vertical Divider */}
            <div style={{ width: '1px', backgroundColor: 'rgba(176,138,62,0.15)', height: '100%', zIndex: 20 }} />

            {/* Right: 28% Booking Summary Ticket & Panel */}
            <div style={{
                width: '28%',
                backgroundColor: 'var(--c-bg-main)',
                padding: '8rem 3rem 4rem 3rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                zIndex: 20,
                position: 'relative'
            }}>
                {/* Subtle Cinematic Background Motifs */}
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.04, backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.8\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />

                {error && (
                    <div className="font-mono" style={{ color: '#5D111A', fontSize: '0.75rem', marginBottom: '1rem', padding: '0.75rem', border: '1px solid var(--c-burgundy)', backgroundColor: 'rgba(124, 31, 42, 0.05)' }}>
                        {error}
                    </div>
                )}

                <div style={{ marginBottom: '4rem', zIndex: 2 }}>
                    <h3 className="font-serif" style={{ fontSize: '2.5rem', marginBottom: '2rem', color: 'var(--c-text-primary)' }}>
                        SEAT SELECTION
                    </h3>

                    <label className="font-sans" style={{ display: 'block', fontSize: '0.75rem', color: 'var(--c-text-muted)', letterSpacing: '0.15em', marginBottom: '1rem', textTransform: 'uppercase', fontWeight: 600 }}>
                        Group Size
                    </label>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                        <input
                            type="number"
                            min="1" max="10"
                            value={groupSize}
                            onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                            className="font-sans"
                            style={{
                                width: '80px',
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(23, 22, 21, 0.1)',
                                color: 'var(--c-text-primary)',
                                textAlign: 'center',
                                padding: '0.75rem',
                                fontSize: '1.25rem',
                                outline: 'none'
                            }}
                        />
                        <button
                            onClick={handleFindBestSeats}
                            disabled={algorithmState === 'analyzing' || algorithmState === 'finding'}
                            className="font-sans"
                            style={{
                                flex: 1,
                                backgroundColor: 'transparent',
                                border: '1px solid var(--c-gold)',
                                color: 'var(--c-gold)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.15em',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                transition: 'all 0.3s ease',
                                cursor: 'pointer',
                                opacity: (algorithmState === 'analyzing' || algorithmState === 'finding') ? 0.5 : 1
                            }}
                            onMouseEnter={(e) => {
                                if (algorithmState === 'analyzing' || algorithmState === 'finding') return;
                                e.currentTarget.style.backgroundColor = 'var(--c-surface)';
                                e.currentTarget.style.borderColor = 'var(--c-gold-light)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderColor = 'var(--c-gold)';
                            }}
                        >
                            Find Best Seats
                        </button>
                    </div>
                </div>

                {/* Physical Ticket Stub Summary */}
                <div style={{
                    backgroundColor: 'var(--c-surface)', // Crisp white
                    color: 'var(--c-text-primary)',
                    padding: '2.5rem',
                    position: 'relative',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.02)',
                    borderRadius: '8px',
                    zIndex: 2,
                    border: '1px solid rgba(176,138,62,0.1)'
                }}>
                    <div style={{ borderBottom: '1px dashed rgba(0,0,0,0.15)', marginBottom: '2rem', paddingBottom: '1.5rem' }}>
                        <div className="font-sans" style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-text-muted)', marginBottom: '0.75rem' }}>
                            SELECTED SEATS
                        </div>
                        <div className="font-serif" style={{ fontSize: '2.2rem', minHeight: '3rem', color: 'var(--c-burgundy)' }}>
                            {selectedSeats.size > 0 ? selectedSeatNames : '---'}
                        </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
                        <div className="font-sans" style={{ fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: 'var(--c-text-muted)' }}>
                            TOTAL
                        </div>
                        <div className="font-sans" style={{ fontSize: '2.2rem', lineHeight: 1, fontWeight: 700, color: 'var(--c-text-primary)' }}>
                            ₹{totalPrice}
                        </div>
                    </div>

                    <button
                        onClick={handleBook}
                        disabled={booking || selectedSeats.size === 0}
                        style={{
                            width: '100%',
                            backgroundColor: selectedSeats.size > 0 ? 'var(--c-burgundy)' : '#D3CCC1',
                            color: selectedSeats.size > 0 ? 'var(--c-surface)' : '#8A857D',
                            padding: '1.25rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.15em',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '0.5rem',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: selectedSeats.size > 0 ? 'pointer' : 'not-allowed',
                            transition: 'all 0.3s',
                            boxShadow: selectedSeats.size > 0 ? '0 10px 20px rgba(124, 31, 42, 0.15)' : 'none'
                        }}
                        onMouseEnter={(e) => {
                            if (selectedSeats.size > 0 && !booking) {
                                e.currentTarget.style.backgroundColor = '#5D111A';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (selectedSeats.size > 0 && !booking) {
                                e.currentTarget.style.backgroundColor = 'var(--c-burgundy)';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }
                        }}
                    >
                        <Ticket size={16} />
                        {booking ? 'PROCESSING...' : 'CONFIRM BOOKING'}
                    </button>

                    {/* Ticket Perforations (Cutouts) */}
                    <div style={{ position: 'absolute', top: '45%', left: '-12px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--c-bg-main)', borderRight: '1px solid rgba(176,138,62,0.1)' }} />
                    <div style={{ position: 'absolute', top: '45%', right: '-12px', width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--c-bg-main)', borderLeft: '1px solid rgba(176,138,62,0.1)' }} />
                </div>
            </div>
        </motion.div>
    );
}
