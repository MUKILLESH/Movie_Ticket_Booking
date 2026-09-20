# COMPLETE DBMS BACKEND IMPLEMENTATION REPORT
**CineTicket: Cinema Booking System**

This report documents the exact SQL database architecture, relationships, queries, and concurrency control mechanisms implemented in the CineTicket Node.js/MySQL backend. Every SQL block presented here is directly sourced from the project's codebase.

---

## 1. DATABASE CREATION

### Exact SQL Code Used
```sql
CREATE DATABASE IF NOT EXISTS movie_ticket_booking;
USE movie_ticket_booking;
```

### Explanation
- **`CREATE DATABASE`**: Instantiates a new database schema in the MySQL server.
- **`IF NOT EXISTS`**: Prevents execution errors if the database was already created in a previous deployment.
- **`USE movie_ticket_booking;`**: Sets this specific database as the active context for all subsequent table creations and data operations.

### Integration
- **How the backend calls it**: This is executed once during initial deployment via the `scratch/migrate.js` script connecting to the Aiven Cloud database.
- **Result**: Prepares the schema to accept table definitions.

---

## 2. TABLE DEFINITIONS

### TABLE 1 — THEATRE

#### Purpose
Stores physical cinema locations where movies can be screened.

#### Exact SQL used
```sql
CREATE TABLE IF NOT EXISTS THEATRE (
    TheatreID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Location VARCHAR(255) NOT NULL,
    City VARCHAR(100) NOT NULL
) ENGINE=InnoDB;
```
#### Detailed Breakdown
1. **`TheatreID INT AUTO_INCREMENT PRIMARY KEY`**: Creates a unique integer identifier that automatically increments. Crucial for establishing relationships.
2. **`Name / Location / City VARCHAR NOT NULL`**: Ensures text data is stored up to specific character limits and prevents empty (NULL) values for essential business data.
3. **`ENGINE=InnoDB`**: Explicitly sets the storage engine to InnoDB, which is required to support ACID transactions and row-level locking later in the booking process.

#### Integration
- **Backend**: Retrieved via `pool.query('SELECT * FROM THEATRE');` in `theatreController.js`.
- **Frontend**: Not currently exposed directly to UI, but used in JOIN queries for booking receipts.

---

### TABLE 2 — SCREEN

#### Purpose
Represents individual auditoriums inside a theatre.

#### Exact SQL used
```sql
CREATE TABLE IF NOT EXISTS SCREEN (
    ScreenID INT AUTO_INCREMENT PRIMARY KEY,
    ScreenNumber VARCHAR(20) NOT NULL,
    SeatCapacity INT NOT NULL CHECK (SeatCapacity > 0),
    TheatreID INT NOT NULL,
    FOREIGN KEY (TheatreID) REFERENCES THEATRE(TheatreID) ON DELETE CASCADE
) ENGINE=InnoDB;
```
#### Detailed Breakdown
1. **`SeatCapacity INT NOT NULL CHECK (SeatCapacity > 0)`**: Uses a `CHECK` constraint to enforce business logic at the database layer (a screen cannot have 0 or negative seats).
2. **`TheatreID INT NOT NULL`**: A scalar column to hold the reference to the parent theatre.
3. **`FOREIGN KEY ... REFERENCES THEATRE(TheatreID)`**: Enforces referential integrity. Ensures a screen cannot exist without a valid theatre.
4. **`ON DELETE CASCADE`**: If a theatre is deleted, all its screens are automatically deleted by the database, preventing orphaned records.

---

### TABLE 3 — MOVIE

#### Purpose
Stores metadata about the films.

#### Exact SQL used
```sql
CREATE TABLE IF NOT EXISTS MOVIE (
    MovieID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Genre VARCHAR(100),
    Language VARCHAR(50),
    Duration INT NOT NULL CHECK (Duration > 0),
    ReleaseDate DATE
) ENGINE=InnoDB;
```
#### Integration
- **Backend Call**: `pool.query('SELECT * FROM MOVIE');` inside `movieController.js`.
- **Frontend Result**: Renders the movie cards on the Home page.

