# Movie Ticket Booking Management System

A comprehensive College DBMS Project built using Node.js, Express, MySQL, and React. 
This project heavily focuses on robust Database Management System (DBMS) principles, including relational design, transactions, row-level locking, and concurrency control.

## Setup Instructions

### 1. Install Dependencies
You need Node.js and MySQL installed on your system.

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Database Setup
1. Log in to your MySQL client (e.g., MySQL Workbench or CLI).
2. Execute the `backend/sql/schema.sql` file to create the database (`movie_ticket_booking`) and tables.
3. Execute the `backend/sql/seed.sql` file to insert sample theatres, screens, seats, movies, and shows.
4. Review `backend/sql/queries.sql` for the viva demonstration queries.

### 3. Environment Configuration
Create a `.env` file in the `backend` directory based on `.env.example`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=movie_ticket_booking
PORT=5000
```

### 4. Start the Application

**Start Backend (Port 5000):**
```bash
cd backend
node src/server.js
```

**Start Frontend (Port 5173):**
```bash
cd frontend
npm run dev
```

The frontend will be accessible at `http://localhost:5173`.

## Features Demonstrated
- **ACID Transactions**: Atomic booking operations that guarantee data integrity.
- **Concurrency Control**: Prevents double-booking using `SELECT ... FOR UPDATE` and unique composite constraints (`UNIQUE(ShowID, SeatID)`).
- **Relational Integrity**: Strict foreign key constraints and cascading deletes.
- **Queueing**: A FIFO queue to serialize requests hitting the same show, preventing database deadlock scenarios under high load.
- **Rate Limiting**: Protection against spam/DDoS via `express-rate-limit`.
- **Advanced Algorithms**: Contiguous seat grouping and scoring based on screen-center proximity.
