import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {  Clock, Briefcase, GraduationCap, User, Phone } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { doctorService } from '../services/doctor.service';
import { appointmentService } from '../services/appointment.service';
import { Doctor, Appointment, Slot } from '../types/index.ts';

import { useApp } from '../context/AppContext';

const DoctorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const {currentUser} = useApp();
  const [appointment, setAppointment] = useState<Appointment>(
    {
      date: new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
      startTime: '',
      endTime: '',
      status: 'pending',
      mode: 'chat',
      reason: 'Checkup',
    },
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    loadDoctorAndAppointments();
  }, [id]);

  const daysofweek = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];



  const loadDoctorAndAppointments = async () => {
    try {
      setIsLoading(true);
      const doctorData = await doctorService.getDoctorById(id!);
      console.log("getDoctorbyid",doctorData);
      setDoctor(doctorData);
      // const appointmentsData = await appointmentService.getDoctorAppointments(id!);
      // setAppointments(appointmentsData);
    } catch (err) {
      setError('Failed to load doctor details and appointments');
    } finally {
      setIsLoading(false);
    }
  };


  const handleBookAppointment = async (e: React.FormEvent) => {
    // Prevent page refresh on form submit
    e.preventDefault();

    if (!doctor || !appointment) return;

    try {
      const appointmentData: Partial<Appointment> = {
        doctorId: doctor._id,
        date: appointment.date,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status,
        mode: appointment.mode,
        reason: appointment.reason,
      };
      console.log("Booking appointment with data:", appointmentData);
      const response = await appointmentService.addAppointment(appointmentData);
      console.log("Appointment booked successfully:", response);
      
      // Reset form and show success message
      setAppointment({
        date: new Date().toISOString().split('T')[0],
        startTime: '',
        endTime: '',
        status: 'pending',
        mode: 'chat',
        reason: 'Checkup',
      });
      setError(null);
      alert('Appointment booked successfully!');
     
    } catch (err: any) {
      console.error("Failed to book appointment:", err);
      setError(err.message || 'Failed to book appointment');
    }
  };



  const getSlotColor= (slot:Slot,day:string): string => {
    const dayIndex = daysofweek.indexOf(day);
    const today = new Date().getDay();
    if(dayIndex<today){
     return 'bg-gray-500';
    }
    else if (slot.isAvailable) {
      return 'bg-green-500';
    }
    return 'bg-yellow-500';
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner /></div>;
  }

  if (!doctor) {
    return <div>Doctor not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-400 text-red-700 shadow-sm" role="alert">
          {error}
        </div>
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-8">
          <div className="flex items-start justify-between mb-10">
            <div className="flex items-center space-x-6">
              {doctor.avatar ? (
                <img
                  src={doctor.avatar}
                  alt={doctor.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-100 dark:border-blue-900"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-blue-100 dark:border-blue-900">
                  {doctor.name?.charAt(0).toUpperCase() || 'D'}
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {doctor.name ? `Dr. ${doctor.name}` : 'Doctor Profile'}
                </h1>
                {doctor.specialization && (
                  <p className="text-lg text-blue-600 dark:text-blue-400 mt-1">
                    {doctor.specialization}
                  </p>
                )}
                {doctor.experience && (
                  <div className="flex items-center mt-2">
                    <Briefcase size={18} className="text-gray-500 dark:text-gray-400" />
                    <span className="ml-2 text-gray-600 dark:text-gray-300">
                      {doctor.experience} years of experience
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              {doctor.qualification && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <GraduationCap size={20} className="text-blue-500" /> Qualifications
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {doctor.qualification}
                  </p>
                </div>
              )}

              {doctor.about && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <User size={20} className="text-blue-500" /> About
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {doctor.about}
                  </p>
                </div>
              )}

              {doctor.contactNumber && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Phone size={20} className="text-blue-500" /> Contact
                  </h2>
                  <p className="text-gray-600 dark:text-gray-300">
                    {doctor.contactNumber}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {doctor.schedule && doctor.schedule.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-blue-500" /> Schedule
                  </h2>
                  <div className="space-y-4">
                    {doctor.schedule.map((schedule, index) => (
                      schedule.slots && schedule.slots.length > 0 && (
                        <div key={index} className="border-b dark:border-gray-600 pb-4 last:border-b-0">
                          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-2">
                            {schedule.day}
                          </h3>
                          <div className="grid grid-cols-2 gap-2">
                            {schedule.slots.map((slot, slotIndex) => {
                              const dayIndex = daysofweek.indexOf(schedule.day);
                              const today = new Date().getDay();
                              return (
                                <button
                                  key={slotIndex}
                                  className={`p-3 rounded-lg text-white text-sm font-medium transition-colors ${
                                    getSlotColor(slot, schedule.day)
                                  } ${
                                    slot.isAvailable && dayIndex >= today
                                      ? 'hover:opacity-90'
                                      : 'opacity-50 cursor-not-allowed'
                                  }`}
                                  onClick={() => {
                                    setAppointment({
                                      ...appointment,
                                      date: schedule.day,
                                      startTime: slot.startTime,
                                      endTime: slot.endTime
                                    });
                                  }}
                                  disabled={!slot.isAvailable || dayIndex < today}
                                >
                                  {`${slot.startTime} - ${slot.endTime}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 bg-gray-50 dark:bg-gray-700/50 p-6 rounded-xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Book Appointment
            </h2>
            
            {currentUser?.role === 'patient' ? (
              <form onSubmit={handleBookAppointment} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date
                    </label>
                    <input
                      type="date"
                      value={appointment.date}
                      onChange={(e) => setAppointment({...appointment, date: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Start Time
                    </label>
                    <input
                      type="time"
                      value={appointment.startTime}
                      onChange={(e) => setAppointment({...appointment, startTime: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      End Time
                    </label>
                    <input
                      type="time"
                      
                      value={appointment.endTime}
                      onChange={(e) => setAppointment({...appointment, endTime: e.target.value})}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Appointment Type
                    </label>
                    <div className="flex space-x-4">
                      <button
                        type="button"
                        onClick={() => setAppointment({...appointment, mode: 'video'})}
                        className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                          appointment.mode === 'video'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Video Call
                      </button>
                      <button
                        type="button"
                        onClick={() => setAppointment({...appointment, mode: 'chat'})}
                        className={`flex-1 px-4 py-3 rounded-lg border transition-colors ${
                          appointment.mode === 'chat'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        Chat
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Reason for Appointment
                  </label>
                  <textarea
                    value={appointment.reason}
                    onChange={(e) => setAppointment({...appointment, reason: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Book Appointment
                </button>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Please log in as a patient to book an appointment
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorPage;
