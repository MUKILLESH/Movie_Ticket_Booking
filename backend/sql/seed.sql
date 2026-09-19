USE movie_ticket_booking;

-- Disable foreign key checks for seeding
SET FOREIGN_KEY_CHECKS = 0;

-- Clear existing data
TRUNCATE TABLE PAYMENT;
TRUNCATE TABLE BOOKING_SEAT;
TRUNCATE TABLE BOOKING;
TRUNCATE TABLE `SHOW`;
TRUNCATE TABLE CUSTOMER;
TRUNCATE TABLE MOVIE;
TRUNCATE TABLE SEAT;
TRUNCATE TABLE SCREEN;
TRUNCATE TABLE THEATRE;

SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Theatres
INSERT INTO THEATRE (Name, Location, City) VALUES
('PVR Cinemas', 'VR Mall, Anna Nagar', 'Chennai'),
('INOX', 'Marina Mall, OMR', 'Chennai'),
('Cinepolis', 'BSR Mall, OMR', 'Chennai');

-- 2. Insert Screens
INSERT INTO SCREEN (ScreenNumber, SeatCapacity, TheatreID) VALUES
('Screen 1', 50, 1),
('Screen 2', 50, 1),
('Screen 1', 50, 2),
('Screen 2', 50, 2),
('Screen 1', 50, 3);

-- 3. Insert Seats
-- Using a stored procedure purely to generate the seats efficiently for the sample data
DELIMITER //
CREATE PROCEDURE GenerateSeats()
BEGIN
    DECLARE screen_id INT;
    DECLARE row_char CHAR(1);
    DECLARE seat_num INT;
    DECLARE seat_type VARCHAR(10);
    
    DECLARE screen_cursor CURSOR FOR SELECT ScreenID FROM SCREEN;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET @done = 1;

    SET @done = 0;
    OPEN screen_cursor;

    read_loop: LOOP
        FETCH screen_cursor INTO screen_id;
        IF @done THEN
            LEAVE read_loop;
        END IF;

        -- Generate 5 rows (A-E), 10 seats per row = 50 seats
        SET @row_idx = 0;
        WHILE @row_idx < 5 DO
            SET row_char = CHAR(65 + @row_idx); -- A, B, C, D, E
            
            -- Row A-C: REGULAR, Row D: PREMIUM, Row E: VIP
            IF @row_idx < 3 THEN
                SET seat_type = 'REGULAR';
            ELSEIF @row_idx = 3 THEN
                SET seat_type = 'PREMIUM';
            ELSE
                SET seat_type = 'VIP';
            END IF;

            SET seat_num = 1;
            WHILE seat_num <= 10 DO
                INSERT INTO SEAT (SeatNumber, SeatType, ScreenID) 
                VALUES (CONCAT(row_char, seat_num), seat_type, screen_id);
                SET seat_num = seat_num + 1;
            END WHILE;

            SET @row_idx = @row_idx + 1;
        END WHILE;
    END LOOP;

    CLOSE screen_cursor;
END //
DELIMITER ;

CALL GenerateSeats();
DROP PROCEDURE GenerateSeats;

-- 4. Insert Movies
INSERT INTO MOVIE (Title, Genre, Language, Duration, ReleaseDate) VALUES
('Inception', 'Sci-Fi', 'English', 148, '2010-07-16'),
('Interstellar', 'Sci-Fi', 'English', 169, '2014-11-07'),
('The Dark Knight', 'Action', 'English', 152, '2008-07-18'),
('Parasite', 'Thriller', 'Korean', 132, '2019-05-30'),
('RRR', 'Action', 'Telugu', 187, '2022-03-24'),
('Baahubali', 'Action', 'Telugu', 159, '2015-07-10'),
('KGF', 'Action', 'Kannada', 155, '2018-12-21'),
('Avatar', 'Sci-Fi', 'English', 162, '2009-12-18');

