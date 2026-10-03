async function run() {
    console.log("1. Logging in as user...");
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@cineticket.local', password: 'user123' })
    });
    const { token, user } = await loginRes.json();
    console.log("   Logged in. Token received.");

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    console.log("2. Fetching Movies...");
    const moviesRes = await fetch('http://localhost:5000/api/movies', { headers });
    const movies = await moviesRes.json();
    console.log("   Found", movies.length, "movies.");

    console.log("3. Fetching Shows for Movie 1...");
    const showsRes = await fetch(`http://localhost:5000/api/movies/1/shows`, { headers });
    const shows = await showsRes.json();
    console.log("   Found", shows.length, "shows.");

    console.log("4. Fetching seats for Show 1...");
    const seatsRes = await fetch(`http://localhost:5000/api/shows/1/seats`, { headers });
    const seats = await seatsRes.json();
    const availableSeats = seats.filter(s => s.Status !== 'BOOKED');
    if (availableSeats.length === 0) {
        console.log("   No available seats for this show.");
        return;
    }
    const targetSeat = availableSeats[0];
    console.log(`   Selected seat ${targetSeat.SeatNumber} (ID: ${targetSeat.SeatID}) for booking.`);

    console.log("5. Creating Booking...");
    const bookRes = await fetch(`http://localhost:5000/api/bookings`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ showId: 1, seatIds: [targetSeat.SeatID], paymentMode: 'UPI' })
    });
    const bookData = await bookRes.json();
    if (!bookRes.ok) {
        console.log("   Booking failed:", bookData);
        return;
    }
    console.log(`   Booking successful! BookingID: ${bookData.booking.bookingId}`);

    console.log("6. Fetching My Bookings...");
    const myRes = await fetch(`http://localhost:5000/api/bookings/my-bookings`, { headers });
    const myBookings = await myRes.json();
    console.log("   My Bookings count:", myBookings.length);
    const found = myBookings.find(b => b.BookingID === bookData.booking.bookingId);
    if (found) {
        console.log("   ✅ SUCCESS: Newly created booking found in My Bookings.");
    } else {
        console.log("   ❌ FAILED: Booking not found in My Bookings.");
    }

    console.log("7. Checking Booking Privacy...");
    const getRes = await fetch(`http://localhost:5000/api/bookings/${bookData.booking.bookingId}`, { headers });
    console.log(`   Status of getBookingById: ${getRes.status} (should be 200)`);
}

run();
