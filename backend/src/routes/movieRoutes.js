const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', movieController.getAllMovies);
router.get('/:id', movieController.getMovieById);
router.get('/:movieId/shows', movieController.getShowsByMovie);

// CRUD operations for Demo Lab
router.post('/', requireAuth, requireAdmin, movieController.createMovie);
router.put('/:id', requireAuth, requireAdmin, movieController.updateMovie);
router.delete('/:id', requireAuth, requireAdmin, movieController.deleteMovie);

module.exports = router;
