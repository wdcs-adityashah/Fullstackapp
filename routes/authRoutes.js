const express = require('express');
const jwt = require('jsonwebtoken');
const EmployeeModel = require('../models/Employee');
const router = express.Router();
const SECRET_KEY = 'your_secret_key'; // Replace with a secure secret key

// Registration route
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await EmployeeModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const newUser = new EmployeeModel({ name, email, password, role });
    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await EmployeeModel.findOne({ email });
    
    // If user is not found, return an error
    if (!user) {
      return res.status(404).json({ message: "No record exists" });
    }

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password is incorrect" });
    }

    // Generate a token after successful login
    const token = jwt.sign({ name: user.name, email: user.email, role: user.role }, SECRET_KEY, { expiresIn: '1h' });

    // Return session data along with the token in a single response
    res.json({
      message: "Success",
      session: {
        user: {
          name: user.name,
          email: user.email,
          role: user.role
        }
      },
      token
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Verify token middleware
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
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    }
    res.status(400).json({ message: 'Invalid token' });
  }
};

// Verify role middleware
const verifyRole = (roles) => {
  return (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
      const verified = jwt.verify(token.split(" ")[1], SECRET_KEY);
      req.user = verified;

      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      }

      next();
    } catch (err) {
      res.status(400).json({ message: 'Invalid token' });
    }
  };
};

// Protected routes
router.get('/users', verifyRole(['admin']), async (req, res) => {
  try {
    const users = await EmployeeModel.find({}, 'name email role'); // Exclude password field
    res.json(users);
    console.log(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/dashboard', verifyToken, (req, res) => {
  res.json({ message: `Welcome ${req.user.name}`, user: req.user });
});

// Protect an admin-only route
router.get('/admin', verifyRole(['admin']), (req, res) => {
  res.json({ message: `Welcome Admin ${req.user.name}`, user: req.user });
});

router.post('/logout', (req, res) => {
  // Invalidate token on the client-side by clearing cookies or localStorage
  res.status(200).json({ message: "Logged out successfully" });
});

module.exports = router;