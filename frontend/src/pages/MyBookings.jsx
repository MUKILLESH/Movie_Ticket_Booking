import React, { useEffect, useState } from 'react';
import { getMyBookings } from '../services/api';
import { motion } from 'framer-motion';

const MyBookings = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        <div style={{ paddingTop: '120px', paddingBottom: '4rem', maxWidth: '800px', margin: '0 auto', minHeight: '100vh' }}>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '2rem' }}>My Bookings</h1>
            {bookings.length === 0 ? (
                <p>You have no bookings yet.</p>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {bookings.map(booking => (
                        <motion.div 
                            key={booking.BookingID}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                padding: '1.5rem',
                                border: '1px solid rgba(176,138,62,0.3)',
                                borderRadius: '8px',
                                backgroundColor: 'rgba(255,255,255,0.5)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{booking.MovieTitle}</h3>
                                    <p style={{ color: 'var(--c-text-muted)', fontSize: '0.9rem' }}>{booking.TheatreName}</p>
                                </div>
                                <span style={{
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '20px',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold',
                                    backgroundColor: booking.Status === 'CONFIRMED' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
                                    color: booking.Status === 'CONFIRMED' ? '#2e7d32' : '#c62828'
                                }}>
                                    {booking.Status}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                <span><strong>Date:</strong> {new Date(booking.BookingDate).toLocaleDateString()}</span>
                                <span><strong>Amount:</strong> ₹{booking.TotalAmount}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyBookings;
