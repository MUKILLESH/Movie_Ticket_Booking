const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { demoLimiter, resetDemoLimiter } = require('../middleware/rateLimiter');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.use(requireAuth, requireAdmin);

router.get('/stats', adminController.getStats);
router.post('/demo-query', adminController.runDemoQuery);
router.post('/execute-sql', adminController.executeSql);
router.get('/presets', adminController.getPresets);
router.post('/reset-seed', adminController.resetSeed);
router.get('/rate-limit-test', demoLimiter);
router.post('/rate-limit-reset', resetDemoLimiter);
router.post('/execute-raw-sql', adminController.executeRawSql);
router.get('/users', adminController.getUsers);

module.exports = router;

