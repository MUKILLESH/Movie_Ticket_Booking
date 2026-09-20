import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const theme = {
  bg: '#F7F4EC',
  surface: '#FFFFFF',
  gold: '#B08A3E',
  lightGold: '#D0B06A',
  charcoal: '#20201E',
  textSecondary: '#6F6B63',
  burgundy: '#7C1F2A',
  codeBg: '#1A1A18',
  border: 'rgba(176,138,62,0.15)'
};

const TOC = [
  { id: 'overview', label: 'DATABASE OVERVIEW' },
  { id: 'er-model', label: 'ER MODEL' },
  { id: 'schema', label: 'SCHEMA' },
  { id: 'creation', label: 'DATABASE CREATION' },
  { id: 'tables', label: 'TABLE CREATION' },
  { id: 'relationships', label: 'RELATIONSHIPS' },
  { id: 'constraints', label: 'CONSTRAINTS' },
  { id: 'data-population', label: 'DATA POPULATION' },
  { id: 'crud', label: 'CRUD OPERATIONS' },
  { id: 'reading', label: 'READING DATA' },
  { id: 'joins', label: 'JOINS' },
  { id: 'availability', label: 'SEAT AVAILABILITY' },
  { id: 'booking-flow', label: 'BOOKING WORKFLOW' },
  { id: 'transactions', label: 'TRANSACTIONS' },
  { id: 'concurrency', label: 'CONCURRENCY CONTROL' },
  { id: 'unique', label: 'UNIQUE CONSTRAINT' },
  { id: 'acid', label: 'ACID PROPERTIES' },
  { id: 'indexing', label: 'INDEXING' },
  { id: 'integration', label: 'BACKEND INTEGRATION' },
  { id: 'timeline', label: 'IMPLEMENTATION TIMELINE' },
  { id: 'summary', label: 'SUMMARY' },
];

const SectionTitle = ({ id, number, title }) => (
  <div id={id} style={{ marginBottom: '2rem', paddingTop: '4rem', marginTop: '-4rem' }}>
    <h2 className="font-serif" style={{ fontSize: '2.5rem', color: theme.charcoal, borderBottom: `1px solid ${theme.border}`, paddingBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <span style={{ color: theme.gold, fontSize: '1.5rem', fontFamily: 'sans-serif', fontWeight: 600 }}>{number}</span> 
      {title}
    </h2>
  </div>
);

const CodeBlock = ({ language, code }) => (
  <div style={{ background: theme.codeBg, borderRadius: '8px', border: `1px solid ${theme.gold}40`, overflow: 'hidden', margin: '1.5rem 0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', fontSize: '0.75rem', color: theme.lightGold, letterSpacing: '0.1em', fontWeight: 600, borderBottom: `1px solid ${theme.gold}20` }}>
      {language.toUpperCase()}
    </div>
    <pre style={{ margin: 0, padding: '1.5rem', overflowX: 'auto', color: '#e6e6e6', fontFamily: 'monospace', fontSize: '0.9rem', lineHeight: 1.5 }}>
      <code>{code}</code>
    </pre>
  </div>
);

const TableCard = ({ title, fields }) => (
  <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
    <div style={{ background: `${theme.gold}10`, padding: '1rem 1.5rem', borderBottom: `1px solid ${theme.border}`, fontWeight: 600, color: theme.charcoal, letterSpacing: '0.05em' }}>
      {title}
    </div>
    <div style={{ padding: '1rem 1.5rem' }}>
      {fields.map((field, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: i < fields.length - 1 ? `1px solid #f0f0f0` : 'none', fontSize: '0.9rem' }}>
          <span style={{ color: theme.charcoal, fontFamily: 'monospace' }}>{field.name}</span>
          {field.badge && (
            <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.5rem', borderRadius: '4px', background: field.badge === 'PK' ? `${theme.gold}20` : `${theme.burgundy}20`, color: field.badge === 'PK' ? theme.gold : theme.burgundy }}>
              {field.badge}
            </span>
          )}
        </div>
      ))}
    </div>
  </div>
);

