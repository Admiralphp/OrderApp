const express = require('express');
const router = express.Router();
const healthController = require('../controllers/healthController');

router.get('/', healthController.healthCheck);
router.get('/ready', healthController.readinessCheck);
router.get('/live', healthController.livenessCheck);

module.exports = router;
