const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const secretKey = 'your_secret_key';

// Middleware to parse JSON requests
app.use(express.json());

// Login endpoint
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Find user in the database
    const user = await prisma.user.findUnique({ where: { username } });

    // User not found
    if (!user) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Check if the password matches
    if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Create a JWT token
    const token = jwt.sign({ userId: user.id }, secretKey);

    // Send the token as a response
    res.json({ token });
});

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      // Check if the username already exists
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
  
      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);
  
      // Create the user in the database
      const user = await prisma.user.create({
        data: {
          username,
          password: hashedPassword,
        },
      });
  
      res.json({ message: 'Registration success!' });
    } catch (error) {
      console.error('Error registering user:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

// Protected route
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'Protected route accessed successfully!' });
});

// check health
app.get('/', (req, res) => {
    res.send('Hello World')
});

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401);
    }

    jwt.verify(token, secretKey, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }

        req.user = user;
        next();
    });
}

// Start the server
app.listen(3000, () => {
    console.log('Server started on port 3000');
});