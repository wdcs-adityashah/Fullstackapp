const express = require('express');
const jwt = require('jsonwebtoken');
const EmployeeModel = require('../models/Employee');
const router = express.Router();
const SECRET_KEY = 'your_secret_key';

// Registration route
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    try {
        const existingUser = await EmployeeModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const newUser = new EmployeeModel({ name, email, password });
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
        if (!user) return res.status(404).json({ message: "No record exists" });

        // Compare hashed passwords
        const isMatch = await user.comparePassword(password);
        if (!isMatch) return res.status(400).json({ message: "Password is incorrect" });

        // Generate token
        const token = jwt.sign({ name: user.name, email: user.email }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ message: "Success", token });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'Access denied' });

    try {
        const verified = jwt.verify(token.split(" ")[1], SECRET_KEY);
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

router.get('/dashboard', verifyToken, (req, res) => {
    res.json({ message: `Welcome ${req.user.name}`, user: req.user });
});

module.exports = router;
