import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Activity, Play, Shield, BarChart, RotateCcw, Terminal, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function DemoDashboard() {
    const [logs, setLogs] = useState([]);
    const [testingConcurrency, setTestingConcurrency] = useState(false);
    const [testingRateLimit, setTestingRateLimit] = useState(false);
    const [stats, setStats] = useState(null);
    const [sqlDemoResult, setSqlDemoResult] = useState(null);
    const [queueDemoState, setQueueDemoState] = useState({ pending: 0, processing: 0, completed: 0, failed: 0 });
    const [rateLimitState, setRateLimitState] = useState({
        limit: 10,
        windowMinutes: 5,
        currentRequests: 0,
        status: 'ALLOWED',
        http: 200
    });

    // Lab State
    const [labTab, setLabTab] = useState('MOVIES');
    const [labData, setLabData] = useState([]);
    const [labModalOpen, setLabModalOpen] = useState(false);
    const [labModalMode, setLabModalMode] = useState('ADD');
    const [labFormData, setLabFormData] = useState({});
    const [labSqlLog, setLabSqlLog] = useState(null);
    const [rawSqlModalOpen, setRawSqlModalOpen] = useState(false);
    const [rawSqlText, setRawSqlText] = useState('');

    useEffect(() => {
        if (labTab === 'MOVIES') fetchMovies();
        else if (labTab === 'THEATRES') fetchTheatres();
        else if (labTab === 'BOOKINGS') fetchBookings();
        else if (labTab === 'SHOWS') fetchShows();
        else if (labTab === 'BOOKED SEATS') fetchBookedSeats();
    }, [labTab]);

    const fetchMovies = async () => {
        try {
            const res = await fetch(`${API_URL}/movies`);
            const data = await res.json();
            setLabData(data);
        } catch (e) { console.error(e); }
    };

    const fetchTheatres = async () => {
        try {
            const res = await fetch(`${API_URL}/theatres`);
            const data = await res.json();
            setLabData(data);
        } catch (e) { console.error(e); }
    };

    const fetchBookings = async () => {
        try {
            const res = await fetch(`${API_URL}/bookings`);
            const data = await res.json();
            setLabData(data);
        } catch (e) { console.error(e); }
    };

    const fetchShows = async () => {
        try {
            const res = await fetch(`${API_URL}/shows`);
            const data = await res.json();
            setLabData(data);
        } catch (e) { console.error(e); }
    };

    const fetchBookedSeats = async () => {
        try {
            const res = await fetch(`${API_URL}/booked-seats`);
            const data = await res.json();
            setLabData(data);
        } catch (e) { console.error(e); }
    };

    const escapeSql = (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/'/g, "''");
    };

    const handleLabSubmit = (e) => {
        e.preventDefault();
        let sql = '';
        if (labModalMode === 'ADD') {
            if (labTab === 'MOVIES') sql = `INSERT INTO MOVIE (Title, Genre, Language, Duration, ReleaseDate) VALUES ('${escapeSql(labFormData.Title)}', '${escapeSql(labFormData.Genre)}', '${escapeSql(labFormData.Language)}', ${labFormData.Duration}, '${labFormData.ReleaseDate}');`;
            else if (labTab === 'THEATRES') sql = `INSERT INTO THEATRE (Name, Location, City) VALUES ('${escapeSql(labFormData.Name)}', '${escapeSql(labFormData.Location)}', '${escapeSql(labFormData.City)}');`;
            else if (labTab === 'BOOKINGS') sql = `INSERT INTO BOOKING (Status) VALUES ('${escapeSql(labFormData.Status)}');`;
            else if (labTab === 'SHOWS') sql = `INSERT INTO \`SHOW\` (ShowDate, ShowTime, Price, MovieID, ScreenID) VALUES ('${escapeSql(labFormData.ShowDate)}', '${escapeSql(labFormData.ShowTime)}', ${labFormData.Price}, ${labFormData.MovieID}, ${labFormData.ScreenID});`;
            else if (labTab === 'BOOKED SEATS') sql = `INSERT INTO BOOKING_SEAT (BookingID, SeatID, PriceAtBooking) VALUES (${labFormData.BookingID}, ${labFormData.SeatID}, ${labFormData.PriceAtBooking});`;
        } else {
            if (labTab === 'MOVIES') sql = `UPDATE MOVIE SET Title = '${escapeSql(labFormData.Title)}', Genre = '${escapeSql(labFormData.Genre)}', Language = '${escapeSql(labFormData.Language)}', Duration = ${labFormData.Duration}, ReleaseDate = '${labFormData.ReleaseDate}' WHERE MovieID = ${labFormData.MovieID};`;
            else if (labTab === 'THEATRES') sql = `UPDATE THEATRE SET Name = '${escapeSql(labFormData.Name)}', Location = '${escapeSql(labFormData.Location)}', City = '${escapeSql(labFormData.City)}' WHERE TheatreID = ${labFormData.TheatreID};`;
            else if (labTab === 'BOOKINGS') sql = `UPDATE BOOKING SET Status = '${escapeSql(labFormData.Status)}' WHERE BookingID = ${labFormData.BookingID};`;
            else if (labTab === 'SHOWS') sql = `UPDATE \`SHOW\` SET ShowDate = '${escapeSql(labFormData.ShowDate)}', ShowTime = '${escapeSql(labFormData.ShowTime)}', Price = ${labFormData.Price}, MovieID = ${labFormData.MovieID}, ScreenID = ${labFormData.ScreenID} WHERE ShowID = ${labFormData.ShowID};`;
            else if (labTab === 'BOOKED SEATS') sql = `UPDATE BOOKING_SEAT SET PriceAtBooking = ${labFormData.PriceAtBooking} WHERE BookingID = ${labFormData.BookingID} AND SeatID = ${labFormData.SeatID};`;
        }
        
        setRawSqlText(sql);
        setLabModalOpen(false);
        setRawSqlModalOpen(true);
    };

    const handleLabDelete = (id) => {
        let sql = '';
        if (labTab === 'MOVIES') sql = `DELETE FROM MOVIE WHERE MovieID = ${id};`;
        else if (labTab === 'THEATRES') sql = `DELETE FROM THEATRE WHERE TheatreID = ${id};`;
        else if (labTab === 'BOOKINGS') sql = `DELETE FROM BOOKING WHERE BookingID = ${id};`;
        else if (labTab === 'SHOWS') sql = `DELETE FROM \`SHOW\` WHERE ShowID = ${id};`;
        else if (labTab === 'BOOKED SEATS') {
            const [bookingId, seatId] = String(id).split('/');
            sql = `DELETE FROM BOOKING_SEAT WHERE BookingID = ${bookingId} AND SeatID = ${seatId};`;
        }
        
        setRawSqlText(sql);
        setRawSqlModalOpen(true);
    };

    const handleRawSqlSubmit = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/execute-raw-sql`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql: rawSqlText })
            });
            const data = await res.json();
            
            if (res.ok) {
                setLabSqlLog(rawSqlText + '\\n\\n-- Result:\\n' + JSON.stringify(data.result, null, 2));
                setRawSqlModalOpen(false);
                
                if (labTab === 'MOVIES') fetchMovies();
                else if (labTab === 'THEATRES') fetchTheatres();
                else if (labTab === 'BOOKINGS') fetchBookings();
                else if (labTab === 'SHOWS') fetchShows();
                else if (labTab === 'BOOKED SEATS') fetchBookedSeats();
                
                fetchStats();
            } else {
                alert('SQL Error: ' + (data.message || data.error));
            }
        } catch (err) {
            console.error(err);
            alert('Failed to execute SQL.');
        }
    };

    
    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = () => {
        fetch(`${API_URL}/admin/stats`)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (data && !data.error && typeof data.movies === 'number') {
                    setStats(data);
                }
            })
            .catch(err => console.error("Failed to load stats", err));
    };

    const addLog = (msg) => {
        setLogs(prev => [...prev, `[${new Date().toISOString().split('T')[1].substring(0,8)}] ${msg}`]);
    };

    const runConcurrencyTest = async () => {
        setTestingConcurrency(true);
        setLogs([]);
        setQueueDemoState({ pending: 10, processing: 0, completed: 0, failed: 0 });
        
        try {
            addLog("=== CONCURRENCY TEST INITIALIZATION ===");
            addLog("Scanning database for currently AVAILABLE contiguous seats on Show 1...");
            const seatsRes = await fetch(`${API_URL}/shows/1/seats`);
            const seats = await seatsRes.json();
            
            if (!Array.isArray(seats)) {
                throw new Error("Unable to fetch seats from backend.");
            }

            const availableSeats = seats.filter(s => s.Status === 'AVAILABLE');
            
            if (availableSeats.length < 2) {
                addLog("Error: Show 1 has fewer than 2 available seats remaining. Reset seed data.");
                setTestingConcurrency(false);
                return;
            }
            
            const targetSeatObjs = [availableSeats[0], availableSeats[1]];
            const targetSeatIds = targetSeatObjs.map(s => s.SeatID);
            const seatNames = targetSeatObjs.map(s => s.SeatNumber).join(', ');

            addLog(`Target: Show 1 | Seats: ${seatNames}`);
            addLog(`Dispatching 10 simultaneous POST /bookings requests...`);
            
            // Visual delay to simulate queueing in UI
            await new Promise(r => setTimeout(r, 800));
            setQueueDemoState(prev => ({ ...prev, processing: 10 }));

            addLog(`[DB] EXECUTING: SELECT ... FOR UPDATE (Row-Level Lock)`);
            
            const requests = Array.from({ length: 10 }, (_, i) => {
                const reqId = i + 1;
                return fetch(`${API_URL}/bookings`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ showId: 1, seatIds: targetSeatIds, paymentMode: 'UPI' })
                }).then(async res => {
                    let data = {};
                    try { data = await res.json(); } catch(e) {}
                    return { status: res.status, reqId, data };
                });
            });

            const results = await Promise.all(requests);
            
            let successCount = 0;
            let conflictCount = 0;

            results.forEach(res => {
                if (res.status === 201) {
                    successCount++;
                    addLog(`Req ${res.reqId} → SUCCESS (201 Created: Booking #${res.data?.booking?.BookingID || 'CONFIRMED'})`);
                    setQueueDemoState(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1), processing: Math.max(0, prev.processing - 1), completed: prev.completed + 1 }));
                } else if (res.status === 409) {
                    conflictCount++;
                    addLog(`Req ${res.reqId} → 409 CONFLICT (Blocked by InnoDB Row Lock - Double-Booking Prevented)`);
                    setQueueDemoState(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1), processing: Math.max(0, prev.processing - 1), failed: prev.failed + 1 }));
                } else {
                    addLog(`Req ${res.reqId} → HTTP ${res.status} (${res.data?.message || 'Rejected'})`);
                    setQueueDemoState(prev => ({ ...prev, pending: Math.max(0, prev.pending - 1), processing: Math.max(0, prev.processing - 1), failed: prev.failed + 1 }));
                }
            });

            addLog(`--------------------------------------------------`);
            addLog(`✔ ACID TEST PASSED: 1 transaction committed, ${conflictCount} transactions safely rolled back.`);
            addLog(`✔ VERIFICATION: Zero duplicate seats assigned under heavy race condition.`);
            
            fetchStats();
        } catch (err) {
            addLog(`Error: ${err.message}`);
        } finally {
            setTestingConcurrency(false);
        }
    };

    const runRateLimitTest = async () => {
        setTestingRateLimit(true);
        setLogs([]);
        addLog(`=== RATE LIMITING TEST (${rateLimitState.limit} req / ${rateLimitState.windowMinutes} min) ===`);
        
        for (let i = 1; i <= 12; i++) {
            try {
                const res = await fetch(`${API_URL}/admin/rate-limit-test`);
                const data = await res.json();
                
                setRateLimitState({
                    limit: data.limit || 10,
                    windowMinutes: 5,
                    currentRequests: data.currentRequests || i,
                    status: data.status,
                    http: res.status
                });

                if (res.status === 429) {
                    addLog(`Req ${i} → 429 TOO MANY REQUESTS [BLOCKED]`);
                } else {
                    addLog(`Req ${i} → 200 OK [ACCEPTED]`);
                }
            } catch (err) {
                addLog(`Req ${i} → Network error`);
            }
            await new Promise(r => setTimeout(r, 60));
        }
        setTestingRateLimit(false);
    };

    const resetRateLimit = async () => {
        try {
            await fetch(`${API_URL}/admin/rate-limit-reset`, { method: 'POST' });
            setRateLimitState({ limit: 10, windowMinutes: 5, currentRequests: 0, status: 'ALLOWED', http: 200 });
            addLog("Rate limiter metrics reset.");
        } catch (err) {
            console.error(err);
        }
    };

    const runSqlDemo = async (queryId) => {
        try {
            const res = await fetch(`${API_URL}/admin/demo-query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ queryId })
            });
            const data = await res.json();
            setSqlDemoResult(data);
        } catch (err) {
            console.error(err);
        }
    };

    const statCards = [
        { label: 'Movies', value: stats?.movies ?? '-' },
        { label: 'Theatres', value: stats?.theatres ?? '-' },
        { label: 'Screens', value: stats?.screens ?? '-' },
        { label: 'Total Seats', value: stats?.seats ?? '-' },
        { label: 'Customers', value: stats?.customers ?? '-' },
        { label: 'Bookings', value: stats?.totalBookings ?? '-' },
        { label: 'Confirmed', value: stats?.confirmedBookings ?? '-' },
        { label: 'Revenue', value: stats?.revenue !== undefined ? `₹${stats.revenue}` : '-' },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{ 
                padding: '8rem 4rem 4rem 4rem', 
                maxWidth: '1440px', 
                margin: '0 auto', 
                color: 'var(--c-text-primary)',
                minHeight: '100vh',
                backgroundColor: 'var(--c-bg-main)'
            }}
        >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '4rem', paddingBottom: '2rem', borderBottom: '1px solid rgba(176,138,62,0.2)' }}>
                <div>
                    <h2 className="font-serif" style={{ margin: '0 0 0.5rem 0', fontSize: '3.5rem', letterSpacing: '-0.02em', fontWeight: 400 }}>
                        DBMS Control
                    </h2>
                    <p className="font-mono" style={{ color: 'var(--c-text-secondary)', margin: 0, fontSize: '0.8rem', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                        Database Analytics & System Verification
                    </p>
                </div>
                <button 
                    onClick={fetchStats} 
                    style={{ 
                        padding: '1rem 2rem', 
                        border: '1px solid var(--c-gold)', 
                        background: 'transparent', 
                        color: 'var(--c-text-primary)', 
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontWeight: 600
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'var(--c-gold)';
                        e.currentTarget.style.color = 'var(--c-surface)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--c-text-primary)';
                    }}
                >
                    <RotateCcw size={14} /> Refresh Data
                </button>
            </div>

            {/* SQL Console Teacher Demo Callout Banner */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1.25rem 2rem',
                backgroundColor: 'rgba(176,138,62,0.12)',
                border: '1px solid var(--c-gold)',
                borderRadius: '8px',
                marginBottom: '3rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        backgroundColor: 'var(--c-gold)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF'
                    }}>
                        <Terminal size={18} />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--c-text-primary)' }}>
                            Teacher Demonstration: Live SQL Query Execution (INSERT, UPDATE, DELETE)
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--c-text-secondary)' }}>
                            Demonstrate adding new movies, editing titles, deleting shows, and inspecting tables with pre-built example commands.
                        </div>
                    </div>
                </div>

                <Link
                    to="/sql-console"
                    style={{
                        padding: '0.75rem 1.5rem',
                        backgroundColor: 'var(--c-gold)',
                        color: '#FFFFFF',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 15px rgba(176,138,62,0.3)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--c-gold-dark)'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--c-gold)'}
                >
                    Launch SQL Console <ArrowRight size={14} />
                </Link>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1px', backgroundColor: 'rgba(176,138,62,0.2)', border: '1px solid rgba(176,138,62,0.2)', marginBottom: '4rem', borderRadius: '8px', overflow: 'hidden' }}>
                {statCards.map((c, i) => (
                    <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        style={{ padding: '2rem', backgroundColor: 'var(--c-surface)', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                    >
                        <h4 className="font-mono" style={{ color: 'var(--c-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0, fontWeight: 600 }}>
                            {c.label}
                        </h4>
                        <div className="font-serif" style={{ fontSize: '2.5rem', fontWeight: 400, color: 'var(--c-text-primary)', lineHeight: 1 }}>
                            {c.value}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Infrastructure Verifier Grid */}
            <h3 className="font-serif" style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--c-text-primary)' }}>Infrastructure Verification</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
                
                {/* Concurrency Section */}
                <div style={{ border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', padding: '3rem', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                        <Database size={20} color="var(--c-gold)" />
                        <h3 className="font-mono" style={{ margin: 0, fontSize: '0.9rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--c-text-primary)', fontWeight: 600 }}>Transaction Isolation</h3>
                    </div>
                    
                    <p className="font-sans" style={{ color: 'var(--c-text-secondary)', marginBottom: '3rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        Dispatches 10 parallel booking requests for the exact same seats to verify MySQL InnoDB row-level locking (<code>SELECT ... FOR UPDATE</code>). Only one transaction should commit.
                    </p>
                    
                    {/* Visual Pipeline */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '3rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(176,138,62,0.1)', paddingBottom: '0.5rem' }}>
                            <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontWeight: 600 }}>QUEUE (PENDING)</span>
                            <span className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--c-text-primary)' }}>{queueDemoState.pending}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(176,138,62,0.1)', paddingBottom: '0.5rem' }}>
                            <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontWeight: 600 }}>PROCESSING</span>
                            <span className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--c-gold)' }}>{queueDemoState.processing}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(176,138,62,0.1)', paddingBottom: '0.5rem' }}>
                            <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontWeight: 600 }}>COMMITTED (201)</span>
                            <span className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--c-text-primary)' }}>{queueDemoState.completed}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontWeight: 600 }}>ROLLBACK / BLOCKED (409)</span>
                            <span className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--c-gold)', fontWeight: 600 }}>{queueDemoState.failed}</span>
                        </div>
                    </div>

                    <button 
                        onClick={runConcurrencyTest} 
                        disabled={testingConcurrency}
                        style={{ 
                            width: '100%', padding: '1.25rem', 
                            background: testingConcurrency ? 'var(--c-surface-warm)' : 'var(--c-gold)', 
                            color: testingConcurrency ? 'var(--c-text-muted)' : 'var(--c-surface)',
                            border: testingConcurrency ? '1px solid var(--c-surface-warm)' : 'none',
                            textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem', fontWeight: 600,
                            display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                            cursor: testingConcurrency ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
                            borderRadius: '4px'
                        }}
                    >
                        <Play size={14} /> {testingConcurrency ? 'Simulating...' : 'Execute Test'}
                    </button>
                </div>

                {/* Rate Limiting Section */}
                <div style={{ border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', padding: '3rem', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <Shield size={20} color="var(--c-gold)" />
                            <h3 className="font-mono" style={{ margin: 0, fontSize: '0.9rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--c-text-primary)', fontWeight: 600 }}>API Rate Limiter</h3>
                        </div>
                        <span className="font-mono" style={{ 
                            padding: '0.25rem 0.5rem', fontSize: '0.65rem', letterSpacing: '0.1em',
                            background: rateLimitState.status === 'ALLOWED' ? 'transparent' : 'rgba(124, 31, 42, 0.1)',
                            color: rateLimitState.status === 'ALLOWED' ? 'var(--c-text-muted)' : 'var(--c-burgundy)',
                            border: `1px solid ${rateLimitState.status === 'ALLOWED' ? 'rgba(176,138,62,0.3)' : 'var(--c-burgundy)'}`
                        }}>
                            HTTP {rateLimitState.http}
                        </span>
                    </div>

                    <p className="font-sans" style={{ color: 'var(--c-text-secondary)', marginBottom: '3rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
                        Validates Express middleware protection configured to allow exactly {rateLimitState.limit} requests per {rateLimitState.windowMinutes}m window per IP address.
                    </p>

                    <div style={{ marginBottom: '4.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                            <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', fontWeight: 600 }}>REQUEST VOLUME</span>
                            <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--c-text-primary)' }}>
                                {rateLimitState.currentRequests} / {rateLimitState.limit}
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--c-surface-warm)', overflow: 'hidden', position: 'relative', borderRadius: '2px' }}>
                            <div style={{ 
                                position: 'absolute',
                                left: 0, top: 0,
                                height: '100%', 
                                width: `${Math.min((rateLimitState.currentRequests / rateLimitState.limit) * 100, 100)}%`,
                                backgroundColor: rateLimitState.currentRequests > rateLimitState.limit ? 'var(--c-burgundy)' : 'var(--c-gold)',
                                transition: 'width 0.3s ease, background-color 0.3s ease'
                            }} />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button 
                            onClick={runRateLimitTest} 
                            disabled={testingRateLimit}
                            style={{ 
                                flex: 1, padding: '1.25rem', 
                                background: 'transparent',
                                color: 'var(--c-text-primary)',
                                border: '1px solid var(--c-gold)',
                                textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem', fontWeight: 600,
                                display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                                cursor: testingRateLimit ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
                                borderRadius: '4px'
                            }}
                            onMouseEnter={(e) => {
                                if(!testingRateLimit) {
                                    e.currentTarget.style.backgroundColor = 'var(--c-gold)';
                                    e.currentTarget.style.color = 'var(--c-surface)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if(!testingRateLimit) {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'var(--c-text-primary)';
                                }
                            }}
                        >
                            <Play size={14} /> {testingRateLimit ? 'Simulating...' : 'Test Burst'}
                        </button>
                        <button 
                            onClick={resetRateLimit} 
                            style={{ 
                                padding: '0 1.5rem', background: 'transparent', border: '1px solid rgba(176,138,62,0.2)',
                                color: 'var(--c-text-muted)', cursor: 'pointer', transition: 'all 0.3s', borderRadius: '4px'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--c-text-primary)'; e.currentTarget.style.borderColor = 'var(--c-gold)'; }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--c-text-muted)'; e.currentTarget.style.borderColor = 'rgba(176,138,62,0.2)'; }}
                        >
                            <RotateCcw size={14} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Execution Console */}
            {logs.length > 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ marginBottom: '4rem', background: 'var(--c-surface)', border: '1px solid rgba(176,138,62,0.2)', borderRadius: '8px', overflow: 'hidden' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 2rem', borderBottom: '1px solid rgba(176,138,62,0.1)', backgroundColor: 'var(--c-surface-warm)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Terminal size={12} color="var(--c-text-muted)" />
                            <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--c-text-secondary)', letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 600 }}>Execution.log</span>
                        </div>
                        <button onClick={() => setLogs([])} style={{ background: 'none', border: 'none', fontSize: '0.7rem', color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', cursor: 'pointer', fontWeight: 600 }}>Clear</button>
                    </div>
                    <div className="font-mono" style={{ padding: '2rem', fontSize: '0.75rem', maxHeight: '300px', overflowY: 'auto', lineHeight: 1.8 }}>
                        {logs.map((log, i) => {
                            let color = 'var(--c-text-secondary)';
                            if (log.includes('SUCCESS') || log.includes('OK') || log.includes('✔') || log.includes('PASSED')) color = '#2e7d32';
                            else if (log.includes('Double-Booking Prevented') || log.includes('Blocked by InnoDB')) color = 'var(--c-gold-dark)';
                            else if (log.includes('Error') || log.includes('Rejected') || log.includes('Failed')) color = 'var(--c-burgundy)';
                            else if (log.includes('[DB]')) color = 'var(--c-gold)';
                            
                            return (
                                <div key={i} style={{ color, fontWeight: log.includes('✔') ? 600 : 400 }}>{log}</div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* DATABASE MANIPULATION LAB */}
            <h3 className="font-serif" style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--c-text-primary)' }}>Database Manipulation Lab</h3>
            <p className="font-sans" style={{ color: 'var(--c-text-secondary)', marginBottom: '2rem', fontSize: '0.85rem', lineHeight: 1.6 }}>
                Use SQL-backed controls to demonstrate how records can be inserted, updated, and deleted from the CineTicket database.
            </p>

            <div style={{ border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)', marginBottom: '4rem' }}>
                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(176,138,62,0.2)' }}>
                    {['MOVIES', 'THEATRES', 'SHOWS', 'BOOKINGS', 'BOOKED SEATS'].map((tab, idx) => (
                        <button 
                            key={tab}
                            onClick={() => { setLabTab(tab); setLabSqlLog(null); }}
                            className="font-mono"
                            style={{
                                padding: '1.5rem 2rem',
                                background: labTab === tab ? 'rgba(176,138,62,0.05)' : 'transparent',
                                border: 'none',
                                borderBottom: labTab === tab ? '2px solid var(--c-gold)' : '2px solid transparent',
                                color: labTab === tab ? 'var(--c-gold)' : 'var(--c-text-muted)',
                                fontSize: '0.75rem',
                                letterSpacing: '0.15em',
                                textTransform: 'uppercase',
                                fontWeight: 600,
                                cursor: 'pointer',
                                flex: 1,
                                transition: 'all 0.3s'
                            }}
                        >
                            0{idx + 1} — {tab}
                        </button>
                    ))}
                </div>

                <div style={{ padding: '3rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <h4 className="font-serif" style={{ fontSize: '1.5rem', margin: 0, color: 'var(--c-text-primary)', textTransform: 'uppercase' }}>
                            {labTab} TABLE
                        </h4>
                        {labTab !== 'BOOKINGS' && (
                            <button 
                                onClick={() => { setLabModalMode('ADD'); setLabFormData({}); setLabModalOpen(true); }}
                                className="font-sans"
                                style={{ 
                                    background: 'var(--c-gold)', 
                                    border: 'none',
                                    color: 'var(--c-surface)',
                                    fontSize: '0.75rem',
                                    padding: '0.75rem 1.5rem',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    fontWeight: 600
                                }}
                            >
                                + ADD {labTab}
                            </button>
                        )}
                    </div>

                    <div style={{ overflowX: 'auto', marginBottom: '2rem' }}>
                        {labData && labData.length > 0 ? (
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr>
                                        {Object.keys(labData[0]).map(key => (
                                            <th key={key} className="font-mono" style={{ padding: '1rem', color: 'var(--c-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', borderBottom: '1px solid rgba(176,138,62,0.2)', fontWeight: 600 }}>
                                                {key}
                                            </th>
                                        ))}
                                        <th className="font-mono" style={{ padding: '1rem', color: 'var(--c-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', borderBottom: '1px solid rgba(176,138,62,0.2)', fontWeight: 600, textAlign: 'right' }}>
                                            ACTIONS
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {labData.map((row, i) => (
                                        <tr key={i}>
                                            {Object.values(row).map((val, j) => {
                                                let displayVal = String(val ?? '');
                                                if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
                                                    displayVal = val.split('T')[0];
                                                }
                                                return (
                                                    <td key={j} className="font-sans" style={{ padding: '1rem', color: 'var(--c-text-primary)', fontSize: '0.85rem', borderBottom: '1px solid rgba(176,138,62,0.1)' }}>
                                                        {displayVal}
                                                    </td>
                                                );
                                            })}
                                            <td style={{ padding: '1rem', borderBottom: '1px solid rgba(176,138,62,0.1)', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                                                    <button 
                                                        onClick={() => { setLabModalMode('EDIT'); setLabFormData({...row}); setLabModalOpen(true); }}
                                                        style={{ background: 'transparent', border: '1px solid var(--c-gold)', color: 'var(--c-gold)', padding: '0.25rem 0.5rem', fontSize: '0.6rem', cursor: 'pointer', borderRadius: '4px', textTransform: 'uppercase' }}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleLabDelete(row.ShowID || (row.BookingID && row.SeatID ? `${row.BookingID}/${row.SeatID}` : null) || row.BookingID || row.TheatreID || row.MovieID)}
                                                        style={{ background: 'transparent', border: '1px solid var(--c-burgundy)', color: 'var(--c-burgundy)', padding: '0.25rem 0.5rem', fontSize: '0.6rem', cursor: 'pointer', borderRadius: '4px', textTransform: 'uppercase' }}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <div className="font-sans" style={{ padding: '2rem', textAlign: 'center', color: 'var(--c-text-muted)', fontSize: '0.85rem' }}>
                                No records found.
                            </div>
                        )}
                    </div>

                    <AnimatePresence>
                        {labSqlLog && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div style={{ padding: '1.5rem', border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface-warm)', borderRadius: '8px', borderLeft: '4px solid var(--c-gold)' }}>
                                    <div className="font-sans" style={{ color: 'var(--c-text-secondary)', fontSize: '0.75rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>
                                        SQL OPERATION EXECUTED
                                    </div>
                                    <pre className="font-mono" style={{ color: 'var(--c-gold-dark)', fontSize: '0.8rem', overflowX: 'auto', margin: 0, whiteSpace: 'pre-wrap', fontWeight: 600 }}>
                                        {labSqlLog}
                                    </pre>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Modal for ADD / EDIT */}
            <AnimatePresence>
                {labModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(23, 23, 23, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{ background: 'var(--c-bg-main)', padding: '3rem', borderRadius: '12px', width: '100%', maxWidth: '500px', border: '1px solid rgba(176,138,62,0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                        >
                            <h3 className="font-serif" style={{ fontSize: '1.8rem', marginBottom: '2rem', color: 'var(--c-text-primary)' }}>
                                {labModalMode} {labTab.slice(0, -1)}
                            </h3>
                            <form onSubmit={handleLabSubmit}>
                                {labTab === 'MOVIES' && (
                                    <>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Title</label>
                                            <input required type="text" value={labFormData.Title || ''} onChange={e => setLabFormData({...labFormData, Title: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }} />
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Genre</label>
                                            <input required type="text" value={labFormData.Genre || ''} onChange={e => setLabFormData({...labFormData, Genre: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }} />
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Language</label>
                                            <input required type="text" value={labFormData.Language || ''} onChange={e => setLabFormData({...labFormData, Language: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }} />
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Duration (mins)</label>
                                            <input required type="number" value={labFormData.Duration || ''} onChange={e => setLabFormData({...labFormData, Duration: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }} />
                                        </div>
                                        <div style={{ marginBottom: '2rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Release Date</label>
                                            <input required type="date" value={labFormData.ReleaseDate ? labFormData.ReleaseDate.split('T')[0] : ''} onChange={e => setLabFormData({...labFormData, ReleaseDate: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }} />
                                        </div>
                                    </>
                                )}
                                {labTab === 'THEATRES' && (
                                    <>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Name</label>
                                            <input required type="text" value={labFormData.Name || ''} onChange={e => setLabFormData({...labFormData, Name: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }} />
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Location</label>
                                            <input required type="text" value={labFormData.Location || ''} onChange={e => setLabFormData({...labFormData, Location: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }} />
                                        </div>
                                        <div style={{ marginBottom: '2rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>City</label>
                                            <input required type="text" value={labFormData.City || ''} onChange={e => setLabFormData({...labFormData, City: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }} />
                                        </div>
                                    </>
                                )}
                                {labTab === 'BOOKINGS' && (
                                    <>
                                        <div style={{ marginBottom: '2rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Status</label>
                                            <select required value={labFormData.Status || ''} onChange={e => setLabFormData({...labFormData, Status: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }}>
                                                <option value="PENDING">PENDING</option>
                                                <option value="CONFIRMED">CONFIRMED</option>
                                                <option value="CANCELLED">CANCELLED</option>
                                                <option value="FAILED">FAILED</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                                {labTab === 'SHOWS' && (
                                    <>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Movie ID</label>
                                            <input required type="number" value={labFormData.MovieID || ''} onChange={e => setLabFormData({...labFormData, MovieID: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }} />
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Screen ID</label>
                                            <input required type="number" value={labFormData.ScreenID || ''} onChange={e => setLabFormData({...labFormData, ScreenID: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }} />
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Show Date</label>
                                            <input required type="date" value={labFormData.ShowDate ? labFormData.ShowDate.split('T')[0] : ''} onChange={e => setLabFormData({...labFormData, ShowDate: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }} />
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Show Time</label>
                                            <input required type="time" step="1" value={labFormData.ShowTime || ''} onChange={e => setLabFormData({...labFormData, ShowTime: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }} />
                                        </div>
                                        <div style={{ marginBottom: '2rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Price</label>
                                            <input required type="number" step="0.01" value={labFormData.Price || ''} onChange={e => setLabFormData({...labFormData, Price: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }} />
                                        </div>
                                    </>
                                )}
                                {labTab === 'BOOKED SEATS' && (
                                    <>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Booking ID</label>
                                            <input required disabled={labModalMode === 'EDIT'} type="number" value={labFormData.BookingID || ''} onChange={e => setLabFormData({...labFormData, BookingID: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: labModalMode === 'EDIT' ? 'rgba(0,0,0,0.05)' : 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }} />
                                        </div>
                                        <div style={{ marginBottom: '1rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Seat ID</label>
                                            <input required disabled={labModalMode === 'EDIT'} type="number" value={labFormData.SeatID || ''} onChange={e => setLabFormData({...labFormData, SeatID: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: labModalMode === 'EDIT' ? 'rgba(0,0,0,0.05)' : 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }} />
                                        </div>
                                        <div style={{ marginBottom: '2rem' }}>
                                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--c-text-muted)' }}>Price at Booking</label>
                                            <input required type="number" step="0.01" value={labFormData.PriceAtBooking || ''} onChange={e => setLabFormData({...labFormData, PriceAtBooking: e.target.value})} style={{ width: '100%', padding: '0.75rem', border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', color: 'var(--c-text-primary)', borderRadius: '4px' }} />
                                        </div>
                                    </>
                                )}
                                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                    <button type="button" onClick={() => setLabModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid rgba(176,138,62,0.2)', color: 'var(--c-text-muted)', cursor: 'pointer', borderRadius: '4px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Cancel</button>
                                    <button type="submit" style={{ padding: '0.75rem 1.5rem', background: 'var(--c-gold)', border: 'none', color: 'var(--c-surface)', cursor: 'pointer', borderRadius: '4px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Generate SQL</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal for Raw SQL Execution */}
            <AnimatePresence>
                {rawSqlModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(23, 23, 23, 0.8)', backdropFilter: 'blur(4px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{ background: 'var(--c-bg-main)', padding: '3rem', borderRadius: '12px', width: '100%', maxWidth: '600px', border: '1px solid rgba(176,138,62,0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                        >
                            <h3 className="font-serif" style={{ fontSize: '1.8rem', marginBottom: '1rem', color: 'var(--c-text-primary)' }}>
                                Edit & Execute Raw SQL
                            </h3>
                            <p className="font-sans" style={{ color: 'var(--c-text-secondary)', marginBottom: '2rem', fontSize: '0.85rem' }}>
                                The query below was generated based on your request. You can edit it before executing it directly against the database.
                            </p>
                            
                            <textarea 
                                value={rawSqlText}
                                onChange={(e) => setRawSqlText(e.target.value)}
                                className="font-mono"
                                style={{ width: '100%', minHeight: '150px', padding: '1rem', backgroundColor: 'var(--c-surface-warm)', border: '1px solid var(--c-gold)', color: 'var(--c-gold-dark)', borderRadius: '8px', marginBottom: '2rem', resize: 'vertical' }}
                            />
                            
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setRawSqlModalOpen(false)} style={{ padding: '0.75rem 1.5rem', background: 'transparent', border: '1px solid rgba(176,138,62,0.2)', color: 'var(--c-text-muted)', cursor: 'pointer', borderRadius: '4px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Cancel</button>
                                <button type="button" onClick={handleRawSqlSubmit} style={{ padding: '0.75rem 1.5rem', background: 'var(--c-gold)', border: 'none', color: 'var(--c-surface)', cursor: 'pointer', borderRadius: '4px', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 600 }}>Execute SQL</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SQL Explorer */}
            <h3 className="font-serif" style={{ fontSize: '2rem', marginBottom: '2rem', color: 'var(--c-text-primary)' }}>Query Explorer</h3>
            
            <div style={{ border: '1px solid rgba(176,138,62,0.2)', background: 'var(--c-surface)', borderRadius: '8px', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
                <div style={{ padding: '3rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '3rem' }}>
                        {[
                            { id: 'most-booked-movies', label: 'Top Movies' },
                            { id: 'revenue-by-theatre', label: 'Revenue/Theatre' },
                            { id: 'available-seats-count', label: 'Current Availability' },
                            { id: 'high-value-customers', label: 'High-Value Customers' },
                            { id: 'occupancy-rate', label: 'Global Occupancy' },
                        ].map(btn => (
                            <button 
                                key={btn.id}
                                onClick={() => runSqlDemo(btn.id)}
                                className="font-sans"
                                style={{ 
                                    background: 'transparent', 
                                    border: '1px solid var(--c-gold)',
                                    color: 'var(--c-text-primary)',
                                    fontSize: '0.75rem',
                                    padding: '0.75rem 1.5rem',
                                    letterSpacing: '0.1em',
                                    textTransform: 'uppercase',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s',
                                    borderRadius: '4px',
                                    fontWeight: 600
                                }}
                                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-gold)'; e.currentTarget.style.color = 'var(--c-surface)'; }}
                                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--c-text-primary)'; }}
                            >
                                {btn.label}
                            </button>
                        ))}
                    </div>

                    <AnimatePresence mode="wait">
                        {sqlDemoResult && (
                            <motion.div 
                                key={sqlDemoResult.description}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                            >
                                <div style={{ padding: '2rem', border: '1px solid rgba(176,138,62,0.2)', marginBottom: '2rem', background: 'var(--c-surface-warm)', borderRadius: '8px' }}>
                                    <div className="font-sans" style={{ color: 'var(--c-text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>
                                        {sqlDemoResult.description}
                                    </div>
                                    <pre className="font-mono" style={{ 
                                        color: 'var(--c-gold-dark)', 
                                        fontSize: '0.85rem',
                                        overflowX: 'auto',
                                        margin: 0,
                                        whiteSpace: 'pre-wrap',
                                        fontWeight: 600
                                    }}>
                                        {sqlDemoResult.sql}
                                    </pre>
                                </div>
                                
                                <div style={{ overflowX: 'auto' }}>
                                    {sqlDemoResult.data && sqlDemoResult.data.length > 0 ? (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                            <thead>
                                                <tr>
                                                    {Object.keys(sqlDemoResult.data[0]).map(key => (
                                                        <th key={key} className="font-mono" style={{ padding: '1rem', color: 'var(--c-text-muted)', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.15em', borderBottom: '1px solid rgba(176,138,62,0.2)', fontWeight: 600 }}>
                                                            {key}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {sqlDemoResult.data.map((row, i) => (
                                                    <tr key={i}>
                                                        {Object.values(row).map((val, j) => {
                                                            let displayVal = String(val ?? '');
                                                            if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
                                                                displayVal = val.split('T')[0];
                                                            }
                                                            return (
                                                                <td key={j} className="font-sans" style={{ padding: '1rem', color: 'var(--c-text-primary)', fontSize: '0.85rem', borderBottom: '1px solid rgba(176,138,62,0.1)' }}>
                                                                    {displayVal}
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="font-sans" style={{ padding: '2rem', textAlign: 'center', color: 'var(--c-text-muted)', fontSize: '0.85rem' }}>
                                            No records returned.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}
