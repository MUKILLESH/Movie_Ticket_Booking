# DBMS Explanation

This document outlines the core Database Management System concepts implemented in this project.

## 1. Database Architecture & ER Model
The system uses a relational model with the following core entities:
- `THEATRE` (1) - (M) `SCREEN`
- `SCREEN` (1) - (M) `SEAT`
- `MOVIE` (1) - (M) `SHOW`
- `SCREEN` (1) - (M) `SHOW`
- `CUSTOMER` (1) - (M) `BOOKING`
- `SHOW` (1) - (M) `BOOKING`

### The M:N Relationship (Booking <-> Seat)
A booking can contain multiple seats, and over time, a seat can belong to multiple bookings (for different shows). This Many-to-Many relationship is resolved using the junction table `BOOKING_SEAT`.

## 2. Preventing Double Booking (Concurrency Control)
The most critical DBMS aspect of this project is ensuring that two users cannot book the same seat for the same show simultaneously.

### Solution 1: Database Constraints (The Final Defense)
In `BOOKING_SEAT`, we defined:
\`\`\`sql
UNIQUE (ShowID, SeatID)
\`\`\`
This constraint ensures that at the database level, a specific seat can only ever exist once for a specific show. If concurrent transactions attempt an insert, MySQL will throw an `ER_DUP_ENTRY` error.

### Solution 2: Transactions and Row-Level Locking
When a booking is initiated, the backend starts a MySQL Transaction:
1. `START TRANSACTION;`
2. `SELECT SeatID FROM SEAT WHERE SeatID IN (...) FOR UPDATE;`
   - The `FOR UPDATE` clause places an exclusive lock on the specific rows being read. If User B tries to book the same seats, their transaction will pause and wait for User A's transaction to finish.
3. If the seats are available, `INSERT` into `BOOKING` and `BOOKING_SEAT`.
4. `COMMIT;` (or `ROLLBACK;` if an error occurs).

## 3. Rate Limiting vs Queueing vs Transactions
To explain during the viva:
- **Rate Limiting (Express Middleware)**: Stops a single IP address from sending too many requests to the server (e.g., 10 bookings per 5 mins). Protects the *Server/Network*.
- **Queueing (p-queue)**: Organizes valid incoming requests for a specific show into a line. Ensures they are processed one by one. Protects the *Database* from lock contention and deadlocks.
- **Transactions (MySQL)**: Guarantees that the sequence of SQL operations (checking seats, deducting money, inserting booking) either fully succeeds or fully fails (Atomicity). Protects the *Data Integrity*.

## 4. Best Contiguous Seat Algorithm
The recommendation algorithm groups available seats by row, sorts them, and finds continuous sequences matching the requested group size. It then scores these sequences based on how close their center is to the absolute center of the row, returning the lowest (best) score.

## 5. Indexing
Indexes were created on foreign keys (e.g., `idx_show_movie`, `idx_booking_customer`) to speed up JOIN operations, which are heavily used in our Views and availability queries.