const EntityCard = ({ name, purpose, pk, relations }) => (
  <div style={{ background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '1.5rem' }}>
    <h3 style={{ color: theme.charcoal, marginBottom: '0.5rem', fontSize: '1.2rem' }}>{name}</h3>
    <p style={{ color: theme.textSecondary, fontSize: '0.9rem', marginBottom: '1rem' }}>{purpose}</p>
    <div style={{ fontSize: '0.85rem' }}>
      <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: theme.gold }}>PK:</strong> {pk}</div>
      <div><strong style={{ color: theme.burgundy }}>Rel:</strong> {relations}</div>
    </div>
  </div>
);

const DatabaseSchema = () => {
  const [activeSection, setActiveSection] = useState(TOC[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0px -80% 0px' }
    );

    TOC.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      window.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
    }
  };

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', color: theme.charcoal, fontFamily: 'sans-serif' }}>
      
      {/* Editorial Hero */}
      <div style={{ paddingTop: '10rem', paddingBottom: '6rem', borderBottom: `1px solid ${theme.border}` }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 4rem' }}>
          <div style={{ color: theme.gold, fontWeight: 600, letterSpacing: '0.1em', fontSize: '0.85rem', marginBottom: '1rem' }}>DATABASE SYSTEM</div>
          <h1 className="font-serif" style={{ fontSize: '4.5rem', fontWeight: 400, color: theme.charcoal, lineHeight: 1.1, marginBottom: '2rem' }}>
            DATABASE ARCHITECTURE<br />& IMPLEMENTATION
          </h1>
          <p style={{ fontSize: '1.5rem', color: theme.textSecondary, maxWidth: '800px', fontStyle: 'italic', marginBottom: '4rem' }}>
            "How CineTicket transforms its cinema booking model into a relational MySQL backend."
          </p>
          
          <div style={{ display: 'flex', gap: '4rem', borderTop: `1px solid ${theme.border}`, paddingTop: '2rem' }}>
            {[
              { label: 'DATABASE', value: 'MySQL' },
              { label: 'BACKEND', value: 'Node.js / Express' },
              { label: 'MODEL', value: 'Relational Database' },
              { label: 'CORE DOMAIN', value: 'Cinema Booking' }
            ].map(meta => (
              <div key={meta.label}>
                <div style={{ fontSize: '0.75rem', color: theme.textSecondary, letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{meta.label}</div>
                <div style={{ fontWeight: 600, color: theme.charcoal }}>{meta.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '4rem', maxWidth: '1400px', margin: '0 auto', padding: '4rem' }}>
        
        {/* Sticky TOC */}
        <div style={{ position: 'relative' }}>
          <div style={{ position: 'sticky', top: '8rem', maxHeight: 'calc(100vh - 10rem)', overflowY: 'auto', paddingRight: '1rem' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', color: theme.textSecondary, marginBottom: '1.5rem' }}>CONTENTS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {TOC.map(item => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  style={{
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    color: activeSection === item.id ? theme.charcoal : theme.textSecondary,
                    fontWeight: activeSection === item.id ? 700 : 400,
                    transition: 'all 0.2s',
                    padding: '0.25rem 0',
                    borderLeft: activeSection === item.id ? `2px solid ${theme.gold}` : '2px solid transparent',
                    paddingLeft: '1rem',
                    marginLeft: '-1rem'
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div style={{ maxWidth: '900px' }}>
          
          <SectionTitle id="overview" number="01" title="DATABASE ARCHITECTURE" />
          <div style={{ background: theme.surface, padding: '3rem', borderRadius: '16px', border: `1px solid ${theme.border}`, marginBottom: '4rem' }}>
            <p style={{ color: theme.textSecondary, lineHeight: 1.7, marginBottom: '3rem' }}>
              The CineTicket architecture relies on a robust relational database to maintain data integrity, handle concurrent bookings, and represent complex real-world cinema operations. The flow ensures secure, transactional operations between the user interface and the underlying data layer.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
              {[
                { name: 'USER', desc: 'Interacts with UI' },
                { name: 'CINETICKET FRONTEND (REACT)', desc: 'Validates & sends requests' },
                { name: 'NODE.JS / EXPRESS BACKEND', desc: 'Business logic & Transactions' },
                { name: 'SQL QUERIES', desc: 'Parameterized execution' },
                { name: 'MYSQL DATABASE', desc: 'Persistent storage' },
                { name: 'TABLES / CONSTRAINTS', desc: 'Data integrity enforcement' },
              ].map((node, i) => (
                <React.Fragment key={i}>
                  <div style={{ width: '100%', maxWidth: '400px', background: theme.bg, border: `1px solid ${theme.gold}40`, padding: '1rem', textAlign: 'center', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 700, color: theme.charcoal, letterSpacing: '0.05em' }}>{node.name}</div>
                    <div style={{ fontSize: '0.85rem', color: theme.textSecondary, marginTop: '0.5rem' }}>{node.desc}</div>
                  </div>
                  {i < 5 && <div style={{ height: '30px', width: '2px', background: theme.gold }}></div>}
                </React.Fragment>
              ))}
            </div>
          </div>

          <SectionTitle id="er-model" number="02" title="FROM ER MODEL TO RELATIONAL SCHEMA" />
          <p style={{ color: theme.textSecondary, lineHeight: 1.7, marginBottom: '2rem' }}>
            The database design started with an Entity-Relationship (ER) model encompassing all actors and objects in a cinema ecosystem. This model dictates how real-world entities are mapped to relational tables.
          </p>
          
          {/* ER Diagram Visual Placeholder */}
          <div style={{ background: theme.surface, padding: '2rem', border: `1px solid ${theme.gold}`, borderRadius: '4px', marginBottom: '3rem', boxShadow: '0 10px 30px rgba(0,0,0,0.05)', textAlign: 'center' }}>
            <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px dashed ${theme.border}`, color: theme.textSecondary }}>
              [ ACTUAL ER DIAGRAM IMAGE HERE ]
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '4rem' }}>
            <EntityCard name="THEATRE" purpose="Stores physical cinema locations." pk="TheatreID" relations="(1) - (M) SCREEN" />
            <EntityCard name="SCREEN" purpose="Physical auditoriums within a theatre." pk="ScreenID" relations="FK: TheatreID" />
            <EntityCard name="SEAT" purpose="Individual seats per screen." pk="SeatID" relations="FK: ScreenID" />
            <EntityCard name="MOVIE" purpose="Film metadata." pk="MovieID" relations="(1) - (M) SHOW" />
            <EntityCard name="SHOW" purpose="Schedules a Movie on a Screen." pk="ShowID" relations="FK: MovieID, ScreenID" />
            <EntityCard name="CUSTOMER" purpose="User accounts." pk="CustomerID" relations="(1) - (M) BOOKING" />
            <EntityCard name="BOOKING" purpose="A transaction record." pk="BookingID" relations="FK: CustomerID, ShowID" />
            <EntityCard name="PAYMENT" purpose="Financial transaction status." pk="PaymentID" relations="FK: BookingID" />
          </div>

          <SectionTitle id="schema" number="03" title="RELATIONAL SCHEMA" />
          <p style={{ color: theme.textSecondary, lineHeight: 1.7, marginBottom: '2rem' }}>
            The entities translate into the following relational table structures. Note the use of Primary Keys (PK) for identification and Foreign Keys (FK) for relationships.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
            <TableCard title="MOVIE" fields={[{name: 'MovieID', badge: 'PK'}, {name: 'Title'}, {name: 'Duration'}, {name: 'Genre'}]} />
            <TableCard title="SHOW" fields={[{name: 'ShowID', badge: 'PK'}, {name: 'MovieID', badge: 'FK'}, {name: 'ScreenID', badge: 'FK'}, {name: 'ShowDate'}, {name: 'Price'}]} />
            <TableCard title="SCREEN" fields={[{name: 'ScreenID', badge: 'PK'}, {name: 'TheatreID', badge: 'FK'}, {name: 'SeatCapacity'}]} />
            <TableCard title="SEAT" fields={[{name: 'SeatID', badge: 'PK'}, {name: 'ScreenID', badge: 'FK'}, {name: 'SeatNumber'}]} />
            <TableCard title="CUSTOMER" fields={[{name: 'CustomerID', badge: 'PK'}, {name: 'Name'}, {name: 'Email'}]} />
            <TableCard title="BOOKING" fields={[{name: 'BookingID', badge: 'PK'}, {name: 'CustomerID', badge: 'FK'}, {name: 'ShowID', badge: 'FK'}, {name: 'Status'}]} />
          </div>

          <SectionTitle id="creation" number="04" title="DATABASE INITIALIZATION" />
          <p style={{ color: theme.textSecondary, lineHeight: 1.7 }}>
            The foundation begins by establishing the database itself. We ensure idempotency using <code>IF NOT EXISTS</code>.
          </p>
          <CodeBlock language="SQL" code={`CREATE DATABASE IF NOT EXISTS movie_ticket_booking;\nUSE movie_ticket_booking;`} />

          <SectionTitle id="tables" number="05" title="TABLE CREATION" />
          <p style={{ color: theme.textSecondary, lineHeight: 1.7, marginBottom: '2rem' }}>
            Tables are created in a specific dependency order. Independent entities (like MOVIE and THEATRE) are created first, followed by dependent entities (like SHOW and SEAT) that require Foreign Keys.
          </p>

          <h3 style={{ color: theme.charcoal, marginTop: '2rem' }}>Core Entities</h3>
          <CodeBlock language="SQL" code={`CREATE TABLE IF NOT EXISTS MOVIE (
    MovieID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Genre VARCHAR(100),
    Language VARCHAR(50),
    Duration INT NOT NULL CHECK (Duration > 0),
    ReleaseDate DATE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS THEATRE (
    TheatreID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Location VARCHAR(255) NOT NULL,
    City VARCHAR(100) NOT NULL
) ENGINE=InnoDB;`} />

          <h3 style={{ color: theme.charcoal, marginTop: '2rem' }}>Scheduling Entities</h3>
          <CodeBlock language="SQL" code={`CREATE TABLE IF NOT EXISTS \`SHOW\` (
    ShowID INT AUTO_INCREMENT PRIMARY KEY,
    ShowDate DATE NOT NULL,
    ShowTime TIME NOT NULL,
    Price DECIMAL(10, 2) NOT NULL CHECK (Price >= 0),
    MovieID INT NOT NULL,
    ScreenID INT NOT NULL,
    FOREIGN KEY (MovieID) REFERENCES MOVIE(MovieID) ON DELETE CASCADE,
    FOREIGN KEY (ScreenID) REFERENCES SCREEN(ScreenID) ON DELETE CASCADE
) ENGINE=InnoDB;`} />
          <p style={{ color: theme.textSecondary, fontSize: '0.9rem', fontStyle: 'italic', marginTop: '-0.5rem', marginBottom: '2rem' }}>* Note the use of ON DELETE CASCADE to maintain referential integrity if a Movie or Screen is deleted.</p>

          <SectionTitle id="relationships" number="06" title="FOREIGN KEYS & RELATIONSHIPS" />
          <p style={{ color: theme.textSecondary, lineHeight: 1.7, marginBottom: '2rem' }}>
            Relationships enforce data consistency. A crucial relationship is the Many-to-Many mapping between a Booking and a Seat. Since a booking has many seats, and a seat (over time) belongs to many bookings, we use a junction table.
          </p>

          <div style={{ background: theme.surface, padding: '2rem', border: `1px solid ${theme.border}`, borderRadius: '12px', marginBottom: '2rem' }}>
            <h4 style={{ color: theme.gold, marginBottom: '1rem' }}>Resolving Many-to-Many: BOOKING_SEAT</h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2rem', marginBottom: '2rem', fontWeight: 600, color: theme.charcoal }}>
              <span>BOOKING</span>
              <span style={{ color: theme.burgundy }}>→</span>
              <span style={{ border: `1px solid ${theme.border}`, padding: '0.5rem 1rem', borderRadius: '4px', background: `${theme.gold}10` }}>BOOKING_SEAT</span>
              <span style={{ color: theme.burgundy }}>←</span>
              <span>SEAT</span>
            </div>
            <CodeBlock language="SQL" code={`CREATE TABLE IF NOT EXISTS BOOKING_SEAT (
    BookingID INT NOT NULL,
    ShowID INT NOT NULL,
    SeatID INT NOT NULL,
    PRIMARY KEY (BookingID, SeatID),
    FOREIGN KEY (BookingID) REFERENCES BOOKING(BookingID) ON DELETE CASCADE,
    FOREIGN KEY (ShowID) REFERENCES \`SHOW\`(ShowID) ON DELETE CASCADE,
    FOREIGN KEY (SeatID) REFERENCES SEAT(SeatID) ON DELETE CASCADE,
    UNIQUE (ShowID, SeatID)
) ENGINE=InnoDB;`} />
          </div>

          <SectionTitle id="constraints" number="07" title="DATABASE CONSTRAINTS" />
          <p style={{ color: theme.textSecondary, lineHeight: 1.7, marginBottom: '2rem' }}>
            Constraints protect the data at the schema layer. CineTicket uses several critical constraints:
          </p>
          <div style={{ display: 'grid', gap: '1rem', marginBottom: '4rem' }}>
            {[
              { type: 'PRIMARY KEY', desc: 'Uniquely identifies records. Used on all tables via AUTO_INCREMENT IDs.' },
              { type: 'FOREIGN KEY', desc: 'Enforces referential integrity. e.g., A SHOW must link to a valid MOVIE.' },
              { type: 'NOT NULL', desc: 'Prevents empty critical data. e.g., Movie Title.' },
              { type: 'UNIQUE', desc: 'Prevents duplicates. Used heavily for concurrency (ShowID, SeatID) and Emails.' },
              { type: 'CHECK', desc: 'Validates business logic. e.g., CHECK (Price >= 0).' }
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: '2rem', padding: '1rem', background: theme.surface, border: `1px solid ${theme.border}`, borderRadius: '8px' }}>
                <div style={{ width: '150px', fontWeight: 700, color: theme.charcoal }}>{c.type}</div>
                <div style={{ color: theme.textSecondary }}>{c.desc}</div>
              </div>
            ))}
          </div>

          <SectionTitle id="data-population" number="08" title="DATA POPULATION" />
          <p style={{ color: theme.textSecondary, lineHeight: 1.7 }}>
            Sample data is injected via INSERT commands to seed the application. For seats, a stored procedure <code>GenerateSeats</code> was used to dynamically create 250 seats across multiple screens.
          </p>
          <CodeBlock language="SQL" code={`INSERT INTO THEATRE (Name, Location, City) 
VALUES ('Cineplex IMAX', 'Downtown Mall', 'Metropolis');

INSERT INTO MOVIE (Title, Genre, Language, Duration) 
VALUES ('Inception', 'Sci-Fi', 'English', 148);`} />

          <SectionTitle id="crud" number="09" title="CRUD OPERATIONS" />
          <p style={{ color: theme.textSecondary, lineHeight: 1.7 }}>
            The backend executes CRUD operations based on API calls.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
            <div>
              <h4 style={{ color: theme.gold, marginBottom: '0.5rem' }}>CREATE (Insert Booking)</h4>
              <CodeBlock language="SQL" code={`INSERT INTO BOOKING (TotalAmount, Status, CustomerID, ShowID) VALUES (?, 'PENDING', ?, ?)`} />
            </div>
            <div>
              <h4 style={{ color: theme.gold, marginBottom: '0.5rem' }}>UPDATE (Confirm Status)</h4>
              <CodeBlock language="SQL" code={`UPDATE BOOKING SET Status = 'CONFIRMED' WHERE BookingID = ?`} />
            </div>
          </div>

          <SectionTitle id="reading" number="10" title="READING DATA" />
          <p style={{ color: theme.textSecondary, lineHeight: 1.7 }}>
            Standard SELECT statements use WHERE, ORDER BY, and parameters to fetch specific records.
          </p>
          <CodeBlock language="SQL" code={`SELECT b.BookingID, b.BookingDate, b.TotalAmount, b.Status, m.Title
FROM BOOKING b
JOIN \`SHOW\` s ON b.ShowID = s.ShowID
JOIN MOVIE m ON s.MovieID = m.MovieID
WHERE b.CustomerID = ?
ORDER BY b.BookingDate DESC`} />

          <SectionTitle id="joins" number="11" title="RELATIONAL QUERIES & JOINS" />
          <p style={{ color: theme.textSecondary, lineHeight: 1.7, marginBottom: '2rem' }}>
            To assemble meaningful data for the frontend, we must join tables. The <code>getBookingById</code> endpoint uses a massive 6-table INNER JOIN to retrieve a complete booking receipt.
          </p>
          <CodeBlock language="SQL" code={`SELECT b.BookingID, b.BookingDate, b.TotalAmount, b.Status, c.Name as CustomerName,
       s.ShowDate, s.ShowTime, m.Title as MovieTitle, t.Name as TheatreName, sc.ScreenNumber
FROM BOOKING b
JOIN CUSTOMER c ON b.CustomerID = c.CustomerID
JOIN \`SHOW\` s ON b.ShowID = s.ShowID
JOIN MOVIE m ON s.MovieID = m.MovieID
JOIN SCREEN sc ON s.ScreenID = sc.ScreenID
JOIN THEATRE t ON sc.TheatreID = t.TheatreID
WHERE b.BookingID = ?`} />

          <SectionTitle id="availability" number="12" title="SEAT AVAILABILITY LOGIC" />
          <p style={{ color: theme.textSecondary, lineHeight: 1.7, marginBottom: '2rem' }}>
            Determining seat status requires cross-referencing all seats in a screen against active bookings. We implemented a <strong>Database View</strong> (<code>view_show_seats</code>) using <code>LEFT JOIN</code> to ensure we see all seats, even unbooked ones.
          </p>
          <CodeBlock language="SQL" code={`CREATE OR REPLACE VIEW view_show_seats AS
SELECT 
    s.SeatID, s.SeatNumber, s.SeatType, sh.ShowID,
    CASE 
        WHEN b.Status = 'CANCELLED' OR b.Status = 'FAILED' THEN 'AVAILABLE'
        WHEN bs.SeatID IS NULL THEN 'AVAILABLE'
        ELSE 'BOOKED'
    END AS Status
FROM SEAT s
JOIN \`SHOW\` sh ON s.ScreenID = sh.ScreenID
LEFT JOIN BOOKING_SEAT bs ON s.SeatID = bs.SeatID AND sh.ShowID = bs.ShowID
LEFT JOIN BOOKING b ON bs.BookingID = b.BookingID;`} />

          <SectionTitle id="booking-flow" number="13" title="BOOKING TRANSACTION FLOW" />
          <div style={{ background: theme.surface, padding: '2rem', border: `1px solid ${theme.border}`, borderRadius: '12px', marginBottom: '4rem' }}>
            <ol style={{ margin: 0, paddingLeft: '1.5rem', color: theme.charcoal, lineHeight: 2 }}>
              <li>User selects movie and showtime.</li>
              <li>Backend retrieves <code>view_show_seats</code> to render grid.</li>
              <li>User selects seats and clicks Confirm.</li>
              <li>Backend validates data and initiates a MySQL <strong>Transaction</strong>.</li>
              <li>Row-level locks are applied to selected seats.</li>
              <li>Records are inserted into <code>BOOKING</code> and <code>BOOKING_SEAT</code>.</li>
              <li>Transaction <strong>COMMITS</strong>.</li>
              <li>Confirmation is returned to the React frontend.</li>
            </ol>
          </div>

          <SectionTitle id="transactions" number="14" title="TRANSACTIONS & ATOMICITY" />
          <p style={{ color: theme.textSecondary, lineHeight: 1.7 }}>
            Transactions ensure that either all database changes succeed, or none do. If creating the <code>BOOKING_SEAT</code> records fails, the <code>BOOKING</code> record rolls back.
          </p>
          <CodeBlock language="SQL" code={`START TRANSACTION;

-- Insert Booking
INSERT INTO BOOKING ...

-- Insert Booking Seats
INSERT INTO BOOKING_SEAT ...

-- Update Status
UPDATE BOOKING SET Status = 'CONFIRMED' ...

COMMIT; -- Or ROLLBACK if any step fails`} />

          <SectionTitle id="concurrency" number="15" title="CONCURRENCY CONTROL" />
          <p style={{ color: theme.textSecondary, lineHeight: 1.7, marginBottom: '2rem' }}>
            If two users try to book the same seat at the exact same millisecond, a race condition occurs. To prevent double bookings, CineTicket uses <strong>Row-Level Locking</strong> via <code>FOR UPDATE</code> within a transaction.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ background: theme.bg, padding: '1.5rem', border: `1px solid ${theme.gold}`, borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: theme.charcoal, marginBottom: '1rem' }}>USER A</div>
              <div style={{ fontSize: '0.85rem', color: theme.textSecondary }}>Requests Seat D6</div>
              <div style={{ margin: '0.5rem 0', color: theme.burgundy }}>↓</div>
              <div style={{ background: theme.surface, padding: '0.5rem', border: `1px solid ${theme.border}` }}>ACQUIRES LOCK (FOR UPDATE)</div>
              <div style={{ margin: '0.5rem 0', color: theme.burgundy }}>↓</div>
              <div style={{ fontSize: '0.85rem', color: theme.textSecondary }}>Books Seat & Commits</div>
            </div>
            <div style={{ background: theme.bg, padding: '1.5rem', border: `1px solid ${theme.border}`, borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontWeight: 700, color: theme.charcoal, marginBottom: '1rem' }}>USER B</div>
              <div style={{ fontSize: '0.85rem', color: theme.textSecondary }}>Requests Seat D6</div>
              <div style={{ margin: '0.5rem 0', color: theme.textSecondary }}>↓</div>
              <div style={{ background: theme.surface, padding: '0.5rem', border: `1px dashed ${theme.textSecondary}` }}>WAITS FOR LOCK</div>
              <div style={{ margin: '0.5rem 0', color: theme.textSecondary }}>↓</div>
              <div style={{ fontSize: '0.85rem', color: theme.textSecondary }}>Fails (Seat Unavailable)</div>
            </div>
          </div>
          <CodeBlock language="SQL" code={`-- User A's backend executes:
SELECT SeatID FROM SEAT 
WHERE SeatID IN (?) AND ScreenID = ? 
FOR UPDATE; -- Places exclusive lock on rows`} />

          <SectionTitle id="unique" number="16" title="UNIQUE CONSTRAINT AS FINAL DEFENSE" />
          <p style={{ color: theme.textSecondary, lineHeight: 1.7 }}>
            If code-level logic fails, the database schema provides a final impenetrable defense. The <code>UNIQUE (ShowID, SeatID)</code> constraint in <code>BOOKING_SEAT</code> guarantees that MySQL will reject any duplicate insertions with an <code>ER_DUP_ENTRY</code> error.
          </p>

          <SectionTitle id="acid" number="17" title="ACID PROPERTIES" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '4rem' }}>
            {[
              { title: 'ATOMICITY', desc: 'A booking and its seat assignments succeed together or fail together via Transactions.' },
              { title: 'CONSISTENCY', desc: 'Foreign Keys and Constraints ensure invalid relationships (like booking a non-existent show) cannot exist.' },
              { title: 'ISOLATION', desc: 'Row-level locking ensures concurrent bookings do not interfere with each other.' },
              { title: 'DURABILITY', desc: 'Once committed, booking records are permanently stored in the Aiven MySQL cluster.' }
            ].map(prop => (
              <div key={prop.title} style={{ background: theme.surface, padding: '1.5rem', border: `1px solid ${theme.border}`, borderRadius: '8px' }}>
                <h4 style={{ color: theme.gold, marginBottom: '0.5rem' }}>{prop.title}</h4>
                <p style={{ color: theme.textSecondary, fontSize: '0.9rem', lineHeight: 1.6 }}>{prop.desc}</p>
              </div>
            ))}
          </div>

          <SectionTitle id="indexing" number="18" title="DATABASE INDEXING & PERFORMANCE" />
          <p style={{ color: theme.textSecondary, lineHeight: 1.7, marginBottom: '2rem' }}>
            To optimize query performance and prevent full-table scans during heavy read operations (like fetching showtimes), indexes were added to frequently filtered columns and Foreign Keys.
          </p>
          <CodeBlock language="SQL" code={`CREATE INDEX idx_show_movie ON \`SHOW\`(MovieID);
CREATE INDEX idx_booking_customer ON BOOKING(CustomerID);
CREATE INDEX idx_booking_seat_show_seat ON BOOKING_SEAT(ShowID, SeatID);`} />

          <SectionTitle id="integration" number="19" title="NODE.JS ↔ MYSQL INTEGRATION" />
          <p style={{ color: theme.textSecondary, lineHeight: 1.7, marginBottom: '2rem' }}>
            The backend communicates with the database using the <code>mysql2/promise</code> connection pool. This is highly efficient and utilizes <strong>Parameterized Queries</strong> to prevent SQL Injection attacks.
          </p>
          <CodeBlock language="JAVASCRIPT" code={`// From backend/src/config/db.js
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Example of Safe Parameterized Query
const [shows] = await pool.query(
    'SELECT * FROM \`SHOW\` WHERE ShowID = ?', 
    [showId] // Variable safely injected by mysql2
);`} />

          <SectionTitle id="timeline" number="20" title="IMPLEMENTATION TIMELINE" />
          <div style={{ background: theme.surface, padding: '3rem', border: `1px solid ${theme.border}`, borderRadius: '12px', marginBottom: '4rem' }}>
            {[
              'Design ER Model',
              'Create Database & Configure Aiven Cloud',
              'Create Relational Schema Tables',
              'Establish Foreign Key Relationships',
              'Seed Initial Data via Procedures',
              'Connect Node.js Backend Pool',
              'Write Read/Write SQL Queries',
              'Implement Transaction Blocks',
              'Add Row-Level Locks for Concurrency',
              'Integrate with React Frontend UI'
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: i === 9 ? 0 : '1rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: `${theme.gold}20`, color: theme.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                  {(i+1).toString().padStart(2, '0')}
                </div>
                <div style={{ color: theme.charcoal, fontWeight: 500 }}>{step}</div>
              </div>
            ))}
          </div>

          <SectionTitle id="summary" number="21" title="DATABASE IMPLEMENTATION SUMMARY" />
          <div style={{ padding: '3rem', background: `${theme.gold}10`, borderRadius: '16px', border: `1px solid ${theme.gold}40`, marginBottom: '10rem' }}>
            <p style={{ color: theme.charcoal, fontSize: '1.1rem', lineHeight: 1.8, margin: 0 }}>
              The CineTicket backend successfully translates a theoretical cinema ER model into a highly durable, concurrent, relational MySQL database. By leveraging primary and foreign keys for referential integrity, junction tables for complex mappings, and explicit transaction locks (<code>FOR UPDATE</code>) combined with schema constraints (<code>UNIQUE</code>), the system provides a production-grade booking engine that mathematically guarantees data consistency and prevents double bookings under heavy load.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DatabaseSchema;