---

### TABLE 4 — SHOW (SHOW_SCHEDULE)

#### Purpose
Resolves the Many-to-Many relationship between `MOVIE` and `SCREEN`. A show represents a specific movie playing on a specific screen at a specific time.

#### Exact SQL used
```sql
CREATE TABLE IF NOT EXISTS `SHOW` (
    ShowID INT AUTO_INCREMENT PRIMARY KEY,
    ShowDate DATE NOT NULL,
    ShowTime TIME NOT NULL,
    Price DECIMAL(10, 2) NOT NULL CHECK (Price >= 0),
    MovieID INT NOT NULL,
    ScreenID INT NOT NULL,
    FOREIGN KEY (MovieID) REFERENCES MOVIE(MovieID) ON DELETE CASCADE,
    FOREIGN KEY (ScreenID) REFERENCES SCREEN(ScreenID) ON DELETE CASCADE
) ENGINE=InnoDB;
```
#### Detailed Breakdown
1. **`Price DECIMAL(10, 2)`**: Uses `DECIMAL` instead of `FLOAT` to ensure exact precision for monetary values (10 digits total, 2 decimal places).
2. **Multiple Foreign Keys**: Connects this schedule record to both the `MOVIE` and `SCREEN` entities.

---

### TABLE 5 — SEAT

#### Purpose
Represents an individual physical seat inside a screen.

#### Exact SQL used
```sql
CREATE TABLE IF NOT EXISTS SEAT (
    SeatID INT AUTO_INCREMENT PRIMARY KEY,
    SeatNumber VARCHAR(10) NOT NULL,
    SeatType ENUM('REGULAR', 'PREMIUM', 'VIP') NOT NULL DEFAULT 'REGULAR',
    ScreenID INT NOT NULL,
    FOREIGN KEY (ScreenID) REFERENCES SCREEN(ScreenID) ON DELETE CASCADE,
    UNIQUE (ScreenID, SeatNumber)
) ENGINE=InnoDB;
```
#### Detailed Breakdown
1. **`SeatType ENUM(...)`**: Restricts the column value to a specific set of allowed strings, saving space and preventing invalid seat types.
2. **`UNIQUE (ScreenID, SeatNumber)`**: A composite unique constraint. Guarantees that "Seat A1" can only be created once per screen.

---

### TABLE 6 — CUSTOMER

#### Purpose
Stores user account details.

#### Exact SQL used
```sql
CREATE TABLE IF NOT EXISTS CUSTOMER (
    CustomerID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Phone VARCHAR(20),
    Password VARCHAR(255) NOT NULL
) ENGINE=InnoDB;
```
#### Detailed Breakdown
1. **`Email ... UNIQUE`**: Prevents multiple users from registering with the same email address.

---

### TABLE 7 — BOOKING

#### Purpose
Records the overarching transaction of a user booking tickets for a show.

#### Exact SQL used
```sql
CREATE TABLE IF NOT EXISTS BOOKING (
    BookingID INT AUTO_INCREMENT PRIMARY KEY,
    BookingDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TotalAmount DECIMAL(10, 2) NOT NULL CHECK (TotalAmount >= 0),
    Status ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    CustomerID INT NOT NULL,
    ShowID INT NOT NULL,
    FOREIGN KEY (CustomerID) REFERENCES CUSTOMER(CustomerID) ON DELETE CASCADE,
    FOREIGN KEY (ShowID) REFERENCES `SHOW`(ShowID) ON DELETE CASCADE
) ENGINE=InnoDB;
```
#### Detailed Breakdown
1. **`BookingDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP`**: Automatically records the exact server time when the row is inserted without the Node.js backend needing to provide a date string.
2. **`Status ENUM(...)`**: Tracks the transaction lifecycle state.

---

### TABLE 8 — BOOKING_SEAT (Junction Table)

#### Purpose
Resolves the Many-to-Many relationship between `BOOKING` and `SEAT`. Crucial for concurrency control.

