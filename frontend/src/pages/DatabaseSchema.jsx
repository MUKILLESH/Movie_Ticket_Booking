import React from 'react';
import { motion } from 'framer-motion';

const DatabaseSchema = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      style={{
        padding: '8rem 4rem 4rem',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '100vh',
        color: 'var(--c-text-primary)'
      }}
    >
      <div style={{ marginBottom: '4rem' }}>
        <h1 className="font-serif" style={{ 
          fontSize: '3.5rem', 
          fontWeight: 400, 
          letterSpacing: '-0.02em',
          marginBottom: '1.5rem',
          color: 'var(--c-gold)'
        }}>
          Database Implementation
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          opacity: 0.8, 
          maxWidth: '800px',
          lineHeight: 1.6
        }}>
          A basic explanation of the MySQL database structure that powers CineTicket, based on the ER Diagram.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '3rem' }}>
        
        {/* Section 1: Database Creation */}
        <section className="glass-panel" style={{ padding: '3rem', borderRadius: '24px' }}>
          <h2 className="font-serif" style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--c-gold)' }}>
            1. Creating the Database
          </h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9, lineHeight: 1.6 }}>
            The first step is to create the database to store all our tables. We ensure it only creates if it doesn't already exist.
          </p>
          <div style={{ background: '#111', padding: '1.5rem', borderRadius: '12px', overflowX: 'auto' }}>
            <pre style={{ margin: 0, color: '#e6e6e6', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              <code className="language-sql">
{`CREATE DATABASE IF NOT EXISTS movie_booking_db;
USE movie_booking_db;`}
              </code>
            </pre>
          </div>
        </section>

        {/* Section 2: Movie Table */}
        <section className="glass-panel" style={{ padding: '3rem', borderRadius: '24px' }}>
          <h2 className="font-serif" style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--c-gold)' }}>
            2. Creating the Core Tables
          </h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9, lineHeight: 1.6 }}>
            Based on the ER diagram, we have several entities. Let's look at how the <strong>MOVIE</strong> table is created. It stores the primary details of the films we show.
          </p>
          <div style={{ background: '#111', padding: '1.5rem', borderRadius: '12px', overflowX: 'auto', marginBottom: '2rem' }}>
            <pre style={{ margin: 0, color: '#e6e6e6', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              <code className="language-sql">
{`CREATE TABLE MOVIE (
    MovieID INT PRIMARY KEY AUTO_INCREMENT,
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    DurationMins INT NOT NULL,
    Language VARCHAR(50),
    ReleaseDate DATE,
    PosterUrl VARCHAR(500),
    BackdropUrl VARCHAR(500),
    Genre VARCHAR(100),
    Rating DECIMAL(3,1)
);`}
              </code>
            </pre>
          </div>

          <p style={{ marginBottom: '1.5rem', opacity: 0.9, lineHeight: 1.6 }}>
            Once the table is created, we can populate it with data using the <code>INSERT</code> command:
          </p>
          <div style={{ background: '#111', padding: '1.5rem', borderRadius: '12px', overflowX: 'auto' }}>
            <pre style={{ margin: 0, color: '#e6e6e6', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              <code className="language-sql">
{`INSERT INTO MOVIE (Title, DurationMins, Language, Genre) 
VALUES 
('Inception', 148, 'English', 'Sci-Fi'),
('Interstellar', 169, 'English', 'Sci-Fi');`}
              </code>
            </pre>
          </div>
        </section>

        {/* Section 3: ER Model Relationships */}
        <section className="glass-panel" style={{ padding: '3rem', borderRadius: '24px' }}>
          <h2 className="font-serif" style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--c-gold)' }}>
            3. Handling Relationships (ER Model)
          </h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9, lineHeight: 1.6 }}>
            The ER diagram defines how entities connect. For example, a Many-to-Many relationship exists between Bookings and Seats. We resolve this using a junction table called <code>BOOKING_SEAT</code>.
          </p>
          
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', opacity: 0.9 }}>
            <li><strong>THEATRE (1)</strong> to <strong>(M) SCREEN</strong></li>
            <li><strong>MOVIE (1)</strong> to <strong>(M) SHOW</strong></li>
            <li><strong>SCREEN (1)</strong> to <strong>(M) SHOW</strong></li>
            <li><strong>CUSTOMER (1)</strong> to <strong>(M) BOOKING</strong></li>
          </ul>

          <p style={{ marginBottom: '1.5rem', opacity: 0.9, lineHeight: 1.6 }}>
            Here is how we define foreign keys to link these tables together:
          </p>
          <div style={{ background: '#111', padding: '1.5rem', borderRadius: '12px', overflowX: 'auto' }}>
            <pre style={{ margin: 0, color: '#e6e6e6', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              <code className="language-sql">
{`CREATE TABLE SHOW (
    ShowID INT PRIMARY KEY AUTO_INCREMENT,
    MovieID INT NOT NULL,
    ScreenID INT NOT NULL,
    StartTime DATETIME NOT NULL,
    FOREIGN KEY (MovieID) REFERENCES MOVIE(MovieID),
    FOREIGN KEY (ScreenID) REFERENCES SCREEN(ScreenID)
);`}
              </code>
            </pre>
          </div>
        </section>

      </div>
    </motion.div>
  );
};

export default DatabaseSchema;
