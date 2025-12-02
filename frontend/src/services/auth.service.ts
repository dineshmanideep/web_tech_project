// import { useApp } from '../context/AppContext';
import { LoginCredentials, AuthResponse } from '../types/index.ts';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const API_URL = `${BACKEND_URL}/api`;


// const {currentUser,setCurrentUser}=useApp();
export const authService = {
  async register(data: LoginCredentials & { name: string; role: string }): Promise<AuthResponse> {
    console.log("register data")
    console.log(data);
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials:'include',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }
    const result = await response.json();
    console.log("registration complete ",result);
    
    // Store token in localStorage
    if (result.token) {
      localStorage.setItem('token', result.token);
    }
    
    return result;
  },

  async login(credentials: LoginCredentials & { role: string }): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const result = await response.json();
    
    // Store token in localStorage
    if (result.token) {
      localStorage.setItem('token', result.token);
    }
    
    return result;
  },

  async getCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }

    const response = await fetch(`${API_URL}/auth/me`, {
      credentials:'include',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to get user');
    }

    return response.json();
  },

  logout() {
    localStorage.removeItem('token');
    // localStorage.removeItem('user');
  },

  // getStoredUser() {
  //   const user = localStorage.getItem('user');
  //   return user ? JSON.parse(user) : null;
  // },

  isAuthenticated() {
    return !!localStorage.getItem('token');
  }
}; 