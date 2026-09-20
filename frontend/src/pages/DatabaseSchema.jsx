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
          Database Architecture & Implementation
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          opacity: 0.8, 
          maxWidth: '800px',
          lineHeight: 1.6
        }}>
          An in-depth look at how the backend for CineTicket was built using MySQL. This covers the ER model translation, core SQL commands, and advanced DBMS concepts like row-level locking for concurrency control.
        </p>
      </div>

      <div style={{ display: 'grid', gap: '3rem' }}>
        
        {/* Section 1: ER Model and Schema Creation */}
        <section className="glass-panel" style={{ padding: '3rem', borderRadius: '24px' }}>
          <h2 className="font-serif" style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--c-gold)' }}>
            1. ER Model & Schema Creation
          </h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9, lineHeight: 1.6 }}>
            Our system is built on a relational model designed from an Entity-Relationship (ER) diagram. The core entities include <strong>Movie</strong>, <strong>Screen</strong>, <strong>Show</strong>, <strong>Seat</strong>, <strong>Customer</strong>, and <strong>Booking</strong>. Here are the actual SQL commands used to generate the foundation of our backend.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--c-gold)' }}>Creating the Database</h3>
              <div style={{ background: '#111', padding: '1.5rem', borderRadius: '12px', overflowX: 'auto' }}>
                <pre style={{ margin: 0, color: '#e6e6e6', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  <code className="language-sql">
{`CREATE DATABASE IF NOT EXISTS movie_booking_db;
USE movie_booking_db;`}
                  </code>
                </pre>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--c-gold)' }}>The MOVIE and SCREEN Entities</h3>
              <p style={{ marginBottom: '1rem', opacity: 0.9, fontSize: '0.95rem' }}>Independent entities that do not rely on other tables for their creation.</p>
              <div style={{ background: '#111', padding: '1.5rem', borderRadius: '12px', overflowX: 'auto' }}>
                <pre style={{ margin: 0, color: '#e6e6e6', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  <code className="language-sql">
{`CREATE TABLE MOVIE (
    MovieID INT PRIMARY KEY AUTO_INCREMENT,
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    DurationMins INT NOT NULL,
    Language VARCHAR(50),
    Genre VARCHAR(100),
    PosterUrl VARCHAR(500),
    BackdropUrl VARCHAR(500)
);

CREATE TABLE SCREEN (
    ScreenID INT PRIMARY KEY AUTO_INCREMENT,
    Name VARCHAR(50) NOT NULL,
    TotalSeats INT NOT NULL
);`}
                  </code>
                </pre>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '0.75rem', color: 'var(--c-gold)' }}>The SHOW Entity (Foreign Keys)</h3>
              <p style={{ marginBottom: '1rem', opacity: 0.9, fontSize: '0.95rem' }}>A <strong>SHOW</strong> resolves the Many-to-Many relationship between Movies and Screens (A screen plays many movies over time, a movie plays on many screens). It uses Foreign Keys to reference them.</p>
              <div style={{ background: '#111', padding: '1.5rem', borderRadius: '12px', overflowX: 'auto' }}>
                <pre style={{ margin: 0, color: '#e6e6e6', fontFamily: 'monospace', fontSize: '0.9rem' }}>
                  <code className="language-sql">
{`CREATE TABLE SHOW_SCHEDULE (
    ShowID INT PRIMARY KEY AUTO_INCREMENT,
    MovieID INT NOT NULL,
    ScreenID INT NOT NULL,
    StartTime DATETIME NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (MovieID) REFERENCES MOVIE(MovieID),
    FOREIGN KEY (ScreenID) REFERENCES SCREEN(ScreenID)
);`}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Resolving M:N Relationships */}
        <section className="glass-panel" style={{ padding: '3rem', borderRadius: '24px' }}>
          <h2 className="font-serif" style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--c-gold)' }}>
            2. Resolving the Booking-Seat Relationship
          </h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9, lineHeight: 1.6 }}>
            In our ER model, a <strong>Booking</strong> can contain multiple <strong>Seats</strong>, and over the lifespan of the cinema, a <strong>Seat</strong> belongs to multiple <strong>Bookings</strong> (for different shows). This is a classic Many-to-Many (M:N) relationship. To implement this in MySQL, we created a junction table called <code>BOOKING_SEAT</code>.
          </p>

          <div style={{ background: '#111', padding: '1.5rem', borderRadius: '12px', overflowX: 'auto' }}>
            <pre style={{ margin: 0, color: '#e6e6e6', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              <code className="language-sql">
{`CREATE TABLE BOOKING_SEAT (
    BookingID INT NOT NULL,
    SeatID INT NOT NULL,
    ShowID INT NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    PRIMARY KEY (BookingID, SeatID),
    FOREIGN KEY (BookingID) REFERENCES BOOKING(BookingID),
    FOREIGN KEY (SeatID) REFERENCES SEAT(SeatID),
    FOREIGN KEY (ShowID) REFERENCES SHOW_SCHEDULE(ShowID),
    
    -- The Final Defense: Prevents double booking at the schema level
    UNIQUE (ShowID, SeatID)
);`}
              </code>
            </pre>
          </div>
          <p style={{ marginTop: '1.5rem', opacity: 0.9, lineHeight: 1.6 }}>
            The <code>UNIQUE (ShowID, SeatID)</code> constraint ensures that at the database level, a specific seat can only ever be booked once for a specific show. If two concurrent transactions attempt to insert the same seat for the same show, MySQL will throw an <code>ER_DUP_ENTRY</code> error.
          </p>
        </section>

        {/* Section 3: Concurrency Control & Transactions */}
        <section className="glass-panel" style={{ padding: '3rem', borderRadius: '24px' }}>
          <h2 className="font-serif" style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--c-gold)' }}>
            3. Concurrency Control (Preventing Double Bookings)
          </h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9, lineHeight: 1.6 }}>
            The most critical DBMS aspect of this project is ensuring two users cannot book the same seat simultaneously. While the <code>UNIQUE</code> constraint acts as a final fail-safe, relying on it causes failed transactions and bad UX. Instead, we use <strong>Transactions and Row-Level Locking</strong>.
          </p>
          
          <p style={{ marginBottom: '1.5rem', opacity: 0.9, lineHeight: 1.6 }}>
            When a booking is initiated, the Node.js backend starts a MySQL Transaction using the <code>FOR UPDATE</code> clause:
          </p>

          <div style={{ background: '#111', padding: '1.5rem', borderRadius: '12px', overflowX: 'auto' }}>
            <pre style={{ margin: 0, color: '#e6e6e6', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              <code className="language-sql">
{`START TRANSACTION;

-- 1. Check if the seats are already booked for this show
SELECT SeatID FROM BOOKING_SEAT 
WHERE ShowID = ? AND SeatID IN (?, ?);

-- 2. Lock the specific seats so nobody else can read/write them
SELECT SeatID FROM SEAT 
WHERE SeatID IN (?, ?) 
FOR UPDATE;

-- 3. If seats are available, insert the booking
INSERT INTO BOOKING (CustomerID, TotalAmount, Status) VALUES (?, ?, 'CONFIRMED');

-- 4. Insert the junction records
INSERT INTO BOOKING_SEAT (BookingID, SeatID, ShowID, Price) VALUES (?, ?, ?, ?);

COMMIT; -- Or ROLLBACK if any step fails`}
              </code>
            </pre>
          </div>
          <p style={{ marginTop: '1.5rem', opacity: 0.9, lineHeight: 1.6 }}>
            The <code>FOR UPDATE</code> clause places an exclusive lock on the specific rows being read. If User B tries to book the same seats, their transaction will pause and wait for User A's transaction to finish (commit or rollback), guaranteeing Atomicity and Consistency.
          </p>
        </section>

        {/* Section 4: Optimizations */}
        <section className="glass-panel" style={{ padding: '3rem', borderRadius: '24px' }}>
          <h2 className="font-serif" style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--c-gold)' }}>
            4. Indexing and Performance
          </h2>
          <p style={{ marginBottom: '1.5rem', opacity: 0.9, lineHeight: 1.6 }}>
            To speed up read operations (like fetching all available seats for a show), we added Indexes to our Foreign Keys. Since relational databases heavily rely on <code>JOIN</code> operations, indexes prevent full-table scans.
          </p>
          <div style={{ background: '#111', padding: '1.5rem', borderRadius: '12px', overflowX: 'auto' }}>
            <pre style={{ margin: 0, color: '#e6e6e6', fontFamily: 'monospace', fontSize: '0.9rem' }}>
              <code className="language-sql">
{`CREATE INDEX idx_show_movie ON SHOW_SCHEDULE(MovieID);
CREATE INDEX idx_booking_customer ON BOOKING(CustomerID);
CREATE INDEX idx_booking_seat_show ON BOOKING_SEAT(ShowID);`}
              </code>
            </pre>
          </div>
        </section>

      </div>
    </motion.div>
  );
};

export default DatabaseSchema;
