
'use strict';

const rateLimitModule = require('express-rate-limit');
const rateLimit = rateLimitModule.rateLimit || rateLimitModule;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,

  standardHeaders: true,
  legacyHeaders: false,

  skipSuccessfulRequests: true,

  handler: (req, res) => {
    const resetTime = req.rateLimit.resetTime;
    const retryAfter = Math.max(
      1,
      Math.ceil((resetTime.getTime() - Date.now()) / 1000)
    );

    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({
      message: 'Too many requests. Please try again later.'
    });
  }
});

/*
Redis support:
In a multi-instance deployment, we can use rate-limit-redis
with a shared Redis server instead of the default in-memory store.
All application instances will share the same rate-limit data.
The in-memory store is not enough because each server keeps its
own separate request count. Behind a load balancer, requests
may reach different servers, allowing users to bypass the limit.
*/

module.exports = authLimiter;
