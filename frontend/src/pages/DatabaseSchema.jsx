import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { theme, TOC, TABLES, CRUD } from '../data/schemaPresentationData';
import { Play, Square, ChevronRight, ChevronLeft, MessageCircle } from 'lucide-react';

const ProfessorNote = ({ text }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div style={{ marginTop: '1.5rem', background: '#FDFBF7', borderLeft: \`4px solid \${theme.burgundy}\`, borderRadius: '0 8px 8px 0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', padding: '1rem 1.5rem', background: 'transparent', border: 'none', cursor: 'pointer', color: theme.charcoal, fontWeight: 600, fontSize: '0.9rem', textAlign: 'left' }}
      >
        <MessageCircle size={18} color={theme.burgundy} />
        WHAT TO SAY TO THE PROFESSOR
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ padding: '0 1.5rem 1.5rem 3rem', color: theme.textSecondary, fontSize: '0.95rem', lineHeight: 1.6, fontStyle: 'italic' }}>
            "{text}"
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CodeBlock = ({ language, code }) => (
  <div style={{ background: theme.codeBg, borderRadius: '12px', border: \`1px solid \${theme.gold}40\`, overflow: 'hidden', margin: '1.5rem 0', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem 1.5rem', fontSize: '0.75rem', color: theme.lightGold, letterSpacing: '0.1em', fontWeight: 600, borderBottom: \`1px solid \${theme.gold}20\` }}>
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
      viewport={{ once: true, margin: "-20%" }}
      transition={{ duration: 0.6 }}
      style={{ 
        minHeight: isPresenting ? '100vh' : 'auto',
        padding: isPresenting ? '6rem 4rem' : '4rem 0 6rem 0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: isPresenting ? 'center' : 'flex-start',
        borderBottom: isPresenting ? 'none' : \`1px solid \${theme.border}\`
      }}
    >
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ color: theme.gold, fontSize: '2rem', fontWeight: 700, fontFamily: 'serif', marginBottom: '0.5rem' }}>{num}</div>
        <h2 className="font-serif" style={{ fontSize: isPresenting ? '3.5rem' : '2.5rem', color: theme.charcoal, margin: 0, lineHeight: 1.1 }}>
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

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', color: theme.charcoal, fontFamily: 'sans-serif', transition: 'all 0.5s ease' }}>
      
      {/* Presentation Toggle */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 1000, display: 'flex', gap: '1rem' }}>
        {isPresenting && (
          <>
            <button onClick={handlePrev} style={{ background: theme.surface, border: \`1px solid \${theme.border}\`, padding: '1rem', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}><ChevronLeft color={theme.charcoal} /></button>
            <button onClick={handleNext} style={{ background: theme.surface, border: \`1px solid \${theme.border}\`, padding: '1rem', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}><ChevronRight color={theme.charcoal} /></button>
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
        <div style={{ paddingTop: '10rem', paddingBottom: '6rem', borderBottom: \`1px solid \${theme.border}\` }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 4rem' }}>
            <div style={{ color: theme.gold, fontWeight: 600, letterSpacing: '0.1em', fontSize: '0.85rem', marginBottom: '1rem' }}>DATABASE SYSTEM</div>
            <h1 className="font-serif" style={{ fontSize: '4.5rem', fontWeight: 400, color: theme.charcoal, lineHeight: 1.1, marginBottom: '2rem' }}>
              DATABASE ARCHITECTURE<br />& IMPLEMENTATION
            </h1>
            <p style={{ fontSize: '1.5rem', color: theme.textSecondary, maxWidth: '800px', fontStyle: 'italic', marginBottom: '4rem' }}>
              "How CineTicket transforms its cinema booking model into a relational MySQL backend."
            </p>
            
            <div style={{ display: 'flex', gap: '4rem', borderTop: \`1px solid \${theme.border}\`, paddingTop: '2rem' }}>
              {[{l: 'DATABASE', v: 'MySQL'}, {l: 'BACKEND', v: 'Node.js / Express'}, {l: 'DRIVER', v: 'mysql2/promise'}, {l: 'MODEL', v: 'Relational Database'}].map(m => (
                <div key={m.l}>
                  <div style={{ fontSize: '0.75rem', color: theme.textSecondary, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{m.l}</div>
                  <div style={{ fontWeight: 600, color: theme.charcoal }}>{m.v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', maxWidth: isPresenting ? '1600px' : '1400px', margin: '0 auto', padding: isPresenting ? '0' : '4rem', gap: '4rem' }}>
        
        {/* Sticky TOC */}
        {!isPresenting && (
          <div style={{ width: '250px', flexShrink: 0 }}>
            <div style={{ position: 'sticky', top: '8rem', maxHeight: 'calc(100vh - 10rem)', overflowY: 'auto' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', color: theme.textSecondary, marginBottom: '1.5rem' }}>CONTENTS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {TOC.map(item => (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    style={{
                      textAlign: 'left', background: 'none', border: 'none', fontSize: '0.8rem', cursor: 'pointer', padding: '0.4rem 0', paddingLeft: '1rem', marginLeft: '-1rem',
                      color: activeSection === item.id ? theme.charcoal : theme.textSecondary,
                      fontWeight: activeSection === item.id ? 700 : 400,
                      borderLeft: activeSection === item.id ? \`2px solid \${theme.gold}\` : '2px solid transparent',
                      transition: 'all 0.2s'
                    }}
                  >
                    {item.num} {item.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div ref={containerRef} style={{ flexGrow: 1, maxWidth: isPresenting ? '100%' : '900px', transition: 'max-width 0.5s' }}>
          
          <SlideSection id="sec-01" num="01" title="DATABASE ARCHITECTURE" isPresenting={isPresenting} isActive={activeSection === 'sec-01'}>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '3rem' }}>
              The architecture follows a strict decoupled flow. The React frontend never speaks to the database directly; instead, it relies on an Express backend that utilizes connection pooling to execute parameterized SQL queries safely.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: theme.surface, padding: '4rem', borderRadius: '16px', border: \`1px solid \${theme.border}\` }}>
              {['USER', 'REACT FRONTEND', 'NODE.JS / EXPRESS', 'MYSQL2 CONNECTION POOL', 'SQL QUERIES', 'MYSQL DATABASE', 'RELATIONAL TABLES'].map((node, i) => (
                <React.Fragment key={node}>
                  <div style={{ background: theme.surface, border: \`1px solid \${theme.gold}50\`, padding: '1rem 3rem', borderRadius: '8px', fontWeight: 600, letterSpacing: '0.05em', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>{node}</div>
                  {i < 6 && <div style={{ height: '20px', width: '2px', background: theme.gold }}></div>}
                </React.Fragment>
              ))}
            </div>
            <ProfessorNote text="Our architecture separates concerns. The React frontend handles UI, the Node backend handles business logic and transaction locks, and MySQL strictly handles data persistence and constraint enforcement via the mysql2 connection pool." />
          </SlideSection>

          <SlideSection id="sec-02" num="02" title="ER MODEL" isPresenting={isPresenting} isActive={activeSection === 'sec-02'}>
            <div style={{ background: theme.surface, padding: '2rem', border: \`1px solid \${theme.gold}\`, borderRadius: '4px', marginBottom: '3rem', textAlign: 'center', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <span style={{ color: theme.textSecondary }}>[ CINETICKET ER DIAGRAM IMAGE ]</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
              {['THEATRE', 'SCREEN', 'SEAT', 'MOVIE', 'SHOW', 'CUSTOMER', 'BOOKING', 'PAYMENT'].map(e => (
                <div key={e} style={{ background: theme.surface, border: \`1px solid \${theme.border}\`, padding: '1.5rem', borderRadius: '8px', textAlign: 'center', fontWeight: 600 }}>{e}</div>
              ))}
            </div>
            <ProfessorNote text="The ER diagram represents the conceptual model of our cinema booking system. We converted each entity into a relational table and implemented relationships using foreign keys." />
          </SlideSection>

          <SlideSection id="sec-03" num="03" title="DATABASE CREATION" isPresenting={isPresenting} isActive={activeSection === 'sec-03'}>
            <CodeBlock language="SQL" code={\`CREATE DATABASE IF NOT EXISTS movie_ticket_booking;\\nUSE movie_ticket_booking;\`} />
            <div style={{ display: 'grid', gap: '1rem', marginTop: '2rem' }}>
              {[{t:'CREATE DATABASE', d:'Creates the database schema.'},{t:'IF NOT EXISTS', d:'Prevents execution errors if already exists.'},{t:'USE', d:'Selects the database for subsequent commands.'}].map(x=>(
                <div key={x.t} style={{ display: 'grid', gridTemplateColumns: '200px 1fr', background: theme.surface, padding: '1.5rem', border: \`1px solid \${theme.border}\`, borderRadius: '8px' }}>
                  <strong style={{ color: theme.charcoal }}>{x.t}</strong><span style={{ color: theme.textSecondary }}>{x.d}</span>
                </div>
              ))}
            </div>
            <ProfessorNote text="I first create the MySQL database and then select it as the active database. I included 'IF NOT EXISTS' so our Node.js migration script doesn't crash on subsequent runs." />
          </SlideSection>

          <SlideSection id="sec-04" num="04" title="TABLE DEFINITIONS" isPresenting={isPresenting} isActive={activeSection === 'sec-04'}>
             <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '3rem' }}>
              Below is the exact SQL implementation for all 9 tables in our database, mapped directly from the ER diagram.
            </p>
            {TABLES.map((table, i) => (
              <div key={table.name} style={{ marginBottom: '4rem', paddingBottom: '4rem', borderBottom: i < TABLES.length - 1 ? \`1px solid \${theme.border}\` : 'none' }}>
                <h3 style={{ fontSize: '1.5rem', color: theme.charcoal, marginBottom: '0.5rem' }}>{table.name}</h3>
                <p style={{ color: theme.textSecondary, marginBottom: '1.5rem' }}>{table.purpose}</p>
                <CodeBlock language="SQL" code={table.sql} />
                <div style={{ background: theme.surface, border: \`1px solid \${theme.border}\`, borderRadius: '8px', padding: '1.5rem', marginTop: '2rem' }}>
                  <div style={{ marginBottom: '1rem' }}><strong style={{ color: theme.gold }}>PRIMARY KEY:</strong> {table.pk}</div>
                  <div style={{ marginBottom: '1rem' }}><strong style={{ color: theme.burgundy }}>FOREIGN KEYS:</strong> {table.fk}</div>
                  <div style={{ marginBottom: '1rem' }}><strong style={{ color: theme.charcoal }}>CONSTRAINTS:</strong> {table.constraints}</div>
                </div>
                <ProfessorNote text={table.professorNote} />
              </div>
            ))}
          </SlideSection>

          <SlideSection id="sec-05" num="05" title="PRIMARY KEYS" isPresenting={isPresenting} isActive={activeSection === 'sec-05'}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
              {TABLES.map(t => (
                <div key={t.name} style={{ background: theme.surface, padding: '1.5rem', border: \`1px solid \${theme.border}\`, borderRadius: '8px', textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, color: theme.charcoal, marginBottom: '0.5rem' }}>{t.name}</div>
                  <div style={{ color: theme.gold, fontSize: '0.9rem', fontWeight: 600 }}>PK → {t.pk.replace('Composite: ', '')}</div>
                </div>
              ))}
            </div>
            <ProfessorNote text="Every single table in our database has a Primary Key to uniquely identify records. Most use a simple AUTO_INCREMENT integer ID for efficiency. However, BOOKING_SEAT uses a composite primary key consisting of both BookingID and SeatID to ensure a specific booking doesn't reserve the exact same seat twice." />
          </SlideSection>

          <SlideSection id="sec-06" num="06" title="FOREIGN KEYS" isPresenting={isPresenting} isActive={activeSection === 'sec-06'}>
             <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '3rem' }}>
                {['THEATRE → SCREEN', 'SCREEN → SEAT', 'MOVIE → SHOW', 'CUSTOMER → BOOKING'].map(rel => (
                  <div key={rel} style={{ background: theme.surface, padding: '1.5rem', border: \`1px solid \${theme.gold}\`, borderRadius: '8px', textAlign: 'center', fontWeight: 600, color: theme.charcoal }}>
                    {rel.split(' → ')[0]}<div style={{ color: theme.burgundy, margin: '0.5rem 0' }}>↓</div>{rel.split(' → ')[1]}
                  </div>
                ))}
             </div>
             <CodeBlock language="SQL" code={\`FOREIGN KEY (TheatreID) REFERENCES THEATRE(TheatreID) ON DELETE CASCADE\`} />
             <ProfessorNote text="We use Foreign Keys to maintain referential integrity. We specifically appended 'ON DELETE CASCADE' to all of them. This means if an admin deletes a Theatre, the database automatically deletes all Screens and Seats associated with it, preventing orphaned rows." />
          </SlideSection>

          <SlideSection id="sec-07" num="07" title="MANY-TO-MANY" isPresenting={isPresenting} isActive={activeSection === 'sec-07'}>
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginBottom: '3rem' }}>
                <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>BOOKING</div>
                <div style={{ color: theme.burgundy, fontSize: '2rem' }}>→</div>
                <div style={{ background: theme.gold, color: '#fff', padding: '1rem 2rem', borderRadius: '30px', fontWeight: 700 }}>BOOKING_SEAT</div>
                <div style={{ color: theme.burgundy, fontSize: '2rem' }}>←</div>
                <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>SEAT</div>
             </div>
             <CodeBlock language="SQL" code={\`CREATE TABLE IF NOT EXISTS BOOKING_SEAT (
    BookingID INT NOT NULL,
    ShowID INT NOT NULL,
    SeatID INT NOT NULL,
    PRIMARY KEY (BookingID, SeatID),
    UNIQUE (ShowID, SeatID) -- Double booking protection
);\`} />
             <ProfessorNote text="A booking can have many seats, and a physical seat can belong to many bookings over time. To resolve this Many-to-Many relationship, we introduced the BOOKING_SEAT junction table. The UNIQUE constraint here is the most critical part of our system—it guarantees one seat can only be booked for one show once." />
          </SlideSection>

          <SlideSection id="sec-08" num="08" title="DATABASE CONSTRAINTS" isPresenting={isPresenting} isActive={activeSection === 'sec-08'}>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {[
                {c: 'NOT NULL', sql: 'Name VARCHAR(100) NOT NULL', why: 'Ensures required data like Theatre Names are never empty.'},
                {c: 'UNIQUE', sql: 'Email VARCHAR(100) NOT NULL UNIQUE', why: 'Prevents duplicate user accounts and duplicate seat bookings.'},
                {c: 'CHECK', sql: 'Price DECIMAL(10, 2) CHECK (Price >= 0)', why: 'Enforces business logic at the schema level (no negative prices).'},
                {c: 'DEFAULT', sql: 'BookingDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP', why: 'Lets the database handle time natively without relying on Node.js.'}
              ].map(con => (
                 <div key={con.c} style={{ background: theme.surface, padding: '2rem', border: \`1px solid \${theme.border}\`, borderRadius: '12px' }}>
                    <h4 style={{ color: theme.gold, margin: '0 0 1rem 0' }}>{con.c}</h4>
                    <p style={{ color: theme.charcoal, margin: '0 0 1rem 0' }}>{con.why}</p>
                    <code style={{ background: theme.bg, padding: '0.5rem', borderRadius: '4px', fontSize: '0.9rem', color: theme.burgundy }}>{con.sql}</code>
                 </div>
              ))}
            </div>
            <ProfessorNote text="Constraints act as our first line of defense. Even if the Node.js backend has a bug and tries to insert a negative price or a duplicate email, the MySQL database constraints will block the insertion and preserve data integrity." />
          </SlideSection>

          <SlideSection id="sec-09" num="09" title="CRUD OPERATIONS" isPresenting={isPresenting} isActive={activeSection === 'sec-09'}>
             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {CRUD.map(c => (
                  <div key={c.title} style={{ background: theme.surface, border: \`1px solid \${theme.border}\`, borderRadius: '12px', padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <h4 style={{ color: theme.charcoal, margin: '0 0 0.5rem 0' }}>{c.title}</h4>
                    <div style={{ color: theme.gold, fontSize: '0.8rem', fontWeight: 600, marginBottom: '1rem' }}>{c.endpoint}</div>
                    <p style={{ color: theme.textSecondary, fontSize: '0.95rem', margin: '0 0 1rem 0' }}>{c.purpose}</p>
                    <div style={{ marginTop: 'auto', background: theme.codeBg, padding: '1rem', borderRadius: '8px', color: '#e6e6e6', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                      {c.sql}
                    </div>
                  </div>
                ))}
             </div>
             <ProfessorNote text="These are the exact queries executed by our Express controllers. Notice we use standard SQL syntax. We explicitly avoided using an ORM so we could maintain direct control over the SQL execution and learn the raw syntax." />
          </SlideSection>

          <SlideSection id="sec-10" num="10" title="SQL JOINS" isPresenting={isPresenting} isActive={activeSection === 'sec-10'}>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '3rem' }}>
              To display a complete digital ticket receipt, the backend must retrieve data spread across 6 different normalized tables.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '3rem', flexWrap: 'wrap' }}>
              {['BOOKING', 'CUSTOMER', 'SHOW', 'MOVIE', 'SCREEN', 'THEATRE'].map((t, i) => (
                <React.Fragment key={t}>
                  <div style={{ background: theme.surface, padding: '1rem 2rem', borderRadius: '30px', border: \`1px solid \${theme.gold}\`, fontWeight: 600 }}>{t}</div>
                  {i < 5 && <div style={{ color: theme.burgundy }}>→</div>}
                </React.Fragment>
              ))}
            </div>
            <CodeBlock language="SQL" code={\`SELECT b.BookingID, b.BookingDate, b.TotalAmount, b.Status, c.Name as CustomerName,
       s.ShowDate, s.ShowTime, m.Title as MovieTitle, t.Name as TheatreName, sc.ScreenNumber
FROM BOOKING b
JOIN CUSTOMER c ON b.CustomerID = c.CustomerID
JOIN \`SHOW\` s ON b.ShowID = s.ShowID
JOIN MOVIE m ON s.MovieID = m.MovieID
JOIN SCREEN sc ON s.ScreenID = sc.ScreenID
JOIN THEATRE t ON sc.TheatreID = t.TheatreID
WHERE b.BookingID = ?\`} />
            <ProfessorNote text="Because our database is highly normalized (3NF), a booking record only stores integer IDs. To show the user the Movie Title and Theatre Name on their receipt, we execute this massive 6-table INNER JOIN." />
          </SlideSection>

          <SlideSection id="sec-11" num="11" title="SEAT AVAILABILITY" isPresenting={isPresenting} isActive={activeSection === 'sec-11'}>
            <CodeBlock language="SQL" code={\`CREATE OR REPLACE VIEW view_show_seats AS
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
LEFT JOIN BOOKING b ON bs.BookingID = b.BookingID;\`} />
            <ProfessorNote text="Notice the LEFT JOIN on BOOKING_SEAT. An INNER JOIN would only return seats that have been booked. By using a LEFT JOIN, we get all physical seats, and the CASE statement checks if 'bs.SeatID IS NULL' to mark it as AVAILABLE." />
          </SlideSection>

          <SlideSection id="sec-12" num="12" title="BOOKING WORKFLOW" isPresenting={isPresenting} isActive={activeSection === 'sec-12'}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: theme.surface, padding: '3rem', borderRadius: '16px', border: \`1px solid \${theme.border}\` }}>
                {['USER SELECTS SEATS', 'REACT REQUEST', 'EXPRESS BACKEND', 'MYSQL START TRANSACTION', 'ROW LOCK (FOR UPDATE)', 'INSERT BOOKING', 'INSERT BOOKING_SEAT', 'MYSQL COMMIT', 'REACT SUCCESS SCREEN'].map((step, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: theme.gold, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>{i+1}</div>
                    <div style={{ fontWeight: 600, color: theme.charcoal }}>{step}</div>
                  </div>
                ))}
             </div>
             <ProfessorNote text="This is the complete end-to-end lifecycle of a ticket booking. It traverses the presentation tier, the application tier, and the data tier." />
          </SlideSection>

          <SlideSection id="sec-13" num="13" title="TRANSACTIONS" isPresenting={isPresenting} isActive={activeSection === 'sec-13'}>
            <CodeBlock language="JAVASCRIPT" code={\`// backend/src/services/bookingService.js
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
    // 5. If ANY error occurs (e.g. duplicate seat), erase everything
    await connection.rollback();
    throw error;
} finally {
    connection.release();
}\`} />
            <ProfessorNote text="We use the mysql2 promise wrapper in Node.js to manually begin a transaction. If the booking insert succeeds but the booking_seat insert fails due to a unique constraint violation, the catch block triggers a ROLLBACK, completely erasing the partial booking." />
          </SlideSection>

          <SlideSection id="sec-14" num="14" title="CONCURRENCY CONTROL" isPresenting={isPresenting} isActive={activeSection === 'sec-14'}>
             <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '2rem' }}>
              To prevent double booking when two users click "Confirm" on the exact same seat at the exact same millisecond, we use <strong>Pessimistic Row-Level Locking</strong>.
            </p>
            <CodeBlock language="SQL" code={\`-- Executed inside the transaction:
SELECT SeatID, SeatType 
FROM SEAT 
WHERE SeatID IN (?, ?) AND ScreenID = ? 
FOR UPDATE;\`} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '3rem' }}>
               <div style={{ background: theme.surface, padding: '2rem', border: \`1px solid \${theme.gold}\`, borderRadius: '12px', textAlign: 'center' }}>
                  <h4 style={{ color: theme.gold, margin: '0 0 1rem 0' }}>USER A</h4>
                  <div>Selects Seat D6</div><div style={{ color: theme.burgundy }}>↓</div>
                  <div>Transaction Begins</div><div style={{ color: theme.burgundy }}>↓</div>
                  <div style={{ fontWeight: 600 }}>FOR UPDATE executes</div><div style={{ color: theme.burgundy }}>↓</div>
                  <div style={{ background: \`\${theme.gold}20\`, padding: '0.5rem' }}>ROW IS LOCKED</div><div style={{ color: theme.burgundy }}>↓</div>
                  <div>Booking Inserted</div><div style={{ color: theme.burgundy }}>↓</div>
                  <div style={{ fontWeight: 600 }}>COMMIT</div>
               </div>
               <div style={{ background: theme.surface, padding: '2rem', border: \`1px dashed \${theme.textSecondary}\`, borderRadius: '12px', textAlign: 'center' }}>
                  <h4 style={{ color: theme.charcoal, margin: '0 0 1rem 0' }}>USER B</h4>
                  <div>Selects Seat D6</div><div style={{ color: theme.textSecondary }}>↓</div>
                  <div>Transaction Begins</div><div style={{ color: theme.textSecondary }}>↓</div>
                  <div style={{ fontWeight: 600 }}>FOR UPDATE executes</div><div style={{ color: theme.textSecondary }}>↓</div>
                  <div style={{ background: \`#eee\`, padding: '0.5rem' }}>WAITS FOR LOCK</div><div style={{ color: theme.textSecondary }}>↓</div>
                  <div>Lock released by User A</div><div style={{ color: theme.textSecondary }}>↓</div>
                  <div style={{ fontWeight: 600, color: theme.burgundy }}>SEAT NOW UNAVAILABLE</div>
               </div>
            </div>
            <ProfessorNote text="The 'FOR UPDATE' clause is the secret to our concurrency control. When User A runs this SELECT, MySQL places an exclusive lock on those specific seat rows. When User B's transaction hits the exact same SELECT query a millisecond later, MySQL forces User B's thread to pause and wait until User A commits or rolls back." />
          </SlideSection>

          <SlideSection id="sec-15" num="15" title="ACID PROPERTIES" isPresenting={isPresenting} isActive={activeSection === 'sec-15'}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              {[
                { l: 'A', name: 'ATOMICITY', desc: 'A booking and its seat assignments succeed together or fail together. If the BOOKING_SEAT insert fails, the BOOKING insert rolls back.' },
                { l: 'C', name: 'CONSISTENCY', desc: 'Foreign Keys prevent booking a non-existent show. The CHECK constraint prevents negative prices. UNIQUE prevents duplicate seats.' },
                { l: 'I', name: 'ISOLATION', desc: 'Row-level locking (FOR UPDATE) ensures concurrent bookings for the same show do not interfere with each other or read dirty data.' },
                { l: 'D', name: 'DURABILITY', desc: 'Once connection.commit() succeeds, the booking is permanently saved to the Aiven MySQL SSDs, surviving any server crashes.' },
              ].map(p => (
                <div key={p.l} style={{ background: theme.surface, padding: '2rem', border: \`1px solid \${theme.border}\`, borderRadius: '12px' }}>
                  <div style={{ fontSize: '3rem', color: \`\${theme.gold}40\`, fontWeight: 800, marginBottom: '-1.5rem' }}>{p.l}</div>
                  <h4 style={{ fontSize: '1.2rem', color: theme.charcoal, margin: '0 0 1rem 0' }}>{p.name}</h4>
                  <p style={{ color: theme.textSecondary, lineHeight: 1.6, margin: 0 }}>{p.desc}</p>
                </div>
              ))}
            </div>
            <ProfessorNote text="ACID properties aren't just theory here; they are actively implemented. Atomicity is our Rollback logic, Consistency is our Schema constraints, Isolation is our FOR UPDATE lock, and Durability is our cloud database." />
          </SlideSection>

          <SlideSection id="sec-16" num="16" title="INDEXING" isPresenting={isPresenting} isActive={activeSection === 'sec-16'}>
            <CodeBlock language="SQL" code={\`CREATE INDEX idx_show_movie ON \`SHOW\`(MovieID);
CREATE INDEX idx_show_screen ON \`SHOW\`(ScreenID);
CREATE INDEX idx_booking_customer ON BOOKING(CustomerID);
CREATE INDEX idx_booking_show ON BOOKING(ShowID);\`} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
               <div style={{ background: theme.surface, padding: '2rem', border: \`1px solid \${theme.border}\`, borderRadius: '12px' }}>
                  <h4 style={{ color: theme.burgundy }}>WITHOUT INDEX</h4>
                  <p style={{ color: theme.textSecondary }}>MySQL must perform a <strong>Full Table Scan</strong>, checking every single row in the SHOW table to find which shows belong to MovieID 5.</p>
               </div>
               <div style={{ background: theme.surface, padding: '2rem', border: \`1px solid \${theme.gold}\`, borderRadius: '12px' }}>
                  <h4 style={{ color: theme.gold }}>WITH INDEX</h4>
                  <p style={{ color: theme.charcoal }}>MySQL uses a B-Tree structure to instantly locate all shows for MovieID 5, reducing query time from O(N) to O(log N).</p>
               </div>
            </div>
            <ProfessorNote text="We explicitly created indexes on Foreign Keys because relational databases frequently use these columns in JOIN and WHERE clauses. This significantly speeds up our API response times." />
          </SlideSection>

          <SlideSection id="sec-17" num="17" title="NODE.JS ↔ MYSQL" isPresenting={isPresenting} isActive={activeSection === 'sec-17'}>
            <CodeBlock language="JAVASCRIPT" code={\`// backend/src/config/db.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,         // Aiven cloud URL
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,          // Queue requests if limit reached
    connectionLimit: 10,               // Max 10 concurrent connections
    queueLimit: 0,
    ssl: { rejectUnauthorized: false } // Required for cloud databases
});

module.exports = pool;\`} />
            <ProfessorNote text="The connection pool ensures we don't overwhelm the database with too many simultaneous connections. We limit it to 10 connections, and if 11 users book at the same time, the 11th waits in the queue." />
          </SlideSection>

          <SlideSection id="sec-18" num="18" title="API → DATABASE FLOW" isPresenting={isPresenting} isActive={activeSection === 'sec-18'}>
            <div style={{ background: theme.surface, padding: '3rem', borderRadius: '16px', border: \`1px solid \${theme.border}\` }}>
              {[
                { t: 'FRONTEND', d: 'User clicks Confirm. React sends POST /api/bookings' },
                { t: 'EXPRESS ROUTE', d: 'router.post("/", bookingController.createBooking)' },
                { t: 'CONTROLLER', d: 'Extracts showId and seatIds from req.body' },
                { t: 'SERVICE', d: 'bookingService.createBookingTransaction executes' },
                { t: 'MYSQL QUERIES', d: 'START TRANSACTION -> Locks -> Inserts -> COMMIT' },
                { t: 'RESPONSE', d: 'res.status(201).json({ message: "Success" })' }
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: '2rem', marginBottom: i === 5 ? 0 : '1.5rem' }}>
                  <div style={{ width: '150px', textAlign: 'right', fontWeight: 600, color: theme.gold }}>{s.t}</div>
                  <div style={{ flexGrow: 1, color: theme.charcoal }}>{s.d}</div>
                </div>
              ))}
            </div>
            <ProfessorNote text="This shows our exact code execution path. The route receives the HTTP request, passes it to the controller for validation, which calls the service layer where the actual MySQL queries and transactions live." />
          </SlideSection>

          <SlideSection id="sec-19" num="19" title="COMPLETE BOOKING CASE STUDY" isPresenting={isPresenting} isActive={activeSection === 'sec-19'}>
            <div style={{ background: theme.surface, padding: '3rem', borderRadius: '16px', border: \`1px solid \${theme.gold}\` }}>
              <h3 style={{ color: theme.charcoal, marginBottom: '2rem' }}>How a User Books Two Seats</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}><strong style={{ color: theme.gold }}>Step 1:</strong> User selects a Movie on the UI.</div>
                <div style={{ display: 'flex', gap: '1rem' }}><strong style={{ color: theme.gold }}>Step 2:</strong> Frontend calls <code style={{color: theme.burgundy}}>GET /api/shows/movie/:id</code></div>
                <div style={{ display: 'flex', gap: '1rem' }}><strong style={{ color: theme.gold }}>Step 3:</strong> Backend executes <code>SELECT * FROM SHOW JOIN MOVIE...</code></div>
                <div style={{ display: 'flex', gap: '1rem' }}><strong style={{ color: theme.gold }}>Step 4:</strong> User selects Show and proceeds to Seat Selection.</div>
                <div style={{ display: 'flex', gap: '1rem' }}><strong style={{ color: theme.gold }}>Step 5:</strong> Backend executes <code>SELECT * FROM view_show_seats</code></div>
                <div style={{ display: 'flex', gap: '1rem' }}><strong style={{ color: theme.gold }}>Step 6:</strong> User clicks Confirm.</div>
                <div style={{ display: 'flex', gap: '1rem' }}><strong style={{ color: theme.gold }}>Step 7:</strong> Backend begins <code>START TRANSACTION</code>.</div>
                <div style={{ display: 'flex', gap: '1rem' }}><strong style={{ color: theme.gold }}>Step 8:</strong> Seats locked with <code>FOR UPDATE</code>.</div>
                <div style={{ display: 'flex', gap: '1rem' }}><strong style={{ color: theme.gold }}>Step 9:</strong> <code>INSERT INTO BOOKING</code> executes.</div>
                <div style={{ display: 'flex', gap: '1rem' }}><strong style={{ color: theme.gold }}>Step 10:</strong> <code>INSERT INTO BOOKING_SEAT</code> executes.</div>
                <div style={{ display: 'flex', gap: '1rem' }}><strong style={{ color: theme.gold }}>Step 11:</strong> Transaction <code>COMMIT</code>.</div>
                <div style={{ display: 'flex', gap: '1rem' }}><strong style={{ color: theme.gold }}>Step 12:</strong> React renders Booking Confirmation Receipt.</div>
              </div>
            </div>
            <ProfessorNote text="This case study ties everything together, showing how the frontend interactions directly translate to MySQL query execution and transaction lifecycle." />
          </SlideSection>

          <SlideSection id="sec-20" num="20" title="COMPLETE SQL APPENDIX" isPresenting={isPresenting} isActive={activeSection === 'sec-20'}>
            <p style={{ color: theme.textSecondary, fontSize: '1.1rem', lineHeight: 1.7 }}>
              The complete, unmodified DDL script used to generate the database schema.
            </p>
            <CodeBlock language="SQL" code={\`CREATE DATABASE IF NOT EXISTS movie_ticket_booking;
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

CREATE TABLE IF NOT EXISTS \\\`SHOW\\\` (
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
    FOREIGN KEY (ShowID) REFERENCES \\\`SHOW\\\`(ShowID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS BOOKING_SEAT (
    BookingID INT NOT NULL,
    ShowID INT NOT NULL,
    SeatID INT NOT NULL,
    PRIMARY KEY (BookingID, SeatID),
    FOREIGN KEY (BookingID) REFERENCES BOOKING(BookingID) ON DELETE CASCADE,
    FOREIGN KEY (ShowID) REFERENCES \\\`SHOW\\\`(ShowID) ON DELETE CASCADE,
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

CREATE INDEX idx_show_movie ON \\\`SHOW\\\`(MovieID);
CREATE INDEX idx_show_screen ON \\\`SHOW\\\`(ScreenID);
CREATE INDEX idx_show_date ON \\\`SHOW\\\`(ShowDate);
CREATE INDEX idx_booking_customer ON BOOKING(CustomerID);
CREATE INDEX idx_booking_show ON BOOKING(ShowID);
CREATE INDEX idx_booking_seat_show_seat ON BOOKING_SEAT(ShowID, SeatID);

CREATE OR REPLACE VIEW view_show_seats AS
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
JOIN \\\`SHOW\\\` sh ON s.ScreenID = sh.ScreenID
LEFT JOIN BOOKING_SEAT bs ON s.SeatID = bs.SeatID AND sh.ShowID = bs.ShowID
LEFT JOIN BOOKING b ON bs.BookingID = b.BookingID;\`} />
            <ProfessorNote text="This appendix contains the entirety of our backend schema creation script, proving that we did not use an ORM to auto-generate tables, but rather handcrafted the entire database structure." />
          </SlideSection>

        </div>
      </div>
    </div>
  );
};

export default DatabaseSchema;
