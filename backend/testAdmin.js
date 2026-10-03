async function run() {
    console.log("1. Logging in as admin...");
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@cineticket.local', password: 'admin123' })
    });
    const { token, user } = await loginRes.json();
    console.log("   Logged in. Role:", user.role);

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    console.log("2. Testing Raw SQL Execution as Admin...");
    const sqlRes = await fetch('http://localhost:5000/api/admin/execute-raw-sql', {
        method: 'POST',
        headers,
        body: JSON.stringify({ sql: "SELECT * FROM CUSTOMER WHERE Role = 'ADMIN'" })
    });
    const sqlData = await sqlRes.json();
    console.log("   Admin query status:", sqlRes.status);
    console.log("   Admin count:", sqlData.result ? sqlData.result.length : sqlData);

    console.log("3. Test User trying to execute Raw SQL...");
    const userRes = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@cineticket.local', password: 'user123' })
    });
    const userTokens = await userRes.json();
    
    const userSqlRes = await fetch('http://localhost:5000/api/admin/execute-raw-sql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${userTokens.token}`
        },
        body: JSON.stringify({ sql: "SELECT * FROM CUSTOMER WHERE Role = 'ADMIN'" })
    });
    console.log("   User query status:", userSqlRes.status);
}

run();
