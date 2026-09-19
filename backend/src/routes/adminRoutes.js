const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { demoLimiter, resetDemoLimiter } = require('../middleware/rateLimiter');

router.get('/stats', adminController.getStats);
router.post('/demo-query', adminController.runDemoQuery);
router.get('/rate-limit-test', demoLimiter);
router.post('/rate-limit-reset', resetDemoLimiter);

module.exports = router;

