# API Documentation

Base URL: `http://localhost:5000/api`

## Movies
### GET `/movies`
Returns a list of all movies.

### GET `/movies/:id`
Returns details of a specific movie.

### GET `/movies/:movieId/shows`
Returns all scheduled shows for a specific movie, including theatre and screen details.

## Theatres
### GET `/theatres`
Returns a list of all theatres.

### GET `/theatres/:id`
Returns details of a specific theatre.

## Shows
### GET `/shows`
Returns all shows across all movies and theatres.

### GET `/shows/:id`
Returns details of a specific show.

## Seats & Availability
### GET `/shows/:showId/seats`
Returns the seat layout for a specific show, including the current availability status (`AVAILABLE` or `BOOKED`) of each seat.
**Response snippet:**
\`\`\`json
[
  { "SeatID": 1, "SeatNumber": "A1", "SeatType": "REGULAR", "Price": "150.00", "Status": "AVAILABLE" },
  { "SeatID": 2, "SeatNumber": "A2", "SeatType": "REGULAR", "Price": "150.00", "Status": "BOOKED" }
]
\`\`\`

### POST `/shows/:showId/seats/recommend`
Calculates and returns the best contiguous block of available seats for a group.
**Body:**
\`\`\`json
{
  "groupSize": 4,
  "preferredType": "REGULAR" // optional
}
\`\`\`

## Bookings
### POST `/bookings`
Creates a new booking transaction.
**Body:**
\`\`\`json
{
  "showId": 1,
  "seatIds": [1, 2, 3],
  "paymentMode": "UPI"
}
\`\`\`
**Response (Success):** `201 Created`
**Response (Conflict - Seat Taken):** `409 Conflict`

### GET `/bookings/:bookingId`
Returns detailed information about a specific booking, including the exact seats booked.

### GET `/bookings/customer/:customerId`
Returns all bookings made by a specific customer.

## Testing (Development Only)
### POST `/test/concurrent-bookings`
Simulates multiple simultaneous booking attempts for the same seats to demonstrate database concurrency control.
**Body:**
\`\`\`json
{
  "showId": 1,
  "seatIds": [14, 15],
  "numRequests": 10
}
\`\`\`
