// import { AppProvider, useApp } from '../context/AppContext';
import { Patient } from '../types/index.ts';

// import { axiosInstance } from '../utils/axios';
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ;

export const API_URL = `${BACKEND_URL}/api`;



export const apiService = {
  // User related APIs
  // async getCurrentUser(): Promise<AuthResponse> {
  //   const response = await fetch(`${API_URL}/auth/me`, {
  //     method:"GET",
  //     credentials: "include", 
  //     headers: {
  //       "Content-Type": "application/json",
  //     },
  //   });

  //   if (!response.ok) {
  //     const error = await response.json();
  //     throw new Error(error.message || 'Failed to fetch user profile');
  //   }

  //   return response.json();
  // },
  async updatePatientProfile(userData: Partial<Patient>): Promise<Patient> {
    
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/patients/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials:"include",
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }

    const return_data=await response.json();
    return return_data.data;
  },

}; 



