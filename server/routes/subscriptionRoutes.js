const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');


router.post('/', subscriptionController.createSubscription);

router.get('/', subscriptionController.getMySubscriptions);

router.delete('/:id', subscriptionController.deleteSubscription);

router.put('/:id', subscriptionController.updateSubscription);

module.exports = router;