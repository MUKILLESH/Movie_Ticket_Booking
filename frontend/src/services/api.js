const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
};

export const loginUser = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
};

export const registerUser = async (name, email, password, phone) => {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, phone })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
};

export const getMyBookings = async () => {
    const res = await fetch(`${API_URL}/bookings/my-bookings`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch bookings');
    return res.json();
};

export const getBookingById = async (id) => {
    const res = await fetch(`${API_URL}/bookings/${id}`, {
        headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch booking');
    return res.json();
};

export const fetchMovies = async () => {
    const res = await fetch(`${API_URL}/movies`);
    if(!res.ok) throw new Error('Failed to fetch movies');
    return res.json();
};

export const fetchMovie = async (id) => {
    const res = await fetch(`${API_URL}/movies/${id}`);
    if(!res.ok) throw new Error('Failed to fetch movie');
    return res.json();
};

export const fetchShowsForMovie = async (movieId) => {
    const res = await fetch(`${API_URL}/movies/${movieId}/shows`);
    if(!res.ok) throw new Error('Failed to fetch shows');
    return res.json();
};

export const fetchShow = async (showId) => {
    const res = await fetch(`${API_URL}/shows/${showId}`);
    if(!res.ok) throw new Error('Failed to fetch show');
    return res.json();
};

export const fetchSeatsForShow = async (showId) => {
    const res = await fetch(`${API_URL}/shows/${showId}/seats`);
    if(!res.ok) throw new Error('Failed to fetch seats');
    return res.json();
};

export const recommendSeats = async (showId, groupSize) => {
    const res = await fetch(`${API_URL}/shows/${showId}/seats/recommend`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ groupSize })
    });
    if(!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to recommend seats');
    }
    return res.json();
};

export const createBooking = async (showId, seatIds, paymentMode = 'UPI') => {
    const res = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ showId, seatIds, paymentMode })
    });
    const data = await res.json();
    if(!res.ok) {
        throw new Error(data.message || 'Booking failed');
    }
    return data;
};

export const simulateConcurrentBookings = async (showId, seatIds, numRequests) => {
    const res = await fetch(`${API_URL}/test/concurrent-bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ showId, seatIds, numRequests })
    });
    return res.json();
};
