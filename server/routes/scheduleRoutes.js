const express = require('express');
const router = express.Router();
const { addSchedule, getSchedule } = require('../controllers/scheduleController');
const auth = require('../middleware/authMiddleware');

router.post('/', auth, addSchedule);
router.get('/', auth, getSchedule);

module.exports = router;
