USE movie_ticket_booking;

-- 1. List all movies.
SELECT * FROM MOVIE;

-- 2. Find movies by genre.
SELECT * FROM MOVIE WHERE Genre = 'Action';

-- 3. Find all shows for a movie.
SELECT s.ShowID, s.ShowDate, s.ShowTime, s.Price, m.Title, sc.ScreenNumber, t.Name AS Theatre
FROM `SHOW` s
JOIN MOVIE m ON s.MovieID = m.MovieID
JOIN SCREEN sc ON s.ScreenID = sc.ScreenID
JOIN THEATRE t ON sc.TheatreID = t.TheatreID
WHERE m.Title = 'Inception';

-- 4. Find shows for a theatre.
SELECT s.ShowID, m.Title, s.ShowDate, s.ShowTime
FROM `SHOW` s
JOIN SCREEN sc ON s.ScreenID = sc.ScreenID
JOIN THEATRE t ON sc.TheatreID = t.TheatreID
JOIN MOVIE m ON s.MovieID = m.MovieID
WHERE t.Name = 'PVR Cinemas';

-- 5. Show available seats (Using our View for ShowID = 1).
SELECT * FROM view_show_seats WHERE ShowID = 1 AND Status = 'AVAILABLE';

-- 6. Show booked seats (Using our View for ShowID = 1).
SELECT * FROM view_show_seats WHERE ShowID = 1 AND Status = 'BOOKED';

-- 7. Find bookings for a customer.
SELECT b.BookingID, b.BookingDate, b.TotalAmount, b.Status, m.Title, s.ShowDate, s.ShowTime
FROM BOOKING b
JOIN `SHOW` s ON b.ShowID = s.ShowID
JOIN MOVIE m ON s.MovieID = m.MovieID
WHERE b.CustomerID = 1;

-- 8. Find booking details with movie + theatre + screen.
SELECT b.BookingID, c.Name AS CustomerName, m.Title, t.Name AS Theatre, sc.ScreenNumber, GROUP_CONCAT(st.SeatNumber) AS Seats, b.TotalAmount
FROM BOOKING b
JOIN CUSTOMER c ON b.CustomerID = c.CustomerID
JOIN `SHOW` s ON b.ShowID = s.ShowID
JOIN MOVIE m ON s.MovieID = m.MovieID
JOIN SCREEN sc ON s.ScreenID = sc.ScreenID
JOIN THEATRE t ON sc.TheatreID = t.TheatreID
JOIN BOOKING_SEAT bs ON b.BookingID = bs.BookingID
JOIN SEAT st ON bs.SeatID = st.SeatID
GROUP BY b.BookingID;

-- 9. Calculate total revenue.
SELECT SUM(TotalAmount) AS TotalRevenue FROM BOOKING WHERE Status = 'CONFIRMED';

-- 10. Calculate revenue by movie.
SELECT m.Title, SUM(b.TotalAmount) AS Revenue
FROM BOOKING b
JOIN `SHOW` s ON b.ShowID = s.ShowID
JOIN MOVIE m ON s.MovieID = m.MovieID
WHERE b.Status = 'CONFIRMED'
GROUP BY m.MovieID
ORDER BY Revenue DESC;

-- 11. Calculate revenue by theatre.
SELECT t.Name AS Theatre, SUM(b.TotalAmount) AS Revenue
FROM BOOKING b
JOIN `SHOW` s ON b.ShowID = s.ShowID
JOIN SCREEN sc ON s.ScreenID = sc.ScreenID
JOIN THEATRE t ON sc.TheatreID = t.TheatreID
WHERE b.Status = 'CONFIRMED'
GROUP BY t.TheatreID
ORDER BY Revenue DESC;

-- 12. Find most-booked movies.
SELECT m.Title, COUNT(bs.SeatID) AS TicketsSold
FROM MOVIE m
JOIN `SHOW` s ON m.MovieID = s.MovieID
JOIN BOOKING b ON s.ShowID = b.ShowID
JOIN BOOKING_SEAT bs ON b.BookingID = bs.BookingID
WHERE b.Status = 'CONFIRMED'
GROUP BY m.MovieID
ORDER BY TicketsSold DESC;

-- 13. Find screen occupancy for a specific show.
SELECT 
    sc.SeatCapacity,
    COUNT(bs.SeatID) AS BookedSeats,
    (COUNT(bs.SeatID) / sc.SeatCapacity) * 100 AS OccupancyPercentage
FROM `SHOW` s
JOIN SCREEN sc ON s.ScreenID = sc.ScreenID
LEFT JOIN BOOKING_SEAT bs ON s.ShowID = bs.ShowID
WHERE s.ShowID = 1
GROUP BY s.ShowID;

-- 14. Find shows with highest bookings.
SELECT s.ShowID, m.Title, s.ShowDate, s.ShowTime, COUNT(bs.SeatID) AS TicketsSold
FROM `SHOW` s
JOIN MOVIE m ON s.MovieID = m.MovieID
LEFT JOIN BOOKING_SEAT bs ON s.ShowID = bs.ShowID
GROUP BY s.ShowID
ORDER BY TicketsSold DESC;

-- 15. Find available contiguous seats (Demonstrated largely via JS algorithm, but here's a basic SQL example for adjacent seats in the same row)
SELECT s1.SeatNumber AS Seat1, s2.SeatNumber AS Seat2
FROM view_show_seats s1
JOIN view_show_seats s2 ON s1.ShowID = s2.ShowID 
    AND SUBSTRING(s1.SeatNumber, 1, 1) = SUBSTRING(s2.SeatNumber, 1, 1) 
    AND CAST(SUBSTRING(s1.SeatNumber, 2) AS UNSIGNED) + 1 = CAST(SUBSTRING(s2.SeatNumber, 2) AS UNSIGNED)
WHERE s1.ShowID = 1 AND s1.Status = 'AVAILABLE' AND s2.Status = 'AVAILABLE';

-- 16. Demonstrate JOINs (Already used heavily above, this is a 4-table join)
SELECT c.Name, b.BookingDate, p.PaymentMode, p.PaymentStatus
FROM CUSTOMER c
INNER JOIN BOOKING b ON c.CustomerID = b.CustomerID
LEFT JOIN PAYMENT p ON b.BookingID = p.BookingID;

-- 17. Demonstrate GROUP BY (Count of seats by Type)
SELECT SeatType, COUNT(*) AS TotalSeats
FROM SEAT
GROUP BY SeatType;

-- 18. Demonstrate HAVING (Theatres with more than 1 screen)
SELECT t.Name, COUNT(sc.ScreenID) AS ScreenCount
FROM THEATRE t
JOIN SCREEN sc ON t.TheatreID = sc.TheatreID
GROUP BY t.TheatreID
HAVING ScreenCount > 1;

-- 19. Demonstrate subquery (Find customers who made a booking > 400 amount)
SELECT Name, Email 
FROM CUSTOMER 
WHERE CustomerID IN (
    SELECT CustomerID FROM BOOKING WHERE TotalAmount > 400
);

-- 20. Demonstrate transaction (Pseudocode representing the application logic)
/*
START TRANSACTION;
SELECT * FROM BOOKING_SEAT WHERE ShowID = 1 AND SeatID = 15 FOR UPDATE;
-- Check if it exists, if not, proceed
INSERT INTO BOOKING (CustomerID, ShowID, TotalAmount) VALUES (1, 1, 150.00);
SET @booking_id = LAST_INSERT_ID();
INSERT INTO BOOKING_SEAT (BookingID, ShowID, SeatID) VALUES (@booking_id, 1, 15);
COMMIT; -- OR ROLLBACK if seat is already booked
*/
