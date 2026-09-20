# DATABASE ARCHITECTURE & IMPLEMENTATION
**How CineTicket transforms its cinema booking model into a relational MySQL backend.**

---

## 01 — DATABASE ARCHITECTURE
The CineTicket architecture relies on a robust relational database to maintain data integrity, handle concurrent bookings, and represent complex real-world cinema operations. The flow ensures secure, transactional operations between the user interface and the underlying data layer:

1. **USER** -> Interacts with UI
2. **CINETICKET FRONTEND (REACT)** -> Validates & sends requests
3. **NODE.JS / EXPRESS BACKEND** -> Business logic & Transactions
4. **SQL QUERIES** -> Parameterized execution
5. **MYSQL DATABASE** -> Persistent storage
6. **TABLES / CONSTRAINTS** -> Data integrity enforcement

---

## 02 — FROM ER MODEL TO RELATIONAL SCHEMA
The database design started with an Entity-Relationship (ER) model encompassing all actors and objects in a cinema ecosystem. 

- **THEATRE**: Stores physical cinema locations. (PK: TheatreID) -> (1) - (M) SCREEN
- **SCREEN**: Physical auditoriums within a theatre. (PK: ScreenID) -> FK: TheatreID
- **SEAT**: Individual seats per screen. (PK: SeatID) -> FK: ScreenID
- **MOVIE**: Film metadata. (PK: MovieID) -> (1) - (M) SHOW
- **SHOW**: Schedules a Movie on a Screen. (PK: ShowID) -> FK: MovieID, ScreenID
- **CUSTOMER**: User accounts. (PK: CustomerID) -> (1) - (M) BOOKING
- **BOOKING**: A transaction record. (PK: BookingID) -> FK: CustomerID, ShowID
- **PAYMENT**: Financial transaction status. (PK: PaymentID) -> FK: BookingID

---

## 03 — DATABASE INITIALIZATION
The foundation begins by establishing the database itself. We ensure idempotency using `IF NOT EXISTS`.

```sql
CREATE DATABASE IF NOT EXISTS movie_ticket_booking;
USE movie_ticket_booking;
```

---

## 04 — TABLE CREATION (Core Entities)
Tables are created in a specific dependency order. Independent entities (like MOVIE and THEATRE) are created first.

```sql
CREATE TABLE IF NOT EXISTS MOVIE (
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
) ENGINE=InnoDB;
```

---

## 05 — TABLE CREATION (Scheduling)
Dependent entities (like SHOW) require Foreign Keys. Note the use of `ON DELETE CASCADE` to maintain referential integrity.

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

---

## 06 — FOREIGN KEYS & RELATIONSHIPS (Resolving M:N)
Relationships enforce data consistency. A crucial relationship is the Many-to-Many mapping between a Booking and a Seat. We use a junction table: `BOOKING_SEAT`.

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

---

## 07 — DATABASE CONSTRAINTS
Constraints protect the data at the schema layer:
- **PRIMARY KEY**: Uniquely identifies records (AUTO_INCREMENT).
- **FOREIGN KEY**: Enforces referential integrity.
- **NOT NULL**: Prevents empty critical data.
- **UNIQUE**: Prevents duplicates. Used heavily for concurrency (ShowID, SeatID).
- **CHECK**: Validates business logic. e.g., CHECK (Price >= 0).

---

## 08 — CRUD OPERATIONS & QUERIES
The backend executes CRUD operations based on API calls.

**CREATE (Insert Booking)**
```sql
INSERT INTO BOOKING (TotalAmount, Status, CustomerID, ShowID) VALUES (?, 'PENDING', ?, ?)
```

**READ (Select Customer Bookings)**
```sql
SELECT b.BookingID, b.BookingDate, b.TotalAmount, b.Status, m.Title
FROM BOOKING b
JOIN `SHOW` s ON b.ShowID = s.ShowID
JOIN MOVIE m ON s.MovieID = m.MovieID
WHERE b.CustomerID = ?
ORDER BY b.BookingDate DESC
```

**UPDATE (Confirm Status)**
```sql
UPDATE BOOKING SET Status = 'CONFIRMED' WHERE BookingID = ?
```

---

## 09 — RELATIONAL QUERIES & JOINS
To assemble meaningful data for the frontend, we must join tables. The `getBookingById` endpoint uses a massive 6-table INNER JOIN to retrieve a complete booking receipt.

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

---

## 10 — SEAT AVAILABILITY LOGIC
Determining seat status requires cross-referencing all seats in a screen against active bookings. We implemented a Database View (`view_show_seats`) using `LEFT JOIN` to ensure we see all seats, even unbooked ones.

```sql
CREATE OR REPLACE VIEW view_show_seats AS
SELECT 
    s.SeatID, s.SeatNumber, s.SeatType, sh.ShowID,
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

---

## 11 — TRANSACTIONS & CONCURRENCY CONTROL
If two users try to book the same seat at the exact same millisecond, a race condition occurs. To prevent double bookings, CineTicket uses **Row-Level Locking** via `FOR UPDATE` within a transaction.

Transactions ensure that either all database changes succeed, or none do. 

```sql
START TRANSACTION;

-- 1. User A's backend executes an exclusive lock on the requested seats:
SELECT SeatID FROM SEAT 
WHERE SeatID IN (?) AND ScreenID = ? 
FOR UPDATE; 
-- If User B requests the same seats, their transaction pauses and WAITS here.

-- 2. Insert Booking
INSERT INTO BOOKING ...

-- 3. Insert Booking Seats
INSERT INTO BOOKING_SEAT ...

-- 4. Update Status
UPDATE BOOKING SET Status = 'CONFIRMED' ...

-- 5. COMMIT (or ROLLBACK if any step fails)
COMMIT; 
```

**UNIQUE CONSTRAINT AS FINAL DEFENSE**
If code-level logic fails, the database schema provides a final impenetrable defense. The `UNIQUE (ShowID, SeatID)` constraint in `BOOKING_SEAT` guarantees that MySQL will reject any duplicate insertions with an `ER_DUP_ENTRY` error.

---

## 12 — ACID PROPERTIES & INDEXING
**ACID Properties**
- **ATOMICITY**: A booking and its seat assignments succeed together or fail together via Transactions.
- **CONSISTENCY**: Foreign Keys and Constraints ensure invalid relationships cannot exist.
- **ISOLATION**: Row-level locking ensures concurrent bookings do not interfere with each other.
- **DURABILITY**: Once committed, booking records are permanently stored in the Aiven MySQL cluster.

**Indexing**
To optimize query performance and prevent full-table scans during heavy read operations, indexes were added to frequently filtered columns and Foreign Keys.

```sql
CREATE INDEX idx_show_movie ON `SHOW`(MovieID);
CREATE INDEX idx_booking_customer ON BOOKING(CustomerID);
CREATE INDEX idx_booking_seat_show_seat ON BOOKING_SEAT(ShowID, SeatID);
```

---

## 13 — NODE.JS ↔ MYSQL INTEGRATION
The backend communicates with the database using the `mysql2/promise` connection pool. This is highly efficient and utilizes **Parameterized Queries** to prevent SQL Injection attacks.

```javascript
// From backend/src/config/db.js
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
    'SELECT * FROM `SHOW` WHERE ShowID = ?', 
    [showId] // Variable safely injected by mysql2
);
```
