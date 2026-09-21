const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { demoLimiter, resetDemoLimiter } = require('../middleware/rateLimiter');

router.get('/stats', adminController.getStats);
router.post('/demo-query', adminController.runDemoQuery);
router.post('/execute-sql', adminController.executeSql);
router.get('/presets', adminController.getPresets);
router.post('/reset-seed', adminController.resetSeed);
router.get('/rate-limit-test', demoLimiter);
router.post('/rate-limit-reset', resetDemoLimiter);
router.post('/execute-raw-sql', adminController.executeRawSql);

module.exports = router;

