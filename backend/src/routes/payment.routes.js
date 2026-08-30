const router = require('express').Router();
const { createCheckoutSession, handleWebhook } = require('../controllers/payment.controller');

router.post('/create-checkout-session', createCheckoutSession);
router.post('/webhook', handleWebhook);

module.exports = router;
