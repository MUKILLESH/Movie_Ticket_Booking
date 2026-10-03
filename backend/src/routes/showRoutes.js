const express = require('express');
const router = express.Router();
const showController = require('../controllers/showController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', showController.getAllShows);
router.get('/:id', showController.getShowById);
router.post('/', requireAuth, requireAdmin, showController.createShow);
router.put('/:id', requireAuth, requireAdmin, showController.updateShow);
router.delete('/:id', requireAuth, requireAdmin, showController.deleteShow);

module.exports = router;