#### Exact SQL used
```sql
CREATE TABLE IF NOT EXISTS BOOKING_SEAT (
    BookingID INT NOT NULL,
    ShowID INT NOT NULL,
    SeatID INT NOT NULL,
    PRIMARY KEY (BookingID, SeatID),
    FOREIGN KEY (BookingID) REFERENCES BOOKING(BookingID) ON DELETE CASCADE,
    FOREIGN KEY (ShowID) REFERENCES `SHOW`(ShowID) ON DELETE CASCADE,
    FOREIGN KEY (SeatID) REFERENCES SEAT(SeatID) ON DELETE CASCADE,
    UNIQUE (ShowID, SeatID)
) ENGINE=InnoDB;
```
#### Detailed Breakdown
1. **`PRIMARY KEY (BookingID, SeatID)`**: A composite primary key. A booking cannot reserve the exact same seat twice.
2. **`UNIQUE (ShowID, SeatID)`**: **The Ultimate Concurrency Defense.** This guarantees that across the entire database, a specific seat can only ever be mapped to a specific show exactly once. If a race condition bypasses application logic, MySQL will throw an `ER_DUP_ENTRY` error here, preventing a double booking.

---

### TABLE 9 — PAYMENT

#### Purpose
Tracks financial transactions related to a booking.

#### Exact SQL used
```sql
CREATE TABLE IF NOT EXISTS PAYMENT (
    PaymentID INT AUTO_INCREMENT PRIMARY KEY,
    Amount DECIMAL(10, 2) NOT NULL CHECK (Amount >= 0),
    PaymentMode ENUM('UPI', 'CARD', 'NET_BANKING') NOT NULL,
    PaymentStatus ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
    BookingID INT NOT NULL UNIQUE,
    TransactionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (BookingID) REFERENCES BOOKING(BookingID) ON DELETE CASCADE
) ENGINE=InnoDB;
```
#### Detailed Breakdown
1. **`BookingID INT NOT NULL UNIQUE`**: Enforces a strictly 1-to-1 relationship. One booking can only have one payment record.

---

## 3. INDEXES FOR PERFORMANCE

### Purpose
To prevent full-table scans during heavy read operations.

### Exact SQL used
```sql
CREATE INDEX idx_show_movie ON `SHOW`(MovieID);
CREATE INDEX idx_show_screen ON `SHOW`(ScreenID);
CREATE INDEX idx_show_date ON `SHOW`(ShowDate);
CREATE INDEX idx_booking_customer ON BOOKING(CustomerID);
CREATE INDEX idx_booking_show ON BOOKING(ShowID);
CREATE INDEX idx_booking_seat_show_seat ON BOOKING_SEAT(ShowID, SeatID);
```
### Why it is used
Relational databases rely heavily on `JOIN` and `WHERE` clauses. Without indexes, MySQL must read every single row in the `SHOW` table to find shows for a specific `MovieID`. Indexes create a B-Tree lookup structure, reducing lookup time from O(N) to O(log N).

---

## 4. SEAT AVAILABILITY (VIEWS & JOINS)

### Purpose
To calculate which seats are booked and which are available for a specific show by joining the `SEAT`, `SHOW`, `BOOKING_SEAT`, and `BOOKING` tables.

### Exact SQL used
```sql
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
JOIN `SHOW` sh ON s.ScreenID = sh.ScreenID
LEFT JOIN BOOKING_SEAT bs ON s.SeatID = bs.SeatID AND sh.ShowID = bs.ShowID
LEFT JOIN BOOKING b ON bs.BookingID = b.BookingID;
```
### Detailed Breakdown
1. **`CREATE OR REPLACE VIEW`**: Creates a virtual table. The application queries this exactly like a normal table, but MySQL dynamically executes the underlying joins.
2. **`LEFT JOIN BOOKING_SEAT bs`**: This is critical. An `INNER JOIN` would only return seats that *have* been booked. A `LEFT JOIN` returns *all* physical seats in the screen, and attaches booking data if it exists (leaving it `NULL` if the seat is unbooked).
3. **`CASE WHEN bs.SeatID IS NULL THEN 'AVAILABLE'`**: Evaluates the result of the `LEFT JOIN`. If no booking junction record exists, the seat is available.

