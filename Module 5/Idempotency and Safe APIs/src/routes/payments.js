'use strict';

// routes/payments.js

const router = require('express').Router();
const { charges, idempotency, nextChargeId } = require('../store');

router.post('/', (req, res) => {

  // 1. Get the Idempotency-Key from request headers
  const key = req.headers['idempotency-key'];

  // 2. Check if the key is missing
  if (!key) {
    return res.status(400).json({
      error: {
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        message: 'Idempotency-Key header is required'
      }
    });
  }

  // 3. Check if this key was already used
  if (idempotency.has(key)) {
    const storedResponse = idempotency.get(key);

    return res.status(storedResponse.status).json(storedResponse.body);
  }

  // 4. Get the payment amount
  const amount = req.body && req.body.amount;

  // 5. Create a new charge
  const charge = {
    id: nextChargeId(),
    amount,
    status: 'charged'
  };

  // 6. Store the real charge
  charges.push(charge);

  // 7. Prepare the response
  const responseBody = {
    id: charge.id,
    amount: charge.amount,
    status: charge.status
  };

  // 8. Store the response against the Idempotency-Key
  const response = {
    status: 201,
    body: responseBody
  };

  idempotency.set(key, response);

  // 9. Return the response
  return res.status(201).json(responseBody);
});

module.exports = router;