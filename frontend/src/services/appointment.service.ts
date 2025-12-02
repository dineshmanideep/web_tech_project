import { Appointment } from '../types/types';
import {  API_URL } from './api.service';

export const appointmentService = {
  async addAppointment(appointmentData: Partial<Appointment>): Promise<Appointment> {
    console.log("appointment data",appointmentData);
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/appointments/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials:'include',
      body: JSON.stringify(appointmentData)
    });

    console.log("handle submit response",response);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add appointment');
    }

    return response.json();
  },

  async getDoctorAppointments(): Promise<Appointment[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/appointments/doctor/`, {
      credentials:'include',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch doctor appointments');
    }

    return response.json();
  },

  async getPatientAppointments(): Promise<Appointment[]> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/appointments/patient/`, {
      credentials:'include',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch patient appointments');
    }
    console.log("patiend appointmens",response);
    return response.json();
  },


  async updateAppointment(appointmentId: string, appointmentData: Partial<Appointment>): Promise<Appointment> {
     const token = localStorage.getItem('token');
     const response = await fetch(`${API_URL}/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials:'include',
      body: JSON.stringify(appointmentData)
    });

    return response.json();
  },


  async updateAppointmentStatus(appointmentId: string, status: string): Promise<Appointment> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/appointments/${appointmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      credentials:"include",
      body: JSON.stringify({ status })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update appointment status');
    }

    return response.json();
  }
};
