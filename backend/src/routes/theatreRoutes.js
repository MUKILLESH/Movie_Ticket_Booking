const express = require('express');
const router = express.Router();
const theatreController = require('../controllers/theatreController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', theatreController.getAllTheatres);
router.get('/:id', theatreController.getTheatreById);

// CRUD operations for Demo Lab
router.post('/', requireAuth, requireAdmin, theatreController.createTheatre);
router.put('/:id', requireAuth, requireAdmin, theatreController.updateTheatre);
router.delete('/:id', requireAuth, requireAdmin, theatreController.deleteTheatre);

module.exports = router;