### Integration
- **Backend Call**: Called in `seatController.js` via `pool.query('SELECT SeatID, SeatNumber, SeatType, Price, Status FROM view_show_seats WHERE ShowID = ?', [showId])`.
- **Frontend Result**: Renders the red (booked) and white (available) seat grid in the React UI.

---

## 5. COMPLEX RELATIONAL QUERY (6-Table JOIN)

### Purpose
To fetch a complete, human-readable booking receipt.

### Exact SQL used
```sql
SELECT b.BookingID, b.BookingDate, b.TotalAmount, b.Status, c.Name as CustomerName,
       s.ShowDate, s.ShowTime, m.Title as MovieTitle, t.Name as TheatreName, sc.ScreenNumber
FROM BOOKING b
JOIN CUSTOMER c ON b.CustomerID = c.CustomerID
JOIN `SHOW` s ON b.ShowID = s.ShowID
JOIN MOVIE m ON s.MovieID = m.MovieID
JOIN SCREEN sc ON s.ScreenID = sc.ScreenID
JOIN THEATRE t ON sc.TheatreID = t.TheatreID
WHERE b.BookingID = ?
```
### Why it is used
The `BOOKING` table only contains integer IDs (ShowID, CustomerID). To show the user the Movie Title, Theatre Name, and Screen Number, we must trace the foreign keys all the way up the relational chain using `INNER JOIN`s.

### Integration
- **Backend Call**: Called in `bookingController.js` inside `getBookingById`.
- **Frontend Result**: Displays the final digital ticket on the `BookingConfirmation.jsx` page.

---

## 6. CONCURRENCY & TRANSACTIONS (Preventing Double Booking)

### Purpose
To guarantee that two users attempting to book the exact same seat at the exact same millisecond do not cause a double-booking or corrupt data.

### Exact Backend Implementation (`bookingService.js`)

#### Step 1: Start Transaction
```javascript
const connection = await pool.getConnection();
await connection.beginTransaction();
```
- **What it does**: Begins a MySQL transaction. Any subsequent SQL executes in isolation and is not permanently saved until explicitly committed.

#### Step 2: Row-Level Locking (Pessimistic Lock)
```javascript
const [seats] = await connection.query(
    'SELECT SeatID, SeatType FROM SEAT WHERE SeatID IN (?) AND ScreenID = ? FOR UPDATE',
    [seatIds, show.ScreenID]
);
```
- **What it does**: The `FOR UPDATE` clause places an exclusive lock on the specific seat rows being queried.
- **Why it matters**: If User B attempts this exact same query while User A's transaction is active, MySQL forces User B's thread to pause and wait. This prevents race conditions at the database level.

#### Step 3: Insert Records
```javascript
// 1. Insert Booking
const [bookingResult] = await connection.query(
    'INSERT INTO BOOKING (TotalAmount, Status, CustomerID, ShowID) VALUES (?, ?, ?, ?)',
    [totalAmount, 'PENDING', customerId, showId]
);
const bookingId = bookingResult.insertId;

// 2. Insert Junction Records
const bookingSeatValues = seatIds.map(seatId => [bookingId, showId, seatId]);
await connection.query(
    'INSERT INTO BOOKING_SEAT (BookingID, ShowID, SeatID) VALUES ?',
    [bookingSeatValues]
);
```
- **What it does**: Inserts the parent booking, gets the generated ID, and bulk-inserts the many-to-many relationships.

#### Step 4: Commit or Rollback
```javascript
try {
    // ... update status to CONFIRMED
    await connection.commit();
} catch (error) {
    await connection.rollback();
    throw error;
}
```
- **What it does**: If all queries succeed, `COMMIT` persists them permanently. If any step fails (e.g., the `UNIQUE` constraint triggers because someone else booked it), the catch block triggers `ROLLBACK`, erasing the partial booking and ensuring database consistency (Atomicity).
