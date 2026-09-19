# Testing Guide

This project focuses on robust backend DBMS logic. Use the frontend or API testing tools (Postman/cURL) to verify the following scenarios.

## 1. Normal Booking Flow (Success)
- **Action**: Navigate to Home -> Select Movie -> Select Show -> Select 2 Available Seats -> Confirm Booking.
- **Expected Result**: Success page is shown. The database `BOOKING` table has a new record with status `CONFIRMED`. `BOOKING_SEAT` has 2 new records. `PAYMENT` has a new record.

## 2. Seat Availability Updates
- **Action**: After completing Test 1, go back to the exact same show's seat map.
- **Expected Result**: The seats booked in Test 1 should now be greyed out / marked as `BOOKED` and unclickable.

## 3. Best Contiguous Seat Recommendation
- **Action**: On the seat map, enter Group Size = 4 and click "Find Best Seats".
- **Expected Result**: The algorithm should highlight 4 adjacent seats. It should prioritize seats closer to the center of the screen/row. It must not recommend seats that are already `BOOKED`.

## 4. Concurrent Booking Attempt (The Most Important Test)
*This tests the core requirement of preventing double booking.*
- **Action**: Open the `/demo` page in the frontend and click "Run Concurrency Test".
- **Background**: This fires 10 simultaneous API requests to book the exact same seats for the exact same show.
- **Expected Result**: 
  - Exactly **1** request should succeed (HTTP 201).
  - Exactly **9** requests should fail with HTTP 409 (Conflict - SEAT_UNAVAILABLE).
  - The database must only have 1 active booking for those seats.

## 5. Rate Limiting Protection
- **Action**: Refresh the Seat Map page or click "Find Best Seats" very rapidly (more than 30 times in a minute).
- **Expected Result**: The API should eventually return `HTTP 429 Too Many Requests` with a message instructing the user to slow down, demonstrating backend protection.
