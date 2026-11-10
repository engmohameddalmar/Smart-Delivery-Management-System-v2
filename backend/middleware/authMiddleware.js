import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export async function protect(request, response, next) {
  try {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) return response.status(401).json({ success: false, message: 'Authentication required' });

    const token = authorization.slice(7).trim();
    if (!token) return response.status(401).json({ success: false, message: 'Authentication required' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({_id:decoded.id,isDeleted:false}).select('+tokenVersion');
    if (!user) return response.status(401).json({ success: false, message: 'Authentication required' });
    if (user.status !== 'active') return response.status(401).json({ success: false, message: 'Account is not active' });
    if((decoded.version||0)!==(user.tokenVersion||0))return response.status(401).json({success:false,message:'Session expired. Please sign in again'});

    request.user = user;
    return next();
  } catch (_error) {
    return response.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

export function authorize(...roles) {
  return (request, response, next) => roles.includes(request.user.role)
    ? next()
    : response.status(403).json({ success: false, message: 'Access denied' });
}
