import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import {getSettingsDocument} from './settingsController.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(user) {
  return jwt.sign({ id: user._id, role: user.role,version:user.tokenVersion||0 }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function authResponse(response, status, message, user) {
  response.status(status).json({ success: true, message, user: user.toSafeObject(), token: createToken(user) });
}

export async function register(request, response, next) {
  try {
    await getSettingsDocument();
    return response.status(403).json({
      success: false,
      message: 'Public customer registration is disabled. Businesses must create customer accounts.',
    });
  } catch (error) {
    return next(error);
  }
}

export async function login(request, response, next) {
  try {
    const { email, password } = request.body;
    if (!email?.trim() || !password) return response.status(400).json({ success: false, message: 'Email and password are required' });

    const user = await User.findOne({ email: email.trim().toLowerCase(),isDeleted:false }).select('+password +tokenVersion');
    if (!user || !(await user.comparePassword(password))) return response.status(401).json({ success: false, message: 'Invalid credentials' });
    if (user.status !== 'active') return response.status(401).json({ success: false, message: 'Account is not active' });

    return authResponse(response, 200, 'Login successful', user);
  } catch (error) { return next(error); }
}

export function getMe(request, response) {
  response.json({ success: true, user: request.user.toSafeObject() });
}

export function logout(_request, response) {
  response.json({ success: true, message: 'Logout successful' });
}
