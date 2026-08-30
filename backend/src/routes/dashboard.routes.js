const router = require('express').Router();
const auth = require('../middleware/auth');
const { getDashboardMetrics } = require('../controllers/dashboard.controller');

router.get('/', auth, getDashboardMetrics);

module.exports = router;
