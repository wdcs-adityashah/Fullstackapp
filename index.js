const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { logRequests, errorHandler } = require('./middleware'); 
const app = express();
const PORT = process.env.PORT || 4010;
app.use(express.json());
app.use(cors());
app.use(logRequests);

mongoose.connect("mongodb://localhost:27017/mernauthnode")
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use('/api', authRoutes);
app.use(errorHandler);
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});