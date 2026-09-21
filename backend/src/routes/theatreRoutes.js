const express = require('express');
const router = express.Router();
const theatreController = require('../controllers/theatreController');

router.get('/', theatreController.getAllTheatres);
router.get('/:id', theatreController.getTheatreById);

// CRUD operations for Demo Lab
router.post('/', theatreController.createTheatre);
router.put('/:id', theatreController.updateTheatre);
router.delete('/:id', theatreController.deleteTheatre);

module.exports = router;
