import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { theme, TOC, TABLES, CRUD, QUESTIONS } from '../data/schemaPresentationData';
import { Play, Square, ChevronRight, ChevronLeft, MessageCircle, ChevronDown } from 'lucide-react';

const ProfessorNote = ({ text }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ marginTop: '2.5rem', background: '#FDFBF7', borderLeft: `4px solid ${theme.burgundy}`, borderRadius: '0 8px 8px 0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '1rem 1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.charcoal, fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.05em', textAlign: 'left' }}
      >
        <MessageCircle size={18} color={theme.burgundy} />
        WHAT TO SAY TO THE PROFESSOR
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ padding: '0 1.5rem 1.5rem 3rem', color: theme.textSecondary, fontSize: '1rem', lineHeight: 1.7, fontStyle: 'italic' }}>
            "{text}"
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CodeBlock = ({ language, code }) => (
  <div style={{ background: theme.codeBg, borderRadius: '12px', border: `1px solid ${theme.gold}40`, overflow: 'hidden', margin: '1.5rem 0', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1.5rem', fontSize: '0.75rem', color: theme.lightGold, letterSpacing: '0.1em', fontWeight: 600, borderBottom: `1px solid ${theme.gold}20` }}>
      {language.toUpperCase()}
    </div>
    <pre style={{ margin: 0, padding: '1.5rem', overflowX: 'auto', color: '#e6e6e6', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 1.6 }}>
      <code>{code}</code>
    </pre>
  </div>
);

const SlideSection = ({ id, num, title, children, isPresenting, isActive }) => {
  if (isPresenting && !isActive) return null;
  return (
    <motion.section 
      id={id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.6 }}
      style={{ 
        minHeight: isPresenting ? '100vh' : 'auto',
        padding: isPresenting ? '6rem 4rem' : '5rem 0 7rem 0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isPresenting ? 'center' : 'flex-start',
        borderBottom: isPresenting ? 'none' : `1px solid ${theme.border}`
      }}
    >
      <div style={{ marginBottom: '3.5rem' }}>
        <div style={{ color: theme.gold, fontSize: '2.5rem', fontWeight: 700, fontFamily: 'serif', marginBottom: '0.5rem', opacity: 0.8 }}>{num}</div>
        <h2 className="font-serif" style={{ fontSize: isPresenting ? '3.5rem' : '2.8rem', color: theme.charcoal, margin: 0, lineHeight: 1.1 }}>
          {title}
        </h2>
      </div>
      <div>{children}</div>
    </motion.section>
  );
};

const DatabaseSchema = () => {
  const [activeSection, setActiveSection] = useState(TOC[0].id);
  const [isPresenting, setIsPresenting] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (isPresenting) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );
    TOC.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [isPresenting]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
    setActiveSection(id);
  };

  const handleNext = () => {
    const currentIndex = TOC.findIndex(item => item.id === activeSection);
    if (currentIndex < TOC.length - 1) scrollTo(TOC[currentIndex + 1].id);
  };

  const handlePrev = () => {
    const currentIndex = TOC.findIndex(item => item.id === activeSection);
    if (currentIndex > 0) scrollTo(TOC[currentIndex - 1].id);
  };

  const FullSQLAppendix = `CREATE DATABASE IF NOT EXISTS movie_ticket_booking;
USE movie_ticket_booking;

CREATE TABLE IF NOT EXISTS THEATRE (
    TheatreID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Location VARCHAR(255) NOT NULL,
    City VARCHAR(100) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS SCREEN (
    ScreenID INT AUTO_INCREMENT PRIMARY KEY,
    ScreenNumber VARCHAR(20) NOT NULL,
    SeatCapacity INT NOT NULL CHECK (SeatCapacity > 0),
    TheatreID INT NOT NULL,
    FOREIGN KEY (TheatreID) REFERENCES THEATRE(TheatreID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS MOVIE (
    MovieID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Genre VARCHAR(100),
    Language VARCHAR(50),
    Duration INT NOT NULL CHECK (Duration > 0),
    ReleaseDate DATE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS \`SHOW\` (
    ShowID INT AUTO_INCREMENT PRIMARY KEY,
    ShowDate DATE NOT NULL,
    ShowTime TIME NOT NULL,
    Price DECIMAL(10, 2) NOT NULL CHECK (Price >= 0),
    MovieID INT NOT NULL,
    ScreenID INT NOT NULL,
    FOREIGN KEY (MovieID) REFERENCES MOVIE(MovieID) ON DELETE CASCADE,
    FOREIGN KEY (ScreenID) REFERENCES SCREEN(ScreenID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS SEAT (
    SeatID INT AUTO_INCREMENT PRIMARY KEY,
    SeatNumber VARCHAR(10) NOT NULL,
    SeatType ENUM('REGULAR', 'PREMIUM', 'VIP') NOT NULL DEFAULT 'REGULAR',
    ScreenID INT NOT NULL,
    FOREIGN KEY (ScreenID) REFERENCES SCREEN(ScreenID) ON DELETE CASCADE,
    UNIQUE (ScreenID, SeatNumber)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS CUSTOMER (
    CustomerID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Phone VARCHAR(20),
    Password VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS BOOKING (
    BookingID INT AUTO_INCREMENT PRIMARY KEY,
    BookingDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TotalAmount DECIMAL(10, 2) NOT NULL CHECK (TotalAmount >= 0),
    Status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    CustomerID INT NOT NULL,
    ShowID INT NOT NULL,
    FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(CustomerID) ON DELETE CASCADE,
    FOREIGN KEY (ShowID) REFERENCES \`SHOW\`(ShowID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS BOOKING_SEAT (
    BookingID INT NOT NULL,
    ShowID INT NOT NULL,
    SeatID INT NOT NULL,
    PRIMARY KEY (BookingID, SeatID),
    FOREIGN KEY (BookingID) REFERENCES BOOKING(BookingID) ON DELETE CASCADE,
    FOREIGN KEY (ShowID) REFERENCES \`SHOW\`(ShowID) ON DELETE CASCADE,
    FOREIGN KEY (SeatID) REFERENCES SEAT(SeatID) ON DELETE CASCADE,
    UNIQUE (ShowID, SeatID)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS PAYMENT (
    PaymentID INT AUTO_INCREMENT PRIMARY KEY,
    Amount DECIMAL(10, 2) NOT NULL CHECK (Amount >= 0),
    PaymentMode ENUM('UPI', 'CARD', 'NET_BANKING') NOT NULL,
    PaymentStatus ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    BookingID INT NOT NULL UNIQUE,
    TransactionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (BookingID) REFERENCES BOOKING(BookingID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_show_movie ON \`SHOW\`(MovieID);
CREATE INDEX idx_show_screen ON \`SHOW\`(ScreenID);
CREATE INDEX idx_show_date ON \`SHOW\`(ShowDate);
CREATE INDEX idx_booking_customer ON BOOKING(CustomerID);
CREATE INDEX idx_booking_show ON BOOKING(ShowID);
CREATE INDEX idx_booking_seat_show_seat ON BOOKING_SEAT(ShowID, SeatID);

CREATE OR REPLACE VIEW view_show_seats AS
SELECT 
    s.SeatID, s.SeatNumber, s.SeatType, sh.ShowID, sh.Price,
    CASE 
        WHEN b.Status = 'CANCELLED' OR b.Status = 'FAILED' THEN 'AVAILABLE'
        WHEN bs.SeatID IS NULL THEN 'AVAILABLE'
        ELSE 'BOOKED'
    END AS Status
FROM SEAT s
JOIN \`SHOW\` sh ON s.ScreenID = sh.ScreenID
LEFT JOIN BOOKING_SEAT bs ON s.SeatID = bs.SeatID AND sh.ShowID = bs.ShowID
LEFT JOIN BOOKING b ON bs.BookingID = b.BookingID;`;

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', color: theme.charcoal, fontFamily: 'sans-serif', transition: 'all 0.5s ease', fontSize: isPresenting ? '1.1rem' : '1rem' }}>
      
      {/* Presentation Toggle */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, display: 'flex', gap: '1rem' }}>
        {isPresenting && (
          <>
            <button onClick={handlePrev} style={{ background: theme.surface, border: `1px solid ${theme.border}`, padding: '1rem', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}><ChevronLeft color={theme.charcoal} /></button>
            <button onClick={handleNext} style={{ background: theme.surface, border: `1px solid ${theme.border}`, padding: '1rem', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}><ChevronRight color={theme.charcoal} /></button>
          </>
        )}
        <button 
          onClick={() => setIsPresenting(!isPresenting)}
          style={{ background: isPresenting ? theme.charcoal : theme.gold, color: '#fff', border: 'none', padding: '1rem 1.5rem', borderRadius: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', transition: 'all 0.3s' }}
        >
          {isPresenting ? <><Square size={18} /> EXIT PRESENTATION</> : <><Play size={18} /> PRESENTATION MODE</>}
        </button>
      </div>

      {/* Editorial Hero */}
      {!isPresenting && (
        <div style={{ paddingTop: '10rem', paddingBottom: '6rem', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 4rem' }}>
            <div style={{ color: theme.gold, fontWeight: 700, letterSpacing: '0.1em', fontSize: '0.85rem', marginBottom: '1.5rem' }}>DATABASE SYSTEM</div>
            <h1 className="font-serif" style={{ fontSize: '4.5rem', fontWeight: 400, color: theme.charcoal, lineHeight: 1.1, marginBottom: '2.5rem' }}>
              DATABASE ARCHITECTURE<br />& IMPLEMENTATION
            </h1>
            <p style={{ fontSize: '1.6rem', color: theme.textSecondary, maxWidth: '800px', fontStyle: 'italic', marginBottom: '5rem', lineHeight: 1.4 }}>
              "How CineTicket transforms its cinema booking model into a relational MySQL backend."
            </p>
            
            <div style={{ display: 'flex', gap: '5rem', borderTop: `1px solid ${theme.border}`, paddingTop: '2.5rem' }}>
              {[{l: 'DATABASE', v: 'MySQL'}, {l: 'BACKEND', v: 'Node.js / Express'}, {l: 'DRIVER', v: 'mysql2/promise'}, {l: 'MODEL', v: 'Relational Database'}].map(m => (
                <div key={m.l}>
                  <div style={{ fontSize: '0.75rem', color: theme.textSecondary, letterSpacing: '0.1em', marginBottom: '0.5rem', fontWeight: 600 }}>{m.l}</div>
                  <div style={{ fontWeight: 600, color: theme.charcoal, fontSize: '1.1rem' }}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', maxWidth: isPresenting ? '1600px' : '1400px', margin: '0 auto', padding: isPresenting ? '0' : '4rem', gap: '5rem' }}>
        
        {/* Sticky TOC */}
        {!isPresenting && (
          <div style={{ width: '260px', flexShrink: 0 }}>
            <div style={{ position: 'sticky', top: '8rem', maxHeight: 'calc(100vh - 10rem)', overflowY: 'auto', paddingRight: '1rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', color: theme.textSecondary, marginBottom: '2rem' }}>CONTENTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {TOC.map(item => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    style={{
                      textAlign: 'left', background: 'none', border: 'none', fontSize: '0.85rem', cursor: 'pointer', padding: '0.4rem 0', paddingLeft: '1rem', marginLeft: '-1rem',
                      color: activeSection === item.id ? theme.charcoal : theme.textSecondary,
                      fontWeight: activeSection === item.id ? 700 : 400,
                      borderLeft: activeSection === item.id ? `2px solid ${theme.gold}` : '2px solid transparent',
                      transition: 'all 0.2s',
                      display: 'flex', gap: '0.75rem'
                    }}
                  >
                    <span style={{ color: activeSection === item.id ? theme.gold : theme.textSecondary, opacity: activeSection === item.id ? 1 : 0.5 }}>{item.num}</span> 
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div ref={containerRef} style={{ flexGrow: 1, maxWidth: isPresenting ? '100%' : '900px', transition: 'max-width 0.5s' }}>
          
          <SlideSection id="sec-01" num="01" title="DATABASE ARCHITECTURE" isPresenting={isPresenting} isActive={activeSection === 'sec-01'}>
            <h3 style={{ fontSize: '1.4rem', color: theme.charcoal, marginBottom: '1rem' }}>Why a Relational Database?</h3>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '3rem' }}>
              The cinema booking system contains strictly structured entities: <strong>Movies, Theatres, Screens, Seats, Shows, Customers, and Bookings.</strong> These entities have inherent, unbreakable relationships. A seat cannot exist without a screen. A booking cannot exist without a customer. We chose a Relational Database (MySQL) because it enforces <strong>referential integrity</strong> via Foreign Keys, and supports robust <strong>concurrency control</strong> via ACID transactions, preventing double-booking disasters.
            </p>
            <h3 style={{ fontSize: '1.4rem', color: theme.charcoal, marginBottom: '1.5rem' }}>How Data Moves</h3>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: theme.surface, padding: '4rem', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
              {['USER', 'REACT FRONTEND', 'NODE.JS / EXPRESS', 'MYSQL2 CONNECTION POOL', 'MYSQL DATABASE', 'RELATIONAL TABLES'].map((node, i) => (
                <React.Fragment key={node}>
                  <div style={{ background: theme.surface, border: `1px solid ${theme.gold}50`, padding: '1rem 3rem', borderRadius: '8px', fontWeight: 600, letterSpacing: '0.05em', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', width: '350px', textAlign: 'center' }}>{node}</div>
                  {i < 5 && <div style={{ height: '30px', width: '2px', background: theme.gold }}></div>}
                </React.Fragment>
              ))}
            </div>
            <ProfessorNote text="Our architecture separates concerns. We don't write SQL in React. The frontend handles the UI. The Express backend handles the business logic, transaction locks, and query construction. MySQL strictly handles data persistence, constraints, and relational integrity. When a user books a ticket, the data flows linearly down this stack." />
          </SlideSection>

          <SlideSection id="sec-02" num="02" title="ER MODEL" isPresenting={isPresenting} isActive={activeSection === 'sec-02'}>
            <h3 style={{ fontSize: '1.4rem', color: theme.charcoal, marginBottom: '1rem' }}>The Conceptual Model</h3>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              Before writing any SQL, we mapped out the real-world cinema domain into an Entity-Relationship (ER) model. This conceptual diagram identifies all actors and objects in the system.
            </p>
            <div style={{ background: theme.surface, padding: '2rem', border: `1px solid ${theme.gold}`, borderRadius: '8px', marginBottom: '3rem', textAlign: 'center', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <span style={{ color: theme.textSecondary, letterSpacing: '0.1em' }}>[ ACTUAL CINETICKET ER DIAGRAM PLACEMENT ]</span>
            </div>
            
            <h3 style={{ fontSize: '1.4rem', color: theme.charcoal, marginBottom: '1.5rem' }}>From ER Model to Relational Schema</h3>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              The conceptual model was then translated into a physical relational schema:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div style={{ background: theme.surface, padding: '2rem', border: `1px solid ${theme.border}`, borderRadius: '12px' }}>
                <strong style={{ color: theme.charcoal, display: 'block', marginBottom: '1rem' }}>1. ENTITIES → TABLES</strong>
                <p style={{ color: theme.textSecondary, margin: 0 }}>Every solid entity (Theatre, Movie, Customer) became an independent MySQL table with an Auto-Increment Primary Key.</p>
              </div>
              <div style={{ background: theme.surface, padding: '2rem', border: `1px solid ${theme.border}`, borderRadius: '12px' }}>
                <strong style={{ color: theme.charcoal, display: 'block', marginBottom: '1rem' }}>2. RELATIONSHIPS → FOREIGN KEYS</strong>
                <p style={{ color: theme.textSecondary, margin: 0 }}>The lines connecting entities became Foreign Keys. M:N relationships (like Booking ↔ Seat) were resolved using Junction Tables.</p>
              </div>
            </div>
            <ProfessorNote text="The ER diagram was our blueprint. It visually proved that we couldn't just have a 'Movie' and a 'Theatre' table—we needed a 'Show' table to act as the intersection where a movie is scheduled at a specific theatre on a specific date. Once the conceptual model was solid, we translated it directly into SQL CREATE TABLE scripts." />
          </SlideSection>

          <SlideSection id="sec-03" num="03" title="SCHEMA OVERVIEW" isPresenting={isPresenting} isActive={activeSection === 'sec-03'}>
            <h3 style={{ fontSize: '1.4rem', color: theme.charcoal, marginBottom: '1rem' }}>The Dependency Chain</h3>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '3rem' }}>
              In a relational database, tables cannot be created randomly. Parent tables must be created before dependent tables, otherwise Foreign Key constraints will fail.
            </p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', marginBottom: '4rem' }}>
              <div>
                <h4 style={{ color: theme.gold, marginBottom: '1.5rem', letterSpacing: '0.1em' }}>INDEPENDENT ENTITIES</h4>
                {['THEATRE', 'MOVIE', 'CUSTOMER'].map((t, i) => (
                  <div key={t} style={{ background: theme.surface, padding: '1rem 1.5rem', border: `1px solid ${theme.border}`, borderRadius: '8px', marginBottom: '1rem', fontWeight: 600 }}>{i+1}. {t}</div>
                ))}
              </div>
              <div>
                <h4 style={{ color: theme.charcoal, marginBottom: '1.5rem', letterSpacing: '0.1em' }}>DEPENDENT ENTITIES</h4>
                {['SCREEN (Depends on Theatre)', 'SHOW (Depends on Movie & Screen)', 'SEAT (Depends on Screen)', 'BOOKING (Depends on Customer & Show)', 'BOOKING_SEAT (Depends on Booking & Seat)', 'PAYMENT (Depends on Booking)'].map((t, i) => (
                  <div key={t} style={{ background: theme.surface, padding: '1rem 1.5rem', border: `1px solid ${theme.gold}50`, borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    <strong>{i+4}. {t.split('(')[0]}</strong> <span style={{ color: theme.textSecondary }}>({t.split('(')[1]}</span>
                  </div>
                ))}
              </div>
            </div>
            <ProfessorNote text="This dependency chain dictates our exact database creation script. If we tried to create the BOOKING table before the CUSTOMER table, MySQL would throw a Foreign Key error because it can't reference a table that doesn't exist yet." />
          </SlideSection>

          <SlideSection id="sec-04" num="04" title="DATABASE CREATION" isPresenting={isPresenting} isActive={activeSection === 'sec-04'}>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              The initialization of the backend begins with establishing the database context in MySQL.
            </p>
            <CodeBlock language="SQL" code={`CREATE DATABASE IF NOT EXISTS movie_ticket_booking;\\nUSE movie_ticket_booking;`} />
            <div style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
              {[{t:'CREATE DATABASE', d:'Instantiates the new database schema on the MySQL server.'},{t:'IF NOT EXISTS', d:'Prevents execution errors if the script is run multiple times (idempotency).'},{t:'USE', d:'Selects the database as the active context so subsequent table creations are placed inside it.'}].map(x=>(
                <div key={x.t} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', background: theme.surface, padding: '1.5rem', border: `1px solid ${theme.border}`, borderRadius: '8px', alignItems: 'center' }}>
                  <strong style={{ color: theme.charcoal }}>{x.t}</strong><span style={{ color: theme.textSecondary }}>{x.d}</span>
                </div>
              ))}
            </div>
            <ProfessorNote text="This is the very first step in our migrate.js deployment script. We explicitly use 'IF NOT EXISTS' so that if we re-run the backend deployment, it doesn't crash trying to create a database that's already there." />
          </SlideSection>

          <SlideSection id="sec-05" num="05" title="TABLE CREATION" isPresenting={isPresenting} isActive={activeSection === 'sec-05'}>
             <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '4rem' }}>
              Below is the complete, exact DDL (Data Definition Language) used to instantiate the 9 tables of the CineTicket backend.
            </p>
            {TABLES.map((table, i) => (
              <div key={table.name} style={{ marginBottom: '5rem', paddingBottom: '4rem', borderBottom: i < TABLES.length - 1 ? `1px solid ${theme.border}` : 'none' }}>
                <div style={{ color: theme.gold, fontSize: '0.9rem', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '0.5rem' }}>TABLE 0{i+1}</div>
                <h3 style={{ fontSize: '2rem', color: theme.charcoal, margin: '0 0 1rem 0' }}>{table.name}</h3>
                <p style={{ color: theme.textSecondary, fontSize: '1.1rem', marginBottom: '2rem' }}><strong>PURPOSE:</strong> {table.purpose}</p>
                
                <CodeBlock language="SQL" code={table.sql} />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
                  <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: theme.charcoal }}>COLUMN BREAKDOWN</h4>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: theme.textSecondary, fontSize: '0.95rem', lineHeight: 1.6 }}>
                      {table.columns.map((c, j) => (
                        <li key={j} style={{ marginBottom: '0.5rem' }}><strong>{c.name}:</strong> {c.desc}</li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '1.5rem' }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: theme.charcoal }}>KEYS & RELATIONSHIPS</h4>
                    <div style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}><strong style={{ color: theme.gold }}>PK:</strong> {table.pk}</div>
                    <div style={{ marginBottom: '0.75rem', fontSize: '0.95rem' }}><strong style={{ color: theme.burgundy }}>FK:</strong> {table.fk}</div>
                    <div style={{ marginBottom: '0.75rem', fontSize: '0.95rem', color: theme.textSecondary }}><strong>Rel:</strong> {table.relationships}</div>
                  </div>
                </div>
                
                <div style={{ background: theme.bg, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '1.5rem', marginTop: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: theme.charcoal, fontSize: '0.9rem', letterSpacing: '0.05em' }}>BACKEND USAGE</h4>
                  <code style={{ color: theme.burgundy, fontSize: '0.9rem' }}>{table.usage}</code>
                </div>

                <ProfessorNote text={table.professorNote} />
              </div>
            ))}
          </SlideSection>

          <SlideSection id="sec-06" num="06" title="PRIMARY KEYS & AUTO_INCREMENT" isPresenting={isPresenting} isActive={activeSection === 'sec-06'}>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '3rem' }}>
              Every single table in our relational database requires a Primary Key to uniquely identify a record. We heavily utilized <code>AUTO_INCREMENT</code> integers for efficiency.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
              {TABLES.map(t => (
                <div key={t.name} style={{ background: theme.surface, padding: '1.5rem', border: `1px solid ${theme.border}`, borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: theme.charcoal, marginBottom: '0.5rem' }}>{t.name}</div>
                  <div style={{ color: theme.gold, fontSize: '0.9rem', fontWeight: 600 }}>{t.pk.replace('Composite: ', '')}</div>
                </div>
              ))}
            </div>
            <div style={{ background: theme.surface, padding: '2rem', border: `1px solid ${theme.border}`, borderRadius: '12px' }}>
              <h4 style={{ color: theme.charcoal, margin: '0 0 1rem 0' }}>Why AUTO_INCREMENT?</h4>
              <p style={{ color: theme.textSecondary, margin: 0, lineHeight: 1.6 }}>Instead of forcing our Node.js backend to query the database to find the highest ID and manually add 1 (which would cause race conditions), we let the MySQL engine handle ID generation natively at the point of insertion.</p>
            </div>
            <ProfessorNote text="You'll notice 8 of our 9 tables use a single integer ID as the primary key. However, BOOKING_SEAT is different. It uses a COMPOSITE primary key made of both BookingID and SeatID. This structurally prevents a single booking from accidentally reserving the exact same physical seat twice." />
          </SlideSection>

          <SlideSection id="sec-07" num="07" title="FOREIGN KEYS & REFERENTIAL INTEGRITY" isPresenting={isPresenting} isActive={activeSection === 'sec-07'}>
             <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '3rem' }}>
              Foreign Keys are the "relational" part of a Relational Database. They link dependent tables back to their parent tables.
            </p>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {['SCREEN.TheatreID → THEATRE.TheatreID', 'SEAT.ScreenID → SCREEN.ScreenID', 'SHOW.MovieID → MOVIE.MovieID', 'SHOW.ScreenID → SCREEN.ScreenID', 'BOOKING.CustomerID → CUSTOMER.CustomerID', 'BOOKING.ShowID → SHOW.ShowID'].map(rel => (
                  <div key={rel} style={{ background: theme.surface, padding: '1.5rem', border: `1px solid ${theme.gold}50`, borderRadius: '8px', textAlign: 'center', fontWeight: 600, color: theme.charcoal, fontSize: '0.85rem' }}>
                    {rel.split(' → ')[0]}<br/><span style={{ color: theme.burgundy, fontSize: '1.2rem', margin: '0.2rem 0', display: 'inline-block' }}>↓</span><br/>{rel.split(' → ')[1]}
                  </div>
                ))}
             </div>
             <CodeBlock language="SQL" code={`FOREIGN KEY (TheatreID) REFERENCES THEATRE(TheatreID) ON DELETE CASCADE`} />
             <div style={{ background: theme.surface, padding: '2rem', border: `1px solid ${theme.border}`, borderRadius: '12px' }}>
                <h4 style={{ color: theme.charcoal, margin: '0 0 1rem 0' }}>ON DELETE CASCADE</h4>
                <p style={{ color: theme.textSecondary, margin: 0, lineHeight: 1.6 }}>We appended `ON DELETE CASCADE` to all foreign keys. If a theatre is permanently closed and deleted from the THEATRE table, MySQL will automatically cascade that deletion downward, removing all Screens and Seats associated with that theatre, ensuring no orphaned data is left behind.</p>
             </div>
             <ProfessorNote text="Foreign Keys enforce Referential Integrity. If our Node backend has a bug and attempts to insert a SHOW with a fake MovieID like 9999, MySQL will reject the insertion because Movie 9999 does not exist in the parent MOVIE table. The database protects itself." />
          </SlideSection>

          <SlideSection id="sec-08" num="08" title="CONSTRAINTS" isPresenting={isPresenting} isActive={activeSection === 'sec-08'}>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '3rem' }}>
              Beyond primary and foreign keys, we used additional schema constraints to enforce business rules directly at the data layer.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {[
                {c: 'NOT NULL', sql: 'Name VARCHAR(100) NOT NULL', why: 'Ensures required data like Theatre Names are never empty.'},
                {c: 'UNIQUE', sql: 'Email VARCHAR(100) NOT NULL UNIQUE', why: 'Prevents duplicate customer accounts. Duplicate emails will throw an ER_DUP_ENTRY error.'},
                {c: 'CHECK', sql: 'Price DECIMAL(10, 2) CHECK (Price >= 0)', why: 'Enforces business logic. A ticket price can never be negative.'},
                {c: 'DEFAULT', sql: 'BookingDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP', why: 'Allows the database to record the exact transaction time natively.'},
                {c: 'ENUM', sql: 'Status ENUM(\'PENDING\', \'CONFIRMED\', \'FAILED\')', why: 'Restricts status strings to specific states, preventing typos from the backend.'},
                {c: 'UNIQUE (COMPOSITE)', sql: 'UNIQUE (ScreenID, SeatNumber)', why: 'Ensures "Seat A1" only exists once inside a specific screen, but allows "Seat A1" to exist across multiple screens.'}
              ].map(con => (
                 <div key={con.c} style={{ background: theme.surface, padding: '2rem', border: `1px solid ${theme.border}`, borderRadius: '12px' }}>
                    <h4 style={{ color: theme.gold, margin: '0 0 1rem 0' }}>{con.c}</h4>
                    <p style={{ color: theme.charcoal, margin: '0 0 1rem 0', fontSize: '0.95rem' }}>{con.why}</p>
                    <code style={{ background: theme.bg, padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem', color: theme.burgundy }}>{con.sql}</code>
                 </div>
              ))}
            </div>
            <ProfessorNote text="We pushed as much logic into the database schema as possible using constraints like CHECK and ENUM. While the frontend and backend both have validation, the database constraints are the final, impenetrable wall that guarantees data correctness." />
          </SlideSection>

          <SlideSection id="sec-09" num="09" title="DATA POPULATION" isPresenting={isPresenting} isActive={activeSection === 'sec-09'}>
            <div style={{ background: theme.surface, padding: '4rem', textAlign: 'center', border: `1px dashed ${theme.textSecondary}`, borderRadius: '16px' }}>
              <div style={{ color: theme.textSecondary, fontSize: '1.2rem', fontStyle: 'italic' }}>
                No automated database population / seed SQL was found in the documented implementation.
              </div>
              <p style={{ color: theme.charcoal, marginTop: '1rem' }}>
                Data (Theatres, Movies, Seats) is currently populated dynamically through the backend API or direct administrative insertion rather than a hardcoded <code>INSERT</code> seed script.
              </p>
            </div>
            <ProfessorNote text="We focused our implementation on the dynamic booking system. Rather than hardcoding INSERT statements into our schema file, movies and theatres are added dynamically. However, when we do insert data, we must follow the dependency chain (Theatre before Screen, etc.)." />
          </SlideSection>

          <SlideSection id="sec-10" num="10" title="CRUD OPERATIONS" isPresenting={isPresenting} isActive={activeSection === 'sec-10'}>
             <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '3rem' }}>
              The Express backend executes standard Create, Read, Update, and Delete operations using raw parameterized SQL.
            </p>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {CRUD.map(c => (
                  <div key={c.title} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '12px', padding: '2.5rem', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                    <h4 style={{ color: theme.charcoal, margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>{c.title}</h4>
                    <div style={{ color: theme.gold, fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', letterSpacing: '0.05em' }}>{c.endpoint}</div>
                    <p style={{ color: theme.textSecondary, fontSize: '1rem', margin: '0 0 1.5rem 0', lineHeight: 1.6 }}>{c.purpose}</p>
                    <div style={{ marginTop: 'auto', background: theme.codeBg, padding: '1.2rem', borderRadius: '8px', color: '#e6e6e6', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                      {c.sql}
                    </div>
                  </div>
                ))}
             </div>
             <ProfessorNote text="These are the exact queries executed by our Express controllers. We explicitly avoided using an ORM (like Prisma) so we could maintain direct control over the SQL execution, optimize our own indexes, and demonstrate true database management skills." />
          </SlideSection>

          <SlideSection id="sec-11" num="11" title="READING DATA" isPresenting={isPresenting} isActive={activeSection === 'sec-11'}>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              Retrieving data for the frontend requires precise `SELECT` queries mapped to specific endpoints.
            </p>
            <div style={{ background: theme.surface, padding: '2rem', border: `1px solid ${theme.border}`, borderRadius: '12px' }}>
              <div style={{ color: theme.gold, fontWeight: 700, marginBottom: '1rem' }}>ENDPOINT: GET /api/movies</div>
              <CodeBlock language="SQL" code={`SELECT * FROM MOVIE WHERE MovieID = ?`} />
              <div style={{ marginTop: '1.5rem', color: theme.charcoal, lineHeight: 1.6 }}>
                <strong>SELECT:</strong> Fetches all columns for the specified movie.<br/>
                <strong>FROM:</strong> Targets the MOVIE table.<br/>
                <strong>WHERE:</strong> Filters results down to a specific ID passed in from the React frontend.<br/>
                <strong>PARAMETERIZATION (?):</strong> The `?` is automatically escaped by mysql2, preventing SQL Injection attacks.
              </div>
            </div>
            <ProfessorNote text="Reading data is straightforward, but security is critical. By using '?' parameterization in our WHERE clauses, the mysql2 driver sanitizes the input before it hits the database, making SQL injection impossible." />
          </SlideSection>

          <SlideSection id="sec-12" num="12" title="SQL JOINS" isPresenting={isPresenting} isActive={activeSection === 'sec-12'}>
            <h3 style={{ fontSize: '1.4rem', color: theme.charcoal, marginBottom: '1rem' }}>Why Do We Need Joins?</h3>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '3rem' }}>
              Because our database is highly normalized (3NF), a single table rarely has all the information. A `BOOKING` record only stores integer IDs. To show the user a complete digital receipt, we must trace those foreign keys across 6 tables using `INNER JOIN`.
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
              {['BOOKING', 'CUSTOMER', 'SHOW', 'MOVIE', 'SCREEN', 'THEATRE'].map((t, i) => (
                <React.Fragment key={t}>
                  <div style={{ background: theme.surface, padding: '1rem 1.5rem', borderRadius: '30px', border: `1px solid ${theme.gold}`, fontWeight: 600, fontSize: '0.9rem' }}>{t}</div>
                  {i < 5 && <div style={{ color: theme.burgundy }}>→</div>}
                </React.Fragment>
              ))}
            </div>

            <CodeBlock language="SQL" code={`SELECT b.BookingID, b.BookingDate, b.TotalAmount, b.Status, c.Name as CustomerName,
       s.ShowDate, s.ShowTime, m.Title as MovieTitle, t.Name as TheatreName, sc.ScreenNumber
FROM BOOKING b
JOIN CUSTOMER c ON b.CustomerID = c.CustomerID
JOIN \`SHOW\` s ON b.ShowID = s.ShowID
JOIN MOVIE m ON s.MovieID = m.MovieID
JOIN SCREEN sc ON s.ScreenID = sc.ScreenID
JOIN THEATRE t ON sc.TheatreID = t.TheatreID
WHERE b.BookingID = ?`} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
               <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, padding: '1.5rem', borderRadius: '8px' }}>
                 <strong style={{ color: theme.gold, display: 'block', marginBottom: '0.5rem' }}>INPUT</strong>
                 <div style={{ color: theme.charcoal }}>BookingID (e.g., 1042)</div>
               </div>
               <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, padding: '1.5rem', borderRadius: '8px' }}>
                 <strong style={{ color: theme.gold, display: 'block', marginBottom: '0.5rem' }}>OUTPUT</strong>
                 <div style={{ color: theme.charcoal }}>Customer name, Movie title, Show date/time, Theatre name, Screen #, Amount, Status.</div>
               </div>
            </div>
            <ProfessorNote text="This query perfectly demonstrates the power of a relational database. We pass in a single BookingID, and MySQL traverses 5 foreign key relationships instantly to return a flat, comprehensive JSON object that the React frontend renders into a ticket receipt." />
          </SlideSection>

          <SlideSection id="sec-13" num="13" title="SEAT AVAILABILITY" isPresenting={isPresenting} isActive={activeSection === 'sec-13'}>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              To display the interactive seat selection grid, we need to return every physical seat in the auditorium and determine its availability status. We accomplish this using a powerful database <strong>VIEW</strong>.
            </p>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '3rem', fontSize: '1.1rem', fontWeight: 600 }}>
              <div>SEAT</div><div style={{ color: theme.gold }}>+</div>
              <div>SHOW</div><div style={{ color: theme.gold }}>+</div>
              <div>BOOKING_SEAT</div><div style={{ color: theme.gold }}>+</div>
              <div>BOOKING</div><div style={{ color: theme.burgundy }}>→</div>
              <div style={{ background: theme.charcoal, color: '#fff', padding: '0.5rem 1rem', borderRadius: '6px' }}>VIEW</div>
            </div>

            <CodeBlock language="SQL" code={`CREATE OR REPLACE VIEW view_show_seats AS
SELECT 
    s.SeatID,
    s.SeatNumber,
    s.SeatType,
    sh.ShowID,
    sh.Price,
    CASE 
        WHEN b.Status = 'CANCELLED' OR b.Status = 'FAILED' THEN 'AVAILABLE'
        WHEN bs.SeatID IS NULL THEN 'AVAILABLE'
        ELSE 'BOOKED'
    END AS Status
FROM SEAT s
JOIN \`SHOW\` sh ON s.ScreenID = sh.ScreenID
LEFT JOIN BOOKING_SEAT bs ON s.SeatID = bs.SeatID AND sh.ShowID = bs.ShowID
LEFT JOIN BOOKING b ON bs.BookingID = b.BookingID;`} />
            <ProfessorNote text="This is an excellent use of a LEFT JOIN. If we used an INNER JOIN, the database would only return seats that have already been booked. By using a LEFT JOIN, MySQL returns all seats. We then use a CASE statement to check if the 'booking_seat' ID is NULL. If it is NULL, it means no booking exists for that seat, so we label it 'AVAILABLE'." />
          </SlideSection>

          <SlideSection id="sec-14" num="14" title="BOOKING WORKFLOW" isPresenting={isPresenting} isActive={activeSection === 'sec-14'}>
             <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '3rem' }}>
              The end-to-end lifecycle of a ticket transaction traverses the presentation tier, application tier, and data tier.
            </p>
             <div style={{ display: 'grid', gap: '0.75rem', background: theme.surface, padding: '3rem', borderRadius: '16px', border: `1px solid ${theme.border}` }}>
                {[
                  'User selects movie and showtime on UI.',
                  'User views seat availability (Queries view_show_seats).',
                  'User selects seats and clicks Confirm.',
                  'React sends POST request to Express backend.',
                  'Backend initiates START TRANSACTION in MySQL.',
                  'Backend queries SELECT ... FOR UPDATE to lock seat rows.',
                  'Backend runs INSERT INTO BOOKING.',
                  'Backend runs bulk INSERT INTO BOOKING_SEAT.',
                  'Payment processing (Mocked).',
                  'Backend executes COMMIT to finalize data.',
                  'Backend returns 201 Success to React.',
                  'React renders the digital ticket receipt.'
                ].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ width: '35px', height: '35px', borderRadius: '50%', background: theme.gold, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', flexShrink: 0 }}>{i+1}</div>
                    <div style={{ fontWeight: 600, color: theme.charcoal, fontSize: '1.05rem' }}>{step}</div>
                  </div>
                ))}
             </div>
             <ProfessorNote text="This workflow proves that our database operations don't happen in a vacuum. Everything from viewing the seat map (a Read operation) to locking the seats and committing the data (a Transaction operation) is triggered sequentially by the user's journey through the website." />
          </SlideSection>

          <SlideSection id="sec-15" num="15" title="TRANSACTIONS" isPresenting={isPresenting} isActive={activeSection === 'sec-15'}>
            <h3 style={{ fontSize: '1.4rem', color: theme.charcoal, marginBottom: '1rem' }}>Why Are Transactions Necessary?</h3>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              A booking requires inserting data into multiple tables. If the `BOOKING` inserts successfully, but the `BOOKING_SEAT` insert fails (e.g., database crash), we are left with a corrupted partial booking. Transactions prevent this.
            </p>
            <CodeBlock language="JAVASCRIPT" code={`// backend/src/services/bookingService.js
const connection = await pool.getConnection();

try {
    await connection.beginTransaction();

    // 1. Lock seats
    await connection.query('SELECT ... FOR UPDATE');

    // 2. Insert parent Booking
    await connection.query('INSERT INTO BOOKING ...');

    // 3. Insert Many-to-Many records
    await connection.query('INSERT INTO BOOKING_SEAT ...');

    // 4. If all successful, save permanently
    await connection.commit();

} catch (error) {
    // 5. If ANY error occurs, erase everything
    await connection.rollback();
    throw error;
} finally {
    connection.release();
}`} />
            <ProfessorNote text="We manage the transaction lifecycle inside Node.js. We open the transaction, run our queries, and if everything succeeds, we COMMIT. If ANY error is caught, we execute ROLLBACK, which instantly erases the pending data from the database as if the transaction never happened." />
          </SlideSection>

          <SlideSection id="sec-16" num="16" title="CONCURRENCY CONTROL" isPresenting={isPresenting} isActive={activeSection === 'sec-16'}>
             <h3 style={{ fontSize: '1.4rem', color: theme.charcoal, marginBottom: '1rem' }}>The Double-Booking Problem</h3>
             <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              If User A and User B both select Seat D6 and hit checkout at the exact same millisecond, they could theoretically both book the same seat. We prevent this using <strong>Pessimistic Row-Level Locking</strong>.
            </p>
            <CodeBlock language="SQL" code={`-- Executed inside the transaction:
SELECT SeatID, SeatType 
FROM SEAT 
WHERE SeatID IN (?, ?) AND ScreenID = ? 
FOR UPDATE;  -- <--- The Lock
`} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '3rem' }}>
               <div style={{ background: theme.surface, padding: '2rem', border: `1px solid ${theme.gold}`, borderRadius: '12px', textAlign: 'center' }}>
                  <h4 style={{ color: theme.gold, margin: '0 0 1rem 0', fontSize: '1.2rem' }}>USER A</h4>
                  <div>Selects Seat D6</div><div style={{ color: theme.burgundy, margin:'0.5rem 0' }}>↓</div>
                  <div>Transaction Begins</div><div style={{ color: theme.burgundy, margin:'0.5rem 0' }}>↓</div>
                  <div style={{ fontWeight: 600 }}>FOR UPDATE executes</div><div style={{ color: theme.burgundy, margin:'0.5rem 0' }}>↓</div>
                  <div style={{ background: `${theme.gold}20`, padding: '0.75rem', borderRadius:'8px', fontWeight: 600 }}>ROW IS LOCKED</div><div style={{ color: theme.burgundy, margin:'0.5rem 0' }}>↓</div>
                  <div>Booking Inserted</div><div style={{ color: theme.burgundy, margin:'0.5rem 0' }}>↓</div>
                  <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>COMMIT</div>
               </div>
               <div style={{ background: theme.surface, padding: '2rem', border: `1px dashed ${theme.textSecondary}`, borderRadius: '12px', textAlign: 'center', opacity: 0.8 }}>
                  <h4 style={{ color: theme.charcoal, margin: '0 0 1rem 0', fontSize: '1.2rem' }}>USER B</h4>
                  <div>Selects Seat D6</div><div style={{ color: theme.textSecondary, margin:'0.5rem 0' }}>↓</div>
                  <div>Transaction Begins</div><div style={{ color: theme.textSecondary, margin:'0.5rem 0' }}>↓</div>
                  <div style={{ fontWeight: 600 }}>FOR UPDATE executes</div><div style={{ color: theme.textSecondary, margin:'0.5rem 0' }}>↓</div>
                  <div style={{ background: `#eee`, padding: '0.75rem', borderRadius:'8px', fontWeight: 600 }}>WAITS FOR LOCK</div><div style={{ color: theme.textSecondary, margin:'0.5rem 0' }}>↓</div>
                  <div>Lock released by User A</div><div style={{ color: theme.textSecondary, margin:'0.5rem 0' }}>↓</div>
                  <div style={{ fontWeight: 700, color: theme.burgundy, fontSize: '1.1rem' }}>SEAT UNAVAILABLE</div>
               </div>
            </div>
            <ProfessorNote text="The 'FOR UPDATE' clause is crucial. When User A runs this SELECT, the InnoDB engine places an exclusive write-lock on that specific seat row. When User B's backend hits the exact same SELECT query a millisecond later, MySQL forces User B's thread to pause and wait until User A is completely finished." />
          </SlideSection>

          <SlideSection id="sec-17" num="17" title="UNIQUE CONSTRAINT" isPresenting={isPresenting} isActive={activeSection === 'sec-17'}>
             <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              While Row-Level Locking handles concurrent requests actively happening at the exact same time, we need a permanent, database-level defense to guarantee a seat is never double-booked.
            </p>
            <CodeBlock language="SQL" code={`CREATE TABLE BOOKING_SEAT (
    ...
    UNIQUE (ShowID, SeatID)
);`} />
            <div style={{ background: theme.surface, padding: '3rem', borderRadius: '12px', border: `1px solid ${theme.border}`, marginTop: '2rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem' }}>
                 <div style={{ fontWeight: 600, width: '180px' }}>SHOW 101 + SEAT A5</div>
                 <div style={{ color: theme.charcoal }}>First Booking</div>
                 <div style={{ color: '#2E7D32', fontWeight: 700, marginLeft: 'auto' }}>ALLOWED</div>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', background: `${theme.burgundy}10`, padding: '1rem', borderRadius: '8px', margin: '0 -1rem 1.5rem -1rem' }}>
                 <div style={{ fontWeight: 600, width: '180px' }}>SHOW 101 + SEAT A5</div>
                 <div style={{ color: theme.charcoal }}>Second Booking</div>
                 <div style={{ color: theme.burgundy, fontWeight: 700, marginLeft: 'auto' }}>REJECTED (ER_DUP_ENTRY)</div>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                 <div style={{ fontWeight: 600, width: '180px' }}>SHOW 102 + SEAT A5</div>
                 <div style={{ color: theme.charcoal }}>Different Show</div>
                 <div style={{ color: '#2E7D32', fontWeight: 700, marginLeft: 'auto' }}>ALLOWED</div>
               </div>
            </div>
            <ProfessorNote text="We use a Composite Unique Constraint. We can't just make SeatID unique, because Seat A5 will be booked hundreds of times over the year for different shows. By making the COMBINATION of ShowID and SeatID unique, the database will throw a fatal error if anyone ever tries to map the same seat to the same show twice." />
          </SlideSection>

          <SlideSection id="sec-18" num="18" title="ACID PROPERTIES" isPresenting={isPresenting} isActive={activeSection === 'sec-18'}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {[
                { l: 'A', name: 'ATOMICITY', def: 'All or nothing execution.', desc: 'A booking and its seat assignments succeed together or fail together. If the BOOKING_SEAT insert fails, the BOOKING insert rolls back.' },
                { l: 'C', name: 'CONSISTENCY', def: 'Data must follow rules.', desc: 'Foreign Keys prevent booking a non-existent show. The CHECK constraint prevents negative prices. UNIQUE prevents duplicate seats.' },
                { l: 'I', name: 'ISOLATION', def: 'Concurrent processes don\'t interfere.', desc: 'Row-level locking (FOR UPDATE) ensures concurrent bookings for the same show do not interfere with each other or read dirty data.' },
                { l: 'D', name: 'DURABILITY', def: 'Data survives crashes.', desc: 'Once connection.commit() succeeds, the booking is permanently saved to the Aiven MySQL SSDs, surviving any server crashes.' },
              ].map(p => (
                <div key={p.l} style={{ background: theme.surface, padding: '2.5rem', border: `1px solid ${theme.border}`, borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  <div style={{ fontSize: '3.5rem', color: `${theme.gold}30`, fontWeight: 800, marginBottom: '-1.5rem', fontFamily: 'serif' }}>{p.l}</div>
                  <h4 style={{ fontSize: '1.3rem', color: theme.charcoal, margin: '0 0 0.5rem 0' }}>{p.name}</h4>
                  <div style={{ color: theme.gold, fontSize: '0.85rem', fontWeight: 600, marginBottom: '1rem', letterSpacing: '0.05em' }}>{p.def.toUpperCase()}</div>
                  <p style={{ color: theme.textSecondary, lineHeight: 1.6, margin: 0, fontSize: '1.05rem' }}>{p.desc}</p>
                </div>
              ))}
            </div>
            <ProfessorNote text="ACID properties aren't just theory here; they are actively implemented in our project. Atomicity is our Rollback logic, Consistency is our Schema constraints, Isolation is our FOR UPDATE lock, and Durability is our cloud database." />
          </SlideSection>

          <SlideSection id="sec-19" num="19" title="INDEXING" isPresenting={isPresenting} isActive={activeSection === 'sec-19'}>
            <CodeBlock language="SQL" code={`CREATE INDEX idx_show_movie ON \`SHOW\`(MovieID);
CREATE INDEX idx_show_screen ON \`SHOW\`(ScreenID);
CREATE INDEX idx_show_date ON \`SHOW\`(ShowDate);
CREATE INDEX idx_booking_customer ON BOOKING(CustomerID);
CREATE INDEX idx_booking_show ON BOOKING(ShowID);
CREATE INDEX idx_booking_seat_show_seat ON BOOKING_SEAT(ShowID, SeatID);`} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '3rem' }}>
               <div style={{ background: theme.surface, padding: '2.5rem', border: `1px solid ${theme.border}`, borderRadius: '12px' }}>
                  <h4 style={{ color: theme.burgundy, marginBottom: '1rem', fontSize: '1.2rem' }}>WITHOUT INDEX</h4>
                  <p style={{ color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>MySQL must perform a <strong>Full Table Scan</strong>, checking every single row in the SHOW table sequentially to find which shows belong to MovieID 5.</p>
               </div>
               <div style={{ background: theme.surface, padding: '2.5rem', border: `1px solid ${theme.gold}`, borderRadius: '12px' }}>
                  <h4 style={{ color: theme.gold, marginBottom: '1rem', fontSize: '1.2rem' }}>WITH INDEX</h4>
                  <p style={{ color: theme.charcoal, lineHeight: 1.6, margin: 0 }}>MySQL uses a <strong>B-Tree structure</strong> to instantly locate all shows for MovieID 5, reducing query search time from O(N) to O(log N).</p>
               </div>
            </div>
            <ProfessorNote text="We explicitly created indexes on Foreign Keys because relational databases frequently use these columns in JOIN and WHERE clauses. When a user clicks a movie, we query 'WHERE MovieID = ?'. The index speeds this up immensely." />
          </SlideSection>

          <SlideSection id="sec-20" num="20" title="BACKEND INTEGRATION" isPresenting={isPresenting} isActive={activeSection === 'sec-20'}>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              The Express backend manages a Connection Pool to communicate with MySQL efficiently.
            </p>
            <CodeBlock language="JAVASCRIPT" code={`// backend/src/config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,         
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,          
    connectionLimit: 10,               
    queueLimit: 0,
    ssl: { rejectUnauthorized: false } 
});`} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0', marginTop: '3rem', borderLeft: `2px solid ${theme.gold}`, paddingLeft: '2rem' }}>
               <div style={{ marginBottom: '1.5rem' }}><strong style={{ color: theme.charcoal }}>REACT</strong> <span style={{ color: theme.textSecondary }}>→ HTTP POST</span></div>
               <div style={{ marginBottom: '1.5rem' }}><strong style={{ color: theme.charcoal }}>EXPRESS</strong> <span style={{ color: theme.textSecondary }}>→ router.post()</span></div>
               <div style={{ marginBottom: '1.5rem' }}><strong style={{ color: theme.charcoal }}>CONTROLLER</strong> <span style={{ color: theme.textSecondary }}>→ Extracts JSON body</span></div>
               <div style={{ marginBottom: '1.5rem' }}><strong style={{ color: theme.charcoal }}>MYSQL2</strong> <span style={{ color: theme.textSecondary }}>→ pool.query()</span></div>
               <div style={{ marginBottom: '0' }}><strong style={{ color: theme.charcoal }}>MYSQL</strong> <span style={{ color: theme.textSecondary }}>→ Executes SQL</span></div>
            </div>
            <ProfessorNote text="The connection pool ensures we don't overwhelm the database with too many simultaneous connections. We limit it to 10 connections, and if 11 users book at the same time, the 11th waits in the queue." />
          </SlideSection>

          <SlideSection id="sec-22" num="22" title="COMPLETE SQL APPENDIX" isPresenting={isPresenting} isActive={activeSection === 'sec-22'}>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7 }}>
              The complete, unmodified DDL script used to generate the entire database schema from scratch.
            </p>
            <CodeBlock language="SQL" code={FullSQLAppendix} />
            <ProfessorNote text="This appendix contains the entirety of our backend schema creation script, proving that we did not use an ORM to auto-generate tables, but rather handcrafted the entire database structure using raw SQL." />
          </SlideSection>

          <SlideSection id="sec-23" num="23" title="PROFESSOR QUESTIONS" isPresenting={isPresenting} isActive={activeSection === 'sec-23'}>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '3rem' }}>
              Anticipated technical questions regarding the CineTicket database architecture and implementation.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {QUESTIONS.map((q, i) => (
                <details key={i} style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '1.5rem', cursor: 'pointer' }}>
                  <summary style={{ fontWeight: 600, color: theme.charcoal, fontSize: '1.1rem', outline: 'none' }}>{q.q}</summary>
                  <div style={{ marginTop: '1rem', color: theme.textSecondary, lineHeight: 1.6, paddingTop: '1rem', borderTop: `1px solid ${theme.border}` }}>{q.a}</div>
                </details>
              ))}
            </div>
            <ProfessorNote text="This is my cheat sheet. If you ask me why I used a specific data type or how a specific lock works, the precise answer based on our source code is listed right here." />
          </SlideSection>

        </div>
      </div>
    </div>
  );
};

export default DatabaseSchema;
