const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res
        .status(401)
        .json({ message: 'Unauthorized - No token provided' });
    }

    const token = authHeader.split(' ')[1]; // Extract the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
      if (err) {
        console.error('JWT verification error:', err.message);
        return res
          .status(401)
          .json({ message: 'Unauthorized - Invalid token' });
      }
      next();
    });
  } catch (error) {
    console.error('Error in requireAuth:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const checkUser = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (token) {
      jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
        if (err) {
          res.locals.user = null;
        } else {
          const user = await User.findById(decodedToken.id);
          res.locals.user = user || null;
        }
        next();
      });
    } else {
      res.locals.user = null;
      next();
    }
  } catch (error) {
    console.error('Error in checkUser:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

module.exports = { requireAuth, checkUser };
