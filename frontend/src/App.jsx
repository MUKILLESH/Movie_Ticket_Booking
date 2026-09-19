import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Clapperboard } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Lenis from 'lenis';

import Home from './pages/Home';
import MovieDetails from './pages/MovieDetails';
import SeatSelection from './pages/SeatSelection';
import BookingConfirmation from './pages/BookingConfirmation';
import DemoDashboard from './pages/DemoDashboard';

// Wrap Routes to allow useLocation for AnimatePresence
function AnimatedRoutes() {
  const location = useLocation();
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/movies/:id" element={<MovieDetails />} />
        <Route path="/shows/:showId/seats" element={<SeatSelection />} />
        <Route path="/booking/:bookingId" element={<BookingConfirmation />} />
        <Route path="/demo" element={<DemoDashboard />} />
      </Routes>
    </AnimatePresence>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isDemo = location.pathname === '/demo';

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 100,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '1.5rem 4rem',
        transition: 'all 0.4s ease',
        backgroundColor: scrolled ? 'rgba(247, 244, 236, 0.9)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(176,138,62,0.20)' : '1px solid transparent',
        color: 'var(--c-text-primary)'
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <Clapperboard color="var(--c-gold)" size={20} />
        <span className="font-serif" style={{ fontSize: '1.25rem', fontWeight: 600, letterSpacing: '0.02em', color: 'var(--c-text-primary)' }}>
          CineTicket
        </span>
      </Link>
      
      <div style={{ display: 'flex', gap: '2.5rem', alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em' }}>
        <Link to="/" style={{ opacity: 0.8, transition: 'opacity 0.2s', color: 'var(--c-text-primary)' }} onMouseEnter={(e) => e.target.style.opacity = 1} onMouseLeave={(e) => e.target.style.opacity = 0.8}>
          MOVIES
        </Link>
        <Link to="/" style={{ opacity: 0.8, transition: 'opacity 0.2s', color: 'var(--c-text-primary)' }} onMouseEnter={(e) => e.target.style.opacity = 1} onMouseLeave={(e) => e.target.style.opacity = 0.8}>
          MY BOOKINGS
        </Link>
        <Link to="/demo" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '0.5rem',
          color: isDemo ? 'var(--c-gold)' : 'var(--c-text-primary)',
          opacity: 0.9,
          transition: 'all 0.2s'
        }}>
          <span style={{ 
            width: 6, 
            height: 6, 
            borderRadius: '50%', 
            backgroundColor: isDemo ? 'var(--c-gold)' : 'transparent',
            border: isDemo ? 'none' : '1px solid var(--c-text-muted)',
            boxShadow: `0 0 8px ${isDemo ? 'rgba(176,138,62,0.4)' : 'transparent'}`
          }} />
          DBMS LAB
        </Link>
      </div>
    </motion.nav>
  );
}

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        <div className="film-grain" />
        <div className="vignette" />
        
        <Navbar />

        <main className="main-content" style={{ position: 'relative', zIndex: 10 }}>
          <AnimatedRoutes />
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
