import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Play, RotateCcw, Database, CheckCircle2, AlertCircle, 
  Trash2, Edit3, PlusCircle, Search, Copy, Check, Table, Clock, 
  ArrowRight, ExternalLink, RefreshCw, Layers, ShieldCheck, Sparkles 
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const DEFAULT_PRESETS = [
  {
    category: 'INSERTION',
    title: 'Insert a New Movie',
    description: 'Demonstrates SQL INSERT command adding "Oppenheimer" to the MOVIE table.',
    sql: `INSERT INTO MOVIE (Title, Genre, Language, Duration, ReleaseDate)\nVALUES ('Oppenheimer', 'Biography/Drama', 'English', 180, '2023-07-21');`
  },
  {
    category: 'INSERTION',
    title: 'Insert a New Show',
    description: 'Demonstrates SQL INSERT adding a new show screening for Inception (MovieID: 1) on Screen 1.',
    sql: `INSERT INTO \`SHOW\` (ShowDate, ShowTime, Price, MovieID, ScreenID)\nVALUES (CURDATE(), '20:30:00', 270.00, 1, 1);`
  },
  {
    category: 'INSERTION',
    title: 'Insert a New Customer',
    description: 'Demonstrates SQL INSERT adding a new user into the CUSTOMER table.',
    sql: `INSERT INTO CUSTOMER (Name, Email, Phone, Password)\nVALUES ('Suresh Kumar', 'suresh.kumar@example.com', '9876543299', 'securepass123');`
  },
  {
    category: 'MANIPULATION',
    title: 'Update Movie Name & Duration',
    description: 'Demonstrates SQL UPDATE command modifying the title of "Oppenheimer" to IMAX Edition.',
    sql: `UPDATE MOVIE\nSET Title = 'Oppenheimer (IMAX 70mm Special)', Duration = 185\nWHERE Title = 'Oppenheimer';`
  },
  {
    category: 'MANIPULATION',
    title: 'Update Show Ticket Price',
    description: 'Demonstrates SQL UPDATE changing show price for Screen 1 shows.',
    sql: `UPDATE \`SHOW\`\nSET Price = 320.00\nWHERE ShowID = 1;`
  },
  {
    category: 'MANIPULATION',
    title: 'Update Customer Phone Number',
    description: 'Demonstrates SQL UPDATE modifying existing customer records.',
    sql: `UPDATE CUSTOMER\nSET Phone = '9112233445'\nWHERE Email = 'suresh.kumar@example.com';`
  },
  {
    category: 'DELETION',
    title: 'Delete a Specific Show',
    description: 'Demonstrates SQL DELETE command removing the most recently added show.',
    sql: `DELETE FROM \`SHOW\`\nWHERE ShowID = (SELECT max_id FROM (SELECT MAX(ShowID) as max_id FROM \`SHOW\`) AS tmp);`
  },
  {
    category: 'DELETION',
    title: 'Delete Inserted Movie',
    description: 'Demonstrates SQL DELETE removing "Oppenheimer" movie entries.',
    sql: `DELETE FROM MOVIE\nWHERE Title LIKE 'Oppenheimer%';`
  },
  {
    category: 'DELETION',
    title: 'Delete Expired / Failed Bookings',
    description: 'Demonstrates SQL DELETE removing cancelled or failed booking transactions.',
    sql: `DELETE FROM BOOKING\nWHERE Status = 'FAILED';`
  },
  {
    category: 'SELECTION',
    title: 'View All Movies (Ordered by Recent)',
    description: 'Demonstrates SQL SELECT to inspect all movie records and verify insertions/updates.',
    sql: `SELECT MovieID, Title, Genre, Language, Duration, ReleaseDate\nFROM MOVIE\nORDER BY MovieID DESC;`
  },
  {
    category: 'SELECTION',
    title: 'View All Shows with Theatres & Screens',
    description: 'Demonstrates SQL multi-table JOIN showing all active shows.',
    sql: `SELECT s.ShowID, m.Title, sc.ScreenNumber, t.Name AS Theatre, t.City, s.ShowDate, s.ShowTime, s.Price\nFROM \`SHOW\` s\nJOIN MOVIE m ON s.MovieID = m.MovieID\nJOIN SCREEN sc ON s.ScreenID = sc.ScreenID\nJOIN THEATRE t ON sc.TheatreID = t.TheatreID\nORDER BY s.ShowID DESC;`
  },
  {
    category: 'SELECTION',
    title: 'View Total Revenue by Movie',
    description: 'Demonstrates SQL GROUP BY, SUM(), and ORDER BY aggregate analytics.',
    sql: `SELECT m.Title, COUNT(bs.SeatID) AS TicketsSold, COALESCE(SUM(b.TotalAmount), 0) AS TotalRevenue\nFROM MOVIE m\nLEFT JOIN \`SHOW\` s ON m.MovieID = s.MovieID\nLEFT JOIN BOOKING b ON s.ShowID = b.ShowID AND b.Status = 'CONFIRMED'\nLEFT JOIN BOOKING_SEAT bs ON b.BookingID = bs.BookingID\nGROUP BY m.MovieID\nORDER BY TotalRevenue DESC;`
  }
];

