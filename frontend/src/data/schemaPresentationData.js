export const theme = {
    bg: '#F7F4EC',
    surface: '#FFFFFF',
    gold: '#B08A3E',
    lightGold: '#D4B66A',
    charcoal: '#20201E',
    textSecondary: '#6E6A62',
    burgundy: '#7C1F2A',
    codeBg: '#1A1A18',
    border: 'rgba(176,138,62,0.15)'
  };
  
  export const TOC = [
    { id: 'sec-01', num: '01', title: 'DATABASE ARCHITECTURE' },
    { id: 'sec-02', num: '02', title: 'ER MODEL' },
    { id: 'sec-03', num: '03', title: 'SCHEMA OVERVIEW' },
    { id: 'sec-04', num: '04', title: 'DATABASE CREATION' },
    { id: 'sec-05', num: '05', title: 'TABLE CREATION' },
    { id: 'sec-06', num: '06', title: 'PRIMARY KEYS' },
    { id: 'sec-07', num: '07', title: 'FOREIGN KEYS' },
    { id: 'sec-08', num: '08', title: 'CONSTRAINTS' },
    { id: 'sec-09', num: '09', title: 'DATA POPULATION' },
    { id: 'sec-10', num: '10', title: 'CRUD OPERATIONS' },
    { id: 'sec-11', num: '11', title: 'READING DATA' },
    { id: 'sec-12', num: '12', title: 'SQL JOINS' },
    { id: 'sec-13', num: '13', title: 'SEAT AVAILABILITY' },
    { id: 'sec-14', num: '14', title: 'BOOKING WORKFLOW' },
    { id: 'sec-15', num: '15', title: 'TRANSACTIONS' },
    { id: 'sec-16', num: '16', title: 'CONCURRENCY CONTROL' },
    { id: 'sec-17', num: '17', title: 'UNIQUE CONSTRAINT' },
    { id: 'sec-18', num: '18', title: 'ACID PROPERTIES' },
    { id: 'sec-19', num: '19', title: 'INDEXING' },
    { id: 'sec-20', num: '20', title: 'BACKEND INTEGRATION' },
    { id: 'sec-21', num: '21', title: 'IMPLEMENTATION TIMELINE' },
    { id: 'sec-22', num: '22', title: 'COMPLETE SQL APPENDIX' },
    { id: 'sec-23', num: '23', title: 'PROFESSOR QUESTIONS' },
  ];
  
  export const TABLES = [
    {
      name: 'THEATRE',
      purpose: 'Stores physical cinema locations.',
      sql: \`CREATE TABLE IF NOT EXISTS THEATRE (
      TheatreID INT AUTO_INCREMENT PRIMARY KEY,
      Name VARCHAR(100) NOT NULL,
      Location VARCHAR(255) NOT NULL,
      City VARCHAR(100) NOT NULL
  ) ENGINE=InnoDB;\`,
      columns: [
        { name: 'TheatreID', desc: 'Unique auto-incrementing ID for each theatre.' },
        { name: 'Name, Location, City', desc: 'String fields to store the physical address details.' }
      ],
      pk: 'TheatreID',
      fk: 'None',
      constraints: 'NOT NULL on all fields ensures no incomplete theatre records exist.',
      relationships: 'THEATRE 1 → M SCREEN',
      usage: 'pool.query("SELECT * FROM THEATRE"); in theatreController.js',
      professorNote: 'The Theatre table is an independent core entity. It doesn\'t rely on any other table to exist, which is why it is created first and has no foreign keys.'
    },
    {
      name: 'SCREEN',
      purpose: 'Represents individual auditoriums inside a theatre.',
      sql: \`CREATE TABLE IF NOT EXISTS SCREEN (
      ScreenID INT AUTO_INCREMENT PRIMARY KEY,
      ScreenNumber VARCHAR(20) NOT NULL,
      SeatCapacity INT NOT NULL CHECK (SeatCapacity > 0),
      TheatreID INT NOT NULL,
      FOREIGN KEY (TheatreID) REFERENCES THEATRE(TheatreID) ON DELETE CASCADE
  ) ENGINE=InnoDB;\`,
      columns: [
        { name: 'ScreenID', desc: 'Unique identifier for the screen.' },
        { name: 'ScreenNumber', desc: 'The physical label (e.g., "Screen 1", "IMAX").' },
        { name: 'SeatCapacity', desc: 'Maximum number of seats the screen holds.' }
      ],
      pk: 'ScreenID',
      fk: 'TheatreID referencing THEATRE',
      constraints: 'CHECK (SeatCapacity > 0) prevents a screen from having 0 or negative seats. ON DELETE CASCADE ensures if a Theatre closes, all its screens are removed.',
      relationships: 'SCREEN 1 → M SEAT, SCREEN 1 → M SHOW',
      usage: 'Joined with SHOW and THEATRE in getBookingById.',
      professorNote: 'This table uses our first Foreign Key. I used ON DELETE CASCADE because a screen physically cannot exist without its parent theatre. I also added a CHECK constraint to enforce logical business rules at the schema level.'
    },
    {
      name: 'MOVIE',
      purpose: 'Stores metadata about the films.',
      sql: \`CREATE TABLE IF NOT EXISTS MOVIE (
      MovieID INT AUTO_INCREMENT PRIMARY KEY,
      Title VARCHAR(255) NOT NULL,
      Genre VARCHAR(100),
      Language VARCHAR(50),
      Duration INT NOT NULL CHECK (Duration > 0),
      ReleaseDate DATE
  ) ENGINE=InnoDB;\`,
      columns: [
        { name: 'MovieID', desc: 'Unique film identifier.' },
        { name: 'Title', desc: 'The name of the movie.' },
        { name: 'Duration', desc: 'Runtime in minutes.' }
      ],
      pk: 'MovieID',
      fk: 'None',
      constraints: 'CHECK (Duration > 0) prevents movies with invalid runtimes.',
      relationships: 'MOVIE 1 → M SHOW',
      usage: 'pool.query("SELECT * FROM MOVIE"); in movieController.js',
      professorNote: 'Like Theatre, Movie is an independent entity. It serves as a lookup table for all scheduled shows.'
    },
    {
      name: 'SHOW',
      purpose: 'Schedules a specific Movie on a specific Screen at a specific time.',
      sql: \`CREATE TABLE IF NOT EXISTS \`SHOW\` (
      ShowID INT AUTO_INCREMENT PRIMARY KEY,
      ShowDate DATE NOT NULL,
      ShowTime TIME NOT NULL,
      Price DECIMAL(10, 2) NOT NULL CHECK (Price >= 0),
      MovieID INT NOT NULL,
      ScreenID INT NOT NULL,
      FOREIGN KEY (MovieID) REFERENCES MOVIE(MovieID) ON DELETE CASCADE,
      FOREIGN KEY (ScreenID) REFERENCES SCREEN(ScreenID) ON DELETE CASCADE
  ) ENGINE=InnoDB;\`,
      columns: [
        { name: 'ShowID', desc: 'Unique schedule identifier.' },
        { name: 'ShowDate & ShowTime', desc: 'When the movie plays.' },
        { name: 'Price', desc: 'Base ticket price for this specific screening.' }
      ],
      pk: 'ShowID',
      fk: 'MovieID referencing MOVIE, ScreenID referencing SCREEN',
      constraints: 'DECIMAL(10,2) is used instead of FLOAT for exact monetary precision. CHECK (Price >= 0) prevents negative pricing.',
      relationships: 'SHOW 1 → M BOOKING',
      usage: 'pool.query("SELECT ... FROM SHOW JOIN MOVIE ...") in showController.js',
      professorNote: 'This table resolves the Many-to-Many relationship between Movies and Screens. A movie plays on many screens, and a screen plays many movies over time.'
    },
    {
      name: 'SEAT',
      purpose: 'Represents an individual physical seat inside a screen.',
      sql: \`CREATE TABLE IF NOT EXISTS SEAT (
      SeatID INT AUTO_INCREMENT PRIMARY KEY,
      SeatNumber VARCHAR(10) NOT NULL,
      SeatType ENUM('REGULAR', 'PREMIUM', 'VIP') NOT NULL DEFAULT 'REGULAR',
      ScreenID INT NOT NULL,
      FOREIGN KEY (ScreenID) REFERENCES SCREEN(ScreenID) ON DELETE CASCADE,
      UNIQUE (ScreenID, SeatNumber)
  ) ENGINE=InnoDB;\`,
      columns: [
        { name: 'SeatID', desc: 'Unique global seat identifier.' },
        { name: 'SeatNumber', desc: 'The row/col label (e.g., "A1", "D6").' },
        { name: 'SeatType', desc: 'Category of the seat for pricing tiers.' }
      ],
      pk: 'SeatID',
      fk: 'ScreenID referencing SCREEN',
      constraints: 'ENUM restricts values to valid categories. UNIQUE (ScreenID, SeatNumber) is a composite constraint ensuring "Seat A1" only exists once per screen.',
      relationships: 'SEAT 1 → M BOOKING_SEAT',
      usage: 'Used heavily in the view_show_seats view to calculate availability.',
      professorNote: 'The ENUM constraint here ensures data consistency, preventing typos like "V.I.P". The composite UNIQUE constraint is critical because SeatNumbers are only unique *within* a screen, not globally.'
    },
    {
      name: 'CUSTOMER',
      purpose: 'Stores user account details.',
      sql: \`CREATE TABLE IF NOT EXISTS CUSTOMER (
      CustomerID INT AUTO_INCREMENT PRIMARY KEY,
      Name VARCHAR(100) NOT NULL,
      Email VARCHAR(100) NOT NULL UNIQUE,
      Phone VARCHAR(20),
      Password VARCHAR(255) NOT NULL
  ) ENGINE=InnoDB;\`,
      columns: [
        { name: 'CustomerID', desc: 'Unique user ID.' },
        { name: 'Email', desc: 'Login credential.' },
        { name: 'Password', desc: 'Hashed password string.' }
      ],
      pk: 'CustomerID',
      fk: 'None',
      constraints: 'UNIQUE on Email ensures no duplicate accounts can be registered.',
      relationships: 'CUSTOMER 1 → M BOOKING',
      usage: 'Authentication and joined to Booking for receipts.',
      professorNote: 'A standard user table. We use a UNIQUE constraint on the email to enforce one account per email address at the database level.'
    },
    {
      name: 'BOOKING',
      purpose: 'Records the overarching transaction of a user booking tickets for a show.',
      sql: \`CREATE TABLE IF NOT EXISTS BOOKING (
      BookingID INT AUTO_INCREMENT PRIMARY KEY,
      BookingDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      TotalAmount DECIMAL(10, 2) NOT NULL CHECK (TotalAmount >= 0),
      Status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'PENDING',
      CustomerID INT NOT NULL,
      ShowID INT NOT NULL,
      FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(CustomerID) ON DELETE CASCADE,
      FOREIGN KEY (ShowID) REFERENCES \`SHOW\`(ShowID) ON DELETE CASCADE
  ) ENGINE=InnoDB;\`,
      columns: [
        { name: 'BookingID', desc: 'Unique transaction ID.' },
        { name: 'BookingDate', desc: 'Exact timestamp of booking.' },
        { name: 'Status', desc: 'Current state of the transaction.' }
      ],
      pk: 'BookingID',
      fk: 'CustomerID referencing CUSTOMER, ShowID referencing SHOW',
      constraints: 'DEFAULT CURRENT_TIMESTAMP lets MySQL handle time insertion automatically. ENUM tracks the transaction lifecycle.',
      relationships: 'BOOKING 1 → M BOOKING_SEAT, BOOKING 1 → 1 PAYMENT',
      usage: 'Inserted via bookingService.js transaction.',
      professorNote: 'This is the parent transaction record. It doesn\'t store which seats were booked, only who booked a show, when, and for how much.'
    },
    {
      name: 'BOOKING_SEAT',
      purpose: 'Junction table resolving the M:N relationship between BOOKING and SEAT. Crucial for preventing double bookings.',
      sql: \`CREATE TABLE IF NOT EXISTS BOOKING_SEAT (
      BookingID INT NOT NULL,
      ShowID INT NOT NULL,
      SeatID INT NOT NULL,
      PRIMARY KEY (BookingID, SeatID),
      FOREIGN KEY (BookingID) REFERENCES BOOKING(BookingID) ON DELETE CASCADE,
      FOREIGN KEY (ShowID) REFERENCES \`SHOW\`(ShowID) ON DELETE CASCADE,
      FOREIGN KEY (SeatID) REFERENCES SEAT(SeatID) ON DELETE CASCADE,
      UNIQUE (ShowID, SeatID)
  ) ENGINE=InnoDB;\`,
      columns: [
        { name: 'BookingID', desc: 'Reference to the parent transaction.' },
        { name: 'ShowID', desc: 'Reference to the scheduled show.' },
        { name: 'SeatID', desc: 'Reference to the specific physical seat.' }
      ],
      pk: 'Composite: (BookingID, SeatID)',
      fk: 'BookingID, ShowID, SeatID',
      constraints: 'UNIQUE (ShowID, SeatID) is the ultimate defense against double booking.',
      relationships: 'Junction table mapping Bookings to Seats.',
      usage: 'Bulk inserted during the booking transaction.',
      professorNote: 'This is the most critical table for concurrency. The UNIQUE constraint on ShowID and SeatID guarantees that across the entire system, a specific seat can only be mapped to a specific show exactly once. If a race condition bypasses our backend locks, this throws an ER_DUP_ENTRY error.'
    },
    {
      name: 'PAYMENT',
      purpose: 'Tracks financial transactions related to a booking.',
      sql: \`CREATE TABLE IF NOT EXISTS PAYMENT (
      PaymentID INT AUTO_INCREMENT PRIMARY KEY,
      Amount DECIMAL(10, 2) NOT NULL CHECK (Amount >= 0),
      PaymentMode ENUM('UPI', 'CARD', 'NET_BANKING') NOT NULL,
      PaymentStatus ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
      BookingID INT NOT NULL UNIQUE,
      TransactionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (BookingID) REFERENCES BOOKING(BookingID) ON DELETE CASCADE
  ) ENGINE=InnoDB;\`,
      columns: [
        { name: 'PaymentID', desc: 'Unique payment record.' },
        { name: 'BookingID', desc: 'The booking this pays for.' }
      ],
      pk: 'PaymentID',
      fk: 'BookingID referencing BOOKING',
      constraints: 'UNIQUE on BookingID enforces a strict 1-to-1 relationship between a Booking and a Payment.',
      relationships: 'PAYMENT 1 ← 1 BOOKING',
      usage: 'Not actively exposed in current basic endpoints, but established in schema.',
      professorNote: 'By placing a UNIQUE constraint on the BookingID foreign key, we transform what is normally a 1-to-Many relationship into a strict 1-to-1 relationship, ensuring a booking is only paid for once.'
    }
  ];
  
  export const CRUD = [
    {
      title: 'CREATE',
      purpose: 'Creates a new booking record when a user initiates a checkout.',
      endpoint: 'POST /api/bookings',
      table: 'BOOKING',
      sql: \`INSERT INTO BOOKING (TotalAmount, Status, CustomerID, ShowID) 
  VALUES (?, 'PENDING', ?, ?)\`
    },
    {
      title: 'READ',
      purpose: 'Fetches all shows to render the homepage movie grid.',
      endpoint: 'GET /api/shows',
      table: 'SHOW (joined with MOVIE)',
      sql: \`SELECT s.ShowID, s.ShowDate, s.ShowTime, s.Price, m.Title AS MovieTitle
  FROM \`SHOW\` s
  JOIN MOVIE m ON s.MovieID = m.MovieID\`
    },
    {
      title: 'UPDATE',
      purpose: 'Updates the booking status after a payment succeeds or fails.',
      endpoint: 'bookingService.js',
      table: 'BOOKING',
      sql: \`UPDATE BOOKING 
  SET Status = 'CONFIRMED' 
  WHERE BookingID = ?\`
    },
    {
      title: 'DELETE',
      purpose: 'Deletes an old, failed pending booking. (Cascades to BOOKING_SEAT)',
      endpoint: 'Admin / Cleanup tasks',
      table: 'BOOKING',
      sql: \`DELETE FROM BOOKING 
  WHERE Status = 'FAILED' AND BookingDate < NOW() - INTERVAL 1 DAY\`
    }
  ];

  export const QUESTIONS = [
    { q: "Why did you choose MySQL?", a: "Because a cinema booking system is highly structured. A booking inherently relies on a customer, a show, a screen, and specific seats. Relational databases enforce these relationships via Foreign Keys, ensuring we never have orphaned data (like a booked seat for a deleted show)." },
    { q: "Why did you use InnoDB?", a: "InnoDB is the default MySQL engine that supports ACID transactions and row-level locking. We rely on transactions and the 'FOR UPDATE' lock in InnoDB to prevent double bookings." },
    { q: "Why is TheatreID a primary key?", a: "It uniquely identifies a specific theatre. We use AUTO_INCREMENT so MySQL automatically manages the uniqueness without us needing to manually generate IDs." },
    { q: "Why are foreign keys required?", a: "To maintain referential integrity. A Screen cannot exist without a Theatre. If we try to insert a Screen with a fake TheatreID, the foreign key constraint will block it. It prevents corrupted, orphaned data." },
    { q: "Why does SHOW have two foreign keys?", a: "Because SHOW is the resolution of a Many-to-Many relationship between MOVIE and SCREEN. It needs to know which movie is playing, and exactly which physical screen it is playing on." },
    { q: "Why do we need BOOKING_SEAT?", a: "Because one booking can reserve multiple seats, and one seat can belong to many different bookings over time. We need a junction table to resolve this Many-to-Many relationship." },
    { q: "Why is UNIQUE (ShowID, SeatID) necessary?", a: "It is our ultimate defense against double booking. It guarantees that across the entire database, a specific physical seat can only be tied to a specific show exactly once. If two users bypass our backend locks, this constraint throws an error and prevents the duplicate." },
    { q: "Why use FOR UPDATE?", a: "It applies a pessimistic row-level lock. When User A begins their transaction, they lock the specific seat rows. If User B tries to book the same seats, MySQL forces User B to wait until User A is finished. It prevents race conditions." },
    { q: "What happens if two users book the same seat?", a: "User A's transaction locks the seat. User B's transaction waits. When User A commits, User B's transaction resumes, but fails because the seat is now taken (or throws a Unique Constraint error), and User B's transaction rolls back safely." },
    { q: "Why use a transaction?", a: "A booking requires inserting data into BOOKING and BOOKING_SEAT. If the second step fails, we don't want half a booking left in the database. Transactions guarantee Atomicity—all steps succeed, or everything is rolled back." },
    { q: "What happens when ROLLBACK executes?", a: "Any data inserted during the current transaction (like the pending BOOKING row) is instantly erased, returning the database to the exact state it was in before the transaction began." },
    { q: "Why use DECIMAL instead of FLOAT for Price?", a: "FLOAT introduces floating-point precision errors (e.g., 10.00000001) due to binary approximation. DECIMAL stores exact numeric values, which is required for financial calculations." },
    { q: "Why use ENUM?", a: "It restricts a column to a specific set of predefined string values (e.g., 'PENDING', 'CONFIRMED'). It prevents application bugs from inserting typos like 'COMFIRMED', and saves disk space." },
    { q: "Why use LEFT JOIN for seat availability?", a: "An INNER JOIN between SEAT and BOOKING_SEAT would only return seats that *have* been booked. We want to display the entire auditorium grid, so we LEFT JOIN to get *all* seats, and mark them 'AVAILABLE' if the right side of the join is NULL." },
    { q: "Why do we need indexes?", a: "To prevent full table scans. When we query 'WHERE MovieID = 5', MySQL would normally read every row in the SHOW table. An index creates a B-Tree, allowing MySQL to find the rows instantly." },
    { q: "How does React communicate with MySQL?", a: "It doesn't. React makes an HTTP request to the Express backend. The Express backend uses the mysql2 library and a connection pool to safely execute SQL queries on the database, and returns the result as JSON." },
  ];
