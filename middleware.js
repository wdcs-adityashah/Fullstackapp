
const jwt = require('jsonwebtoken');
const SECRET_KEY = 'your_secret_key';

const logRequests = (req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
};

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Server error", error: err.message });
};

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ message: 'Access denied' });

  try {
      const verified = jwt.verify(token.split(" ")[1], SECRET_KEY);
      if (!verified) {
        return res.status(401).json({ message: 'Invalid token' });
      }
      req.user = verified;
      next();
  } catch (err) {
      res.status(400).json({ message: 'Invalid token' });
  }
};

const verifyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
};

module.exports = { logRequests, errorHandler, verifyToken, verifyRole };