const TABLES = [
  { name: 'MOVIE', countQuery: 'SELECT COUNT(*) as c FROM MOVIE' },
  { name: 'SHOW', countQuery: 'SELECT COUNT(*) as c FROM `SHOW`' },
  { name: 'THEATRE', countQuery: 'SELECT COUNT(*) as c FROM THEATRE' },
  { name: 'SCREEN', countQuery: 'SELECT COUNT(*) as c FROM SCREEN' },
  { name: 'SEAT', countQuery: 'SELECT COUNT(*) as c FROM SEAT' },
  { name: 'CUSTOMER', countQuery: 'SELECT COUNT(*) as c FROM CUSTOMER' },
  { name: 'BOOKING', countQuery: 'SELECT COUNT(*) as c FROM BOOKING' },
  { name: 'BOOKING_SEAT', countQuery: 'SELECT COUNT(*) as c FROM BOOKING_SEAT' },
  { name: 'PAYMENT', countQuery: 'SELECT COUNT(*) as c FROM PAYMENT' }
];

export default function SqlQueryConsole() {
  const [sql, setSql] = useState(DEFAULT_PRESETS[0].sql);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [history, setHistory] = useState([]);
  const [copied, setCopied] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [tableCounts, setTableCounts] = useState({});

  const editorRef = useRef(null);
  const resultRef = useRef(null);

  useEffect(() => {
    fetchTableCounts();
  }, []);

  const fetchTableCounts = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/stats`);
      const data = await res.json();
      if (data && !data.error) {
        setTableCounts({
          MOVIE: data.movies,
          THEATRE: data.theatres,
          SCREEN: data.screens,
          SEAT: data.seats,
          CUSTOMER: data.customers,
          BOOKING: data.totalBookings
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExecute = async (overrideSql) => {
    const queryToRun = (typeof overrideSql === 'string' ? overrideSql : sql).trim();
    if (!queryToRun) return;

    setExecuting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/admin/execute-sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: queryToRun })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data);
        addToHistory(queryToRun, 'FAILED', 0);
      } else {
        setResult(data);
        const count = data.rowCount ?? data.affectedRows ?? 0;
        addToHistory(queryToRun, 'SUCCESS', count, data.type);
        fetchTableCounts();
      }

      setTimeout(() => {
        if (resultRef.current) {
          resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } catch (err) {
      setError({ error: err.message, sqlMessage: 'Network error or server unavailable.' });
      addToHistory(queryToRun, 'FAILED', 0);
    } finally {
      setExecuting(false);
    }
  };

  const addToHistory = (query, status, count, type) => {
    setHistory(prev => [
      {
        id: Date.now(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        sql: query,
        status,
        count,
        type: type || (query.trim().split(/\s+/)[0].toUpperCase())
      },
      ...prev.slice(0, 19)
    ]);
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetSeed = async () => {
    if (!window.confirm("Are you sure you want to reset the database to original seed data? All custom test entries will be replaced with default movies and shows.")) {
      return;
    }
    setResetting(true);
    setResetNotice(null);
    try {
      const res = await fetch(`${API_URL}/admin/reset-seed`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResetNotice("Database successfully reset to default sample data!");
        fetchTableCounts();
        setTimeout(() => setResetNotice(null), 4000);
      } else {
        alert("Reset failed: " + (data.error || 'Unknown error'));
      }
    } catch (err) {
      alert("Error resetting database: " + err.message);
    } finally {
      setResetting(false);
    }
  };

  const filteredPresets = activeCategory === 'ALL' 
    ? DEFAULT_PRESETS 
    : DEFAULT_PRESETS.filter(p => p.category === activeCategory);

  const getBadgeColor = (category) => {
    switch (category) {
      case 'INSERTION': return { bg: 'rgba(46, 125, 50, 0.15)', text: '#2e7d32', border: 'rgba(46, 125, 50, 0.3)' };
      case 'MANIPULATION': return { bg: 'rgba(176, 138, 62, 0.15)', text: 'var(--c-gold-dark)', border: 'rgba(176, 138, 62, 0.3)' };
      case 'DELETION': return { bg: 'rgba(124, 31, 42, 0.15)', text: 'var(--c-burgundy)', border: 'rgba(124, 31, 42, 0.3)' };
      case 'SELECTION': return { bg: 'rgba(63, 81, 181, 0.15)', text: '#3949ab', border: 'rgba(63, 81, 181, 0.3)' };
      default: return { bg: 'rgba(0,0,0,0.05)', text: 'var(--c-text-secondary)', border: 'rgba(0,0,0,0.1)' };
    }
  };

  const displayRows = result?.data ? (
    filterText.trim() === '' 
      ? result.data 
      : result.data.filter(row => 
          Object.values(row).some(v => 
            String(v ?? '').toLowerCase().includes(filterText.toLowerCase())
          )
        )
  ) : [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        padding: '7.5rem 3.5rem 4rem 3.5rem',
        maxWidth: '1520px',
        margin: '0 auto',
        color: 'var(--c-text-primary)',
        minHeight: '100vh',
        backgroundColor: 'var(--c-bg-main)'
      }}
    >
      {/* Top Banner / Breadcrumb */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1.5rem',
        paddingBottom: '2rem',
        marginBottom: '2.5rem',
        borderBottom: '1px solid rgba(176,138,62,0.2)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: 'rgba(176,138,62,0.15)',
              color: 'var(--c-gold-dark)',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              padding: '0.35rem 0.8rem',
              borderRadius: '20px',
              border: '1px solid rgba(176,138,62,0.3)'
            }}>
              <Terminal size={13} /> DBMS Laboratory Mode
            </span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              fontSize: '0.72rem',
              fontWeight: 600,
              padding: '0.35rem 0.8rem',
              borderRadius: '20px',
              border: '1px solid rgba(46,125,50,0.3)'
            }}>
              <CheckCircle2 size={13} /> MySQL 8.0 Active
            </span>
          </div>
          <h1 className="font-serif" style={{ fontSize: '2.8rem', margin: 0, fontWeight: 500, letterSpacing: '-0.02em' }}>
            SQL Query Console
          </h1>
          <p className="font-sans" style={{ color: 'var(--c-text-secondary)', fontSize: '0.95rem', marginTop: '0.4rem' }}>
            Interactive SQL playground to demonstrate <strong>Insertion</strong>, <strong>Manipulation (Update)</strong>, and <strong>Deletion</strong> on the live database.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleResetSeed}
            disabled={resetting}
            title="Reset database to clean default seed state"
            style={{
              padding: '0.75rem 1.4rem',
              borderRadius: '6px',
              border: '1px solid rgba(176,138,62,0.3)',
              backgroundColor: 'var(--c-surface)',
              color: 'var(--c-text-secondary)',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: resetting ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-gold)'; e.currentTarget.style.color = 'var(--c-text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(176,138,62,0.3)'; e.currentTarget.style.color = 'var(--c-text-secondary)'; }}
          >
            <RotateCcw size={14} className={resetting ? 'spin' : ''} />
            {resetting ? 'Resetting DB...' : 'Reset Demo Seed'}
          </button>

          <Link
            to="/"
            target="_blank"
            style={{
              padding: '0.75rem 1.4rem',
              borderRadius: '6px',
              border: '1px solid var(--c-gold)',
              backgroundColor: 'var(--c-gold)',
              color: '#FFFFFF',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--c-gold-dark)'; }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--c-gold)'; }}
          >
            <ExternalLink size={14} />
            View Live Website
          </Link>
        </div>
      </div>

      {resetNotice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: '#e8f5e9',
            border: '1px solid #a5d6a7',
            borderRadius: '6px',
            color: '#1b5e20',
            fontSize: '0.85rem',
            fontWeight: 600,
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem'
          }}
        >
          <CheckCircle2 size={18} />
          {resetNotice}
        </motion.div>
      )}

      {/* Quick Table Summary Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '0.75rem',
        marginBottom: '2.5rem'
      }}>
        {TABLES.slice(0, 6).map(t => (
          <div
            key={t.name}
            onClick={() => {
              const q = `SELECT * FROM \`${t.name}\` ORDER BY 1 DESC LIMIT 10;`;
              setSql(q);
              handleExecute(q);
            }}
            style={{
              padding: '1rem',
              backgroundColor: 'var(--c-surface)',
              border: '1px solid rgba(176,138,62,0.2)',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-gold)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(176,138,62,0.2)'; e.currentTarget.style.transform = 'translateY(0)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="font-mono" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--c-text-primary)' }}>
                {t.name}
              </span>
              <Table size={12} color="var(--c-gold)" />
            </div>
            <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--c-gold-dark)' }}>
                {tableCounts[t.name] ?? '—'}
              </span>
              <span style={{ fontSize: '0.65rem', color: 'var(--c-text-muted)', textTransform: 'uppercase' }}>
                Inspect →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-Column Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: '2.5rem',
        alignItems: 'start',
        marginBottom: '3rem'
      }}>
        {/* Left Column: Interactive SQL Editor */}
        <div>
          <div style={{
            backgroundColor: 'var(--c-surface)',
            border: '1px solid rgba(176,138,62,0.25)',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.03)'
          }}>
            {/* Editor Top Bar */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              backgroundColor: 'var(--c-surface-warm)',
              borderBottom: '1px solid rgba(176,138,62,0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Terminal size={15} color="var(--c-gold-dark)" />
                <span className="font-mono" style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--c-text-primary)', letterSpacing: '0.05em' }}>
                  SQL QUERY EDITOR
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)' }}>
                  Press Ctrl+Enter to run
                </span>
                <button
                  onClick={() => setSql('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--c-text-muted)',
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: '0.3rem 0.6rem',
                    textTransform: 'uppercase'
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--c-burgundy)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--c-text-muted)'}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Editor Textarea */}
            <div style={{ position: 'relative' }}>
              <textarea
                ref={editorRef}
                value={sql}
                onChange={e => setSql(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write or edit any SQL query here (INSERT, UPDATE, DELETE, SELECT)..."
                rows={8}
                className="font-mono"
                style={{
                  width: '100%',
                  padding: '1.5rem',
                  fontSize: '0.9rem',
                  lineHeight: '1.6',
                  color: '#1a1a1a',
                  backgroundColor: '#FAF8F3',
                  border: 'none',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'var(--font-mono)'
                }}
              />
            </div>

            {/* Editor Bottom Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              backgroundColor: 'var(--c-surface)',
              borderTop: '1px solid rgba(176,138,62,0.15)'
            }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {['MOVIE', 'SHOW', 'CUSTOMER', 'BOOKING'].map(t => (
                  <button
                    key={t}
                    onClick={() => setSql(`SELECT * FROM \`${t}\` ORDER BY 1 DESC LIMIT 10;`)}
                    style={{
                      padding: '0.35rem 0.7rem',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      border: '1px solid rgba(176,138,62,0.2)',
                      backgroundColor: 'transparent',
                      borderRadius: '4px',
                      color: 'var(--c-text-secondary)',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--c-gold)'; e.currentTarget.style.color = 'var(--c-gold-dark)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(176,138,62,0.2)'; e.currentTarget.style.color = 'var(--c-text-secondary)'; }}
                  >
                    SELECT * FROM {t}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={() => handleExecute()}
                  disabled={executing || !sql.trim()}
                  style={{
                    padding: '0.75rem 1.8rem',
                    backgroundColor: 'var(--c-gold)',
                    border: '1px solid var(--c-gold-dark)',
                    borderRadius: '5px',
                    color: '#FFFFFF',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    cursor: (executing || !sql.trim()) ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(176,138,62,0.3)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    if (!executing && sql.trim()) e.currentTarget.style.backgroundColor = 'var(--c-gold-dark)';
                  }}
                  onMouseLeave={e => {
                    if (!executing && sql.trim()) e.currentTarget.style.backgroundColor = 'var(--c-gold)';
                  }}
                >
                  <Play size={14} fill="#FFFFFF" />
                  {executing ? 'Executing...' : 'Execute Query'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Query History */}
          {history.length > 0 && (
            <div style={{
              marginTop: '1.5rem',
              padding: '1.25rem',
              backgroundColor: 'var(--c-surface)',
              border: '1px solid rgba(176,138,62,0.2)',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span className="font-mono" style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--c-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Execution History ({history.length})
                </span>
                <button
                  onClick={() => setHistory([])}
                  style={{ background: 'none', border: 'none', fontSize: '0.68rem', color: 'var(--c-text-muted)', cursor: 'pointer' }}
                >
                  Clear History
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '160px', overflowY: 'auto' }}>
                {history.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSql(item.sql)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0.75rem',
                      backgroundColor: 'var(--c-surface-warm)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      border: '1px solid transparent'
                    }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--c-gold)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      <span style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.4rem',
                        borderRadius: '3px',
                        backgroundColor: item.status === 'SUCCESS' ? '#e8f5e9' : '#ffebee',
                        color: item.status === 'SUCCESS' ? '#2e7d32' : 'var(--c-burgundy)'
                      }}>
                        {item.type}
                      </span>
                      <span className="font-mono" style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {item.sql.replace(/\n/g, ' ')}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--c-text-muted)', flexShrink: 0, marginLeft: '0.5rem' }}>
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Teacher Example Presets */}
        <div>
          <div style={{
            backgroundColor: 'var(--c-surface)',
            border: '1px solid rgba(176,138,62,0.25)',
            borderRadius: '8px',
            padding: '1.5rem',
            boxShadow: '0 8px 30px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 className="font-serif" style={{ margin: 0, fontSize: '1.35rem', fontWeight: 600 }}>
                  Teacher Demo Presets
                </h3>
                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: 'var(--c-text-secondary)' }}>
                  Click to load or run pre-configured demonstration commands.
                </p>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {['ALL', 'INSERTION', 'MANIPULATION', 'DELETION', 'SELECTION'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '20px',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    border: '1px solid',
                    backgroundColor: activeCategory === cat ? 'var(--c-gold)' : 'transparent',
                    borderColor: activeCategory === cat ? 'var(--c-gold)' : 'rgba(176,138,62,0.3)',
                    color: activeCategory === cat ? '#FFFFFF' : 'var(--c-text-primary)',
                    transition: 'all 0.2s'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Presets List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '530px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {filteredPresets.map((preset, idx) => {
                const badgeStyle = getBadgeColor(preset.category);
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '1.1rem',
                      backgroundColor: 'var(--c-surface-warm)',
                      border: '1px solid rgba(176,138,62,0.2)',
                      borderRadius: '6px',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '3px',
                        backgroundColor: badgeStyle.bg,
                        color: badgeStyle.text,
                        border: `1px solid ${badgeStyle.border}`
                      }}>
                        {preset.category}
                      </span>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => {
                            setSql(preset.sql);
                            if (editorRef.current) {
                              editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              editorRef.current.focus();
                            }
                          }}
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            borderRadius: '3px',
                            border: '1px solid rgba(176,138,62,0.3)',
                            backgroundColor: 'var(--c-surface)',
                            color: 'var(--c-text-primary)',
                            cursor: 'pointer'
                          }}
                        >
                          Load
                        </button>
                        <button
                          onClick={() => {
                            setSql(preset.sql);
                            handleExecute(preset.sql);
                          }}
                          style={{
                            padding: '0.3rem 0.7rem',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            borderRadius: '3px',
                            border: 'none',
                            backgroundColor: 'var(--c-gold)',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          <Play size={10} fill="#FFFFFF" /> Run
                        </button>
                      </div>
                    </div>

                    <h4 className="font-sans" style={{ margin: '0 0 0.3rem 0', fontSize: '0.9rem', fontWeight: 600, color: 'var(--c-text-primary)' }}>
                      {preset.title}
                    </h4>
                    <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.78rem', color: 'var(--c-text-secondary)' }}>
                      {preset.description}
                    </p>

                    <pre className="font-mono" style={{
                      margin: 0,
                      padding: '0.6rem 0.8rem',
                      backgroundColor: 'var(--c-surface)',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      color: 'var(--c-gold-dark)',
                      overflowX: 'auto',
                      border: '1px solid rgba(176,138,62,0.15)'
                    }}>
                      {preset.sql}
                    </pre>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Execution Results Section */}
      <div ref={resultRef}>
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                marginBottom: '3rem',
                padding: '2rem',
                backgroundColor: '#fff5f5',
                border: '1px solid #ffcdd2',
                borderRadius: '8px',
                color: 'var(--c-burgundy)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                <AlertCircle size={24} color="var(--c-burgundy)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <h3 className="font-serif" style={{ margin: 0, fontSize: '1.3rem', color: 'var(--c-burgundy)' }}>
                      Execution Error
                    </h3>
                    {error.code && (
                      <span className="font-mono" style={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        backgroundColor: '#ffebee',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '3px',
                        border: '1px solid #ef9a9a'
                      }}>
                        {error.code}
                      </span>
                    )}
                  </div>
                  <p className="font-mono" style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#b71c1c', lineHeight: 1.6 }}>
                    {error.sqlMessage || error.error || 'Unknown query execution error.'}
                  </p>

                  {error.code === 'ER_ROW_IS_REFERENCED_2' && (
                    <div style={{
                      padding: '0.8rem',
                      backgroundColor: 'rgba(124, 31, 42, 0.08)',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      color: 'var(--c-text-primary)'
                    }}>
                      💡 <strong>DBMS Teaching Note:</strong> This error occurred because of a <em>Foreign Key constraint</em>. Other tables (like active bookings or seats) depend on this row. To delete it, related dependent rows must be deleted first, which demonstrates <strong>Referential Integrity</strong> in SQL!
                    </div>
                  )}

                  {error.code === 'ER_DUP_ENTRY' && (
                    <div style={{
                      padding: '0.8rem',
                      backgroundColor: 'rgba(124, 31, 42, 0.08)',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      color: 'var(--c-text-primary)'
                    }}>
                      💡 <strong>DBMS Teaching Note:</strong> This error demonstrates a <em>UNIQUE constraint</em> violation. A record with this primary or unique key already exists.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                backgroundColor: 'var(--c-surface)',
                border: '1px solid rgba(176,138,62,0.25)',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 10px 35px rgba(0,0,0,0.03)',
                marginBottom: '3rem'
              }}
            >
              {/* Result Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 2rem',
                backgroundColor: 'var(--c-surface-warm)',
                borderBottom: '1px solid rgba(176,138,62,0.2)',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: '#e8f5e9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2e7d32'
                  }}>
                    <CheckCircle2 size={18} />
                  </div>
                  <div>
                    <h3 className="font-serif" style={{ margin: 0, fontSize: '1.3rem', fontWeight: 600 }}>
                      Query Results
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '3px',
                        backgroundColor: 'var(--c-gold)',
                        color: '#FFFFFF'
                      }}>
                        {result.type}
                      </span>
                      <span className="font-mono" style={{ fontSize: '0.72rem', color: 'var(--c-text-secondary)' }}>
                        <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
                        {result.executionTimeMs} ms
                      </span>
                    </div>
                  </div>
                </div>

                {/* Status & Verify Actions */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  {result.type === 'SELECT' && result.data && (
                    <div style={{ position: 'relative' }}>
                      <input
                        type="text"
                        placeholder="Search in table..."
                        value={filterText}
                        onChange={e => setFilterText(e.target.value)}
                        style={{
                          padding: '0.45rem 0.9rem 0.45rem 2rem',
                          borderRadius: '4px',
                          border: '1px solid rgba(176,138,62,0.3)',
                          fontSize: '0.78rem',
                          outline: 'none',
                          backgroundColor: 'var(--c-surface)',
                          width: '180px'
                        }}
                      />
                      <Search size={13} style={{ position: 'absolute', left: '8px', top: '10px', color: 'var(--c-text-muted)' }} />
                    </div>
                  )}

                  {['INSERT', 'UPDATE', 'DELETE'].includes(result.type) && (
                    <button
                      onClick={() => {
                        const targetTable = sql.toUpperCase().includes('SHOW') ? 'SHOW' : 'MOVIE';
                        const verifySql = `SELECT * FROM \`${targetTable}\` ORDER BY 1 DESC LIMIT 10;`;
                        setSql(verifySql);
                        handleExecute(verifySql);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: 'transparent',
                        border: '1px solid var(--c-gold)',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: 'var(--c-gold-dark)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      <Sparkles size={13} /> Verify in Table
                    </button>
                  )}

                  {result.type === 'SELECT' && result.data && result.data.length > 0 && (
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(result.data, null, 2))}
                      style={{
                        padding: '0.5rem 0.9rem',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(176,138,62,0.3)',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: 'var(--c-text-secondary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      {copied ? <Check size={13} color="#2e7d32" /> : <Copy size={13} />}
                      {copied ? 'Copied!' : 'Copy JSON'}
                    </button>
                  )}
                </div>
              </div>

              {/* DML Feedback (INSERT / UPDATE / DELETE) */}
              {['INSERT', 'UPDATE', 'DELETE'].includes(result.type) && (
                <div style={{ padding: '2.5rem 2rem' }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '1.5rem',
                    marginBottom: '2rem'
                  }}>
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: 'var(--c-surface-warm)',
                      borderRadius: '6px',
                      border: '1px solid rgba(176,138,62,0.2)'
                    }}>
                      <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Rows Affected
                      </div>
                      <div style={{ fontSize: '2.2rem', fontWeight: 600, color: 'var(--c-gold-dark)', marginTop: '0.4rem' }}>
                        {result.affectedRows}
                      </div>
                    </div>

                    {result.type === 'INSERT' && (
                      <div style={{
                        padding: '1.5rem',
                        backgroundColor: 'var(--c-surface-warm)',
                        borderRadius: '6px',
                        border: '1px solid rgba(176,138,62,0.2)'
                      }}>
                        <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          Generated Primary Key (Auto-Increment)
                        </div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 600, color: '#2e7d32', marginTop: '0.4rem' }}>
                          #{result.insertId || 'N/A'}
                        </div>
                      </div>
                    )}

                    {result.type === 'UPDATE' && (
                      <div style={{
                        padding: '1.5rem',
                        backgroundColor: 'var(--c-surface-warm)',
                        borderRadius: '6px',
                        border: '1px solid rgba(176,138,62,0.2)'
                      }}>
                        <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          Rows Changed
                        </div>
                        <div style={{ fontSize: '2.2rem', fontWeight: 600, color: 'var(--c-gold-dark)', marginTop: '0.4rem' }}>
                          {result.changedRows}
                        </div>
                      </div>
                    )}

                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: 'var(--c-surface-warm)',
                      borderRadius: '6px',
                      border: '1px solid rgba(176,138,62,0.2)'
                    }}>
                      <div className="font-mono" style={{ fontSize: '0.7rem', color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Transaction Status
                      </div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 600, color: '#2e7d32', marginTop: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ShieldCheck size={20} /> COMMITTED
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: '1.25rem 1.5rem',
                    backgroundColor: '#e8f5e9',
                    borderRadius: '6px',
                    border: '1px solid #c8e6c9',
                    color: '#1b5e20',
                    fontSize: '0.85rem',
                    lineHeight: 1.6
                  }}>
                    <strong>Live Confirmation:</strong> {result.message} Your changes are now stored in the database. You can inspect the table below or switch to the website homepage to see the updated titles or shows live!
                  </div>
                </div>
              )}

              {/* Tabular Viewer (SELECT Query) */}
              {result.type === 'SELECT' && (
                <div>
                  <div style={{ padding: '0.75rem 2rem', backgroundColor: '#FBF9F4', borderBottom: '1px solid rgba(176,138,62,0.1)', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--c-text-secondary)' }}>
                    <span>Showing <strong>{displayRows.length}</strong> of <strong>{result.rowCount}</strong> records</span>
                    {filterText && <span>Filtered by: "{filterText}"</span>}
                  </div>

                  {displayRows.length > 0 ? (
                    <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--c-surface-warm)', position: 'sticky', top: 0, zIndex: 2 }}>
                            <th style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid rgba(176,138,62,0.2)', width: '40px', color: 'var(--c-text-muted)' }}>#</th>
                            {result.columns.map(col => (
                              <th
                                key={col}
                                className="font-mono"
                                style={{
                                  padding: '0.9rem 1.25rem',
                                  color: 'var(--c-text-primary)',
                                  fontSize: '0.72rem',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.1em',
                                  borderBottom: '1px solid rgba(176,138,62,0.2)',
                                  fontWeight: 700,
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {displayRows.map((row, rIdx) => (
                            <tr
                              key={rIdx}
                              style={{
                                backgroundColor: rIdx % 2 === 0 ? 'var(--c-surface)' : 'var(--c-bg-soft)',
                                transition: 'background-color 0.15s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(176,138,62,0.08)'}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = rIdx % 2 === 0 ? 'var(--c-surface)' : 'var(--c-bg-soft)'}
                            >
                              <td style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid rgba(176,138,62,0.08)', color: 'var(--c-text-muted)', fontSize: '0.72rem' }}>
                                {rIdx + 1}
                              </td>
                              {result.columns.map(col => {
                                const val = row[col];
                                let displayStr = String(val ?? '');
                                if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
                                  displayStr = val.split('T')[0];
                                }
                                return (
                                  <td
                                    key={col}
                                    className="font-sans"
                                    style={{
                                      padding: '0.85rem 1.25rem',
                                      color: 'var(--c-text-primary)',
                                      borderBottom: '1px solid rgba(176,138,62,0.08)',
                                      whiteSpace: 'nowrap'
                                    }}
                                  >
                                    {val === null ? <span style={{ color: 'var(--c-text-muted)', fontStyle: 'italic' }}>NULL</span> : displayStr}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--c-text-muted)' }}>
                      <Table size={32} style={{ margin: '0 auto 0.75rem auto', opacity: 0.4 }} />
                      <p style={{ margin: 0, fontSize: '0.9rem' }}>No rows matched your query or filter.</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Teacher Reference Card: SQL Concepts demonstrated */}
      <div style={{
        padding: '2.5rem',
        backgroundColor: 'var(--c-surface)',
        border: '1px solid rgba(176,138,62,0.2)',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <Layers size={18} color="var(--c-gold)" />
          <h3 className="font-serif" style={{ margin: 0, fontSize: '1.4rem' }}>
            DBMS Concepts Demonstrated to Your Teacher
          </h3>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{ padding: '1.25rem', backgroundColor: 'var(--c-surface-warm)', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#2e7d32', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
              <PlusCircle size={15} /> 1. Data Insertion (DML INSERT)
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--c-text-secondary)', lineHeight: 1.6 }}>
              Demonstrates inserting new tuples into parent tables (<code>MOVIE</code>) and child tables (<code>SHOW</code>) honoring foreign key dependencies and auto-increment sequences.
            </p>
          </div>

          <div style={{ padding: '1.25rem', backgroundColor: 'var(--c-surface-warm)', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--c-gold-dark)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
              <Edit3 size={15} /> 2. Data Manipulation (DML UPDATE)
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--c-text-secondary)', lineHeight: 1.6 }}>
              Demonstrates updating specific column attributes (e.g. Movie title, duration, show pricing) using targeted <code>WHERE</code> clauses and transaction commit.
            </p>
          </div>

          <div style={{ padding: '1.25rem', backgroundColor: 'var(--c-surface-warm)', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--c-burgundy)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
              <Trash2 size={15} /> 3. Data Deletion & Referential Integrity
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--c-text-secondary)', lineHeight: 1.6 }}>
              Demonstrates row removal with <code>DELETE FROM</code>, subqueries, and verifies foreign key cascading and constraint protection against accidental deletions.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