-- 5. Insert Shows
-- Creating some shows for today and tomorrow
INSERT INTO `SHOW` (ShowDate, ShowTime, Price, MovieID, ScreenID) VALUES
(CURDATE(), '10:00:00', 150.00, 1, 1),
(CURDATE(), '14:00:00', 200.00, 2, 1),
(CURDATE(), '18:00:00', 250.00, 3, 1),
(CURDATE(), '21:30:00', 250.00, 5, 1),

(CURDATE(), '11:00:00', 150.00, 4, 2),
(CURDATE(), '15:00:00', 200.00, 5, 2),
(CURDATE(), '19:00:00', 250.00, 6, 2),

(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 150.00, 1, 1),
(DATE_ADD(CURDATE(), INTERVAL 1 DAY), '18:00:00', 250.00, 7, 2);

-- 6. Insert Customers (Password is 'password123' hashed using bcrypt 10 rounds)
INSERT INTO CUSTOMER (Name, Email, Phone, Password) VALUES
('John Doe', 'john@example.com', '9876543210', '$2b$10$EP/f5q1.K7GZp7qD52T34.1/sX2p4Z.q5oD1/oZqC/Q0pZq9.0Z.K'),
('Jane Smith', 'jane@example.com', '9876543211', '$2b$10$EP/f5q1.K7GZp7qD52T34.1/sX2p4Z.q5oD1/oZqC/Q0pZq9.0Z.K'),
('Alice Brown', 'alice@example.com', '9876543212', '$2b$10$EP/f5q1.K7GZp7qD52T34.1/sX2p4Z.q5oD1/oZqC/Q0pZq9.0Z.K');

-- 7. Insert Bookings & Booking Seats
-- Let's book some seats for ShowID = 1 (Screen 1, 50 seats available)
-- John Doe books A1, A2
INSERT INTO BOOKING (BookingDate, TotalAmount, Status, CustomerID, ShowID) VALUES (NOW(), 300.00, 'CONFIRMED', 1, 1);
SET @booking_id_1 = LAST_INSERT_ID();
INSERT INTO BOOKING_SEAT (BookingID, ShowID, SeatID) 
SELECT @booking_id_1, 1, SeatID FROM SEAT WHERE ScreenID = 1 AND SeatNumber IN ('A1', 'A2');
INSERT INTO PAYMENT (Amount, PaymentMode, PaymentStatus, BookingID) VALUES (300.00, 'UPI', 'SUCCESS', @booking_id_1);

-- Jane Smith books A4, A5, A6 for the same show
INSERT INTO BOOKING (BookingDate, TotalAmount, Status, CustomerID, ShowID) VALUES (NOW(), 450.00, 'CONFIRMED', 2, 1);
SET @booking_id_2 = LAST_INSERT_ID();
INSERT INTO BOOKING_SEAT (BookingID, ShowID, SeatID) 
SELECT @booking_id_2, 1, SeatID FROM SEAT WHERE ScreenID = 1 AND SeatNumber IN ('A4', 'A5', 'A6');
INSERT INTO PAYMENT (Amount, PaymentMode, PaymentStatus, BookingID) VALUES (450.00, 'CARD', 'SUCCESS', @booking_id_2);

-- Alice Brown books E5, E6 (VIP) for ShowID = 2
INSERT INTO BOOKING (BookingDate, TotalAmount, Status, CustomerID, ShowID) VALUES (NOW(), 600.00, 'CONFIRMED', 3, 2);
SET @booking_id_3 = LAST_INSERT_ID();
INSERT INTO BOOKING_SEAT (BookingID, ShowID, SeatID) 
SELECT @booking_id_3, 2, SeatID FROM SEAT WHERE ScreenID = 1 AND SeatNumber IN ('E5', 'E6');
INSERT INTO PAYMENT (Amount, PaymentMode, PaymentStatus, BookingID) VALUES (600.00, 'NET_BANKING', 'SUCCESS', @booking_id_3);
