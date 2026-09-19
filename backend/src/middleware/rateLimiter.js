const rateLimit = require('express-rate-limit');

// General API Limiter (generous so browsing & admin stats are never blocked)
exports.apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many requests',
        message: 'Please try again later.'
    }
});

// Booking API Limiter (10 requests per 5 minutes per IP)
exports.bookingLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many booking requests',
        message: 'You have reached the maximum number of booking attempts. Please try again later.'
    }
});

// Seat Recommendation Limiter (30 requests per minute)
exports.recommendationLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many recommendation requests',
        message: 'Please slow down your seat searches.'
    }
});

// Dedicated Rate Limiting Demo (10 requests / 5 min / IP as required by Demo Req 9)
// Kept separate so the demo never interrupts the main application!
const demoStore = new Map();

exports.demoLimiter = (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    const now = Date.now();
    const windowMs = 5 * 60 * 1000;
    const max = 10;

    let record = demoStore.get(ip);
    if (!record || now - record.startTime > windowMs) {
        record = { count: 1, startTime: now };
        demoStore.set(ip, record);
    } else {
        record.count++;
    }

    if (record.count > max) {
        return res.status(429).json({
            status: 'RATE LIMIT EXCEEDED',
            http: 429,
            limit: max,
            windowMinutes: 5,
            currentRequests: record.count,
            message: `Rate limit exceeded! Maximum ${max} requests allowed per 5 minutes per IP.`
        });
    }

    res.status(200).json({
        status: 'ALLOWED',
        http: 200,
        limit: max,
        windowMinutes: 5,
        currentRequests: record.count,
        remaining: max - record.count,
        message: `Request permitted (${record.count}/${max}).`
    });
};

exports.resetDemoLimiter = (req, res) => {
    const ip = req.ip || req.connection.remoteAddress || '127.0.0.1';
    demoStore.delete(ip);
    res.status(200).json({ status: 'RESET', message: 'Rate limit counter reset successfully for demo.' });
};

