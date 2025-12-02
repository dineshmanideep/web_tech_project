import jwt from 'jsonwebtoken';


export const generateToken = (userId, role) => {
    try {
      const token= jwt.sign(
        { id: userId, role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
  
      return token;
    } catch (error) {
      throw new Error('Failed to generate authentication token');
    }
  };