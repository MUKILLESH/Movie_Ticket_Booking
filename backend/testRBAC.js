const http = require('http');

async function test() {
    console.log("Logging in as user...");
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@cineticket.local', password: 'user123' })
    });
    const loginData = await loginRes.json();

    console.log("\nAttempting to get a booking as user...");
    // Just try fetching booking IDs 1, 2, 3...
    for(let i=1; i<=3; i++) {
        const createRes = await fetch(`http://localhost:5000/api/bookings/${i}`, {
            method: 'GET',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${loginData.token}`
            }
        });
        const createData = await createRes.json();
        console.log(`Fetch booking ${i} status:`, createRes.status);
        console.log(`Fetch booking ${i} result:`, createData);
    }
}

test();
