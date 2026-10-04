import React, { useEffect, useState } from 'react';
import { getMyBookings } from '../services/api';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Ticket as TicketIcon } from 'lucide-react';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);    useEffect(() => {
        getMyBookings()
            .then(data => {
                setBookings(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    if (loading) {
        return <div style={{ paddingTop: '120px', textAlign: 'center' }}>Loading...</div>;
    }

    return (
        <div style={{ paddingTop: '100px', paddingBottom: '6rem', maxWidth: '900px', margin: '0 auto', minHeight: '100vh', padding: '100px 2rem 6rem 2rem' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '3rem', color: 'var(--c-text-main)' }}>My Tickets</h1>
            {bookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', backgroundColor: 'var(--c-bg-secondary)', borderRadius: '12px' }}>
                    <TicketIcon size={48} style={{ margin: '0 auto 1rem auto', color: 'var(--c-text-muted)' }} />
                    <p style={{ fontSize: '1.2rem', color: 'var(--c-text-secondary)', marginBottom: '1.5rem' }}>You have no bookings yet.</p>
                    <a href="/movies" style={{ display: 'inline-block', padding: '0.75rem 1.5rem', backgroundColor: 'var(--c-accent-main)', color: '#fff', borderRadius: '4px', textDecoration: 'none', fontWeight: 600 }}>
                        Browse Movies
                    </a>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    {bookings.map(booking => {
                        const showDate = new Date(booking.ShowDate);
                        const isPast = showDate < new Date();
                        
                        return (
                        <motion.div
                            key={booking.BookingID}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                display: 'flex',
                                backgroundColor: '#fff',
                                borderRadius: '12px',
                                overflow: 'hidden',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                                border: '1px solid var(--c-border)',
                                position: 'relative',
                                filter: booking.Status === 'CANCELLED' || isPast ? 'grayscale(100%) opacity(0.7)' : 'none'
                            }}
                        >
                            {/* Left: Poster */}
                            <div style={{ width: '180px', flexShrink: 0, backgroundColor: '#000' }}>
                                <img 
                                    src={booking.PosterURL || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800'} 
                                    alt={booking.MovieTitle} 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                />
                            </div>

                            {/* Middle: Details */}
                            <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderRight: '2px dashed var(--c-border)' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', margin: 0 }}>{booking.MovieTitle}</h3>
                                        <span style={{
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '4px',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            backgroundColor: booking.Status === 'CONFIRMED' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                                            color: booking.Status === 'CONFIRMED' ? '#2e7d32' : '#c62828'
                                        }}>
                                            {booking.Status}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--c-text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                                        <MapPin size={16} />
                                        <span>{booking.TheatreName}</span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--c-text-muted)', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Date</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                                                <Calendar size={16} color="var(--c-accent-main)" />
                                                {showDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                            </div>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--c-text-muted)', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Time</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                                                <Clock size={16} color="var(--c-accent-main)" />
                                                {booking.StartTime ? booking.StartTime.slice(0, 5) : 'TBD'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--c-text-muted)', marginBottom: '0.25rem', letterSpacing: '0.05em' }}>Seats</p>
                                    <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '1.1rem', color: 'var(--c-text-main)' }}>
                                        {booking.Seats || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Right: Barcode & Stub Info */}
                            <div style={{ width: '200px', flexShrink: 0, padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#faf9f7' }}>
                                <div style={{ textAlign: 'center', width: '100%' }}>
                                    <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Booking ID</p>
                                    <p style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.2rem', margin: 0 }}>#{booking.BookingID}</p>
                                </div>
                                
                                {/* Fake Barcode */}
                                <div style={{ width: '100%', height: '60px', display: 'flex', gap: '2px', opacity: 0.7, margin: '1.5rem 0' }}>
                                    {[...Array(24)].map((_, i) => (
                                        <div key={i} style={{ 
                                            flex: Math.random() > 0.5 ? 2 : 1, 
                                            backgroundColor: '#000',
                                            height: '100%',
                                            opacity: Math.random() > 0.8 ? 0 : 1
                                        }}></div>
                                    ))}
                                </div>

                                <div style={{ textAlign: 'center', width: '100%' }}>
                                    <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>Total Paid</p>
                                    <p style={{ fontFamily: 'var(--font-serif)', fontWeight: 600, fontSize: '1.5rem', margin: 0, color: 'var(--c-accent-main)' }}>₹{booking.TotalAmount}</p>
                                </div>

                                {/* Half circle cutouts for ticket effect */}
                                <div style={{ position: 'absolute', top: '-15px', right: '185px', width: '30px', height: '30px', backgroundColor: 'var(--c-bg-main)', borderRadius: '50%', boxShadow: 'inset 0 -2px 5px rgba(0,0,0,0.05)' }}></div>
                                <div style={{ position: 'absolute', bottom: '-15px', right: '185px', width: '30px', height: '30px', backgroundColor: 'var(--c-bg-main)', borderRadius: '50%', boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.05)' }}></div>
                            </div>
                        </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MyBookings;
