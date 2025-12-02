import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { axiosInstance } from '../utils/axios';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client';
import { Doctor, Patient, SignUpFormData, LoginCredentials } from '../types/index';
//import backend url form .env
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ;

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

interface AppContextType extends ThemeContextType {
  currentUser: Doctor | Patient | null;
  setCurrentUser: (user: Doctor | Patient | null) => void;
  isLoading: boolean;
  error: string | null;
  logout: () => void;
  signup: (data: SignUpFormData) => void;
  login: (data: LoginCredentials) => void;
  getCurrentUser: () => Promise<{ data: { data: any; success: boolean; message: string } }>;
  connectSocket:(id:string)=> void;
  socket:Socket|null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedTheme = localStorage.getItem('darkMode');
        return savedTheme ? JSON.parse(savedTheme) : true;
    });

    const [currentUser, setCurrentUser] = useState<Doctor | Patient | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isLoading] = useState(false);
    const [error] = useState<string | null>(null);

    // Apply dark mode class to html element
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
    }, [isDarkMode]);

    const signup = async (data: SignUpFormData) => {
        try {
            console.log("register data", data);
            const response = await axiosInstance.post('/auth/register', data);
            console.log("Signup response:", response.data);

            setCurrentUser(response.data.data);
            const id = response.data.data._id;
            connectSocket(id);
        } catch (error) {
            console.error("Signup error:", error);
        }
    };

    const login = async (data: LoginCredentials) => {
        try {
            console.log("logindata", data);
            const response = await axiosInstance.post('/auth/login', data);
            console.log("login responce", response);
            setCurrentUser(response.data.data);

            const id = response.data.data._id;
            connectSocket(id);

        } catch (error: any) {
            console.log(error);
            throw error;
        }
    }

    const logout = async () => {
        localStorage.removeItem('token');
        setCurrentUser(null);
        if (socket) {
            socket.disconnect();
        }
        setSocket(null);
    }

    const getCurrentUser = async () => {
        try {
            const response = await axiosInstance('/auth/me');
            console.log("current me ", response);
            if (response.data.data) {
                setCurrentUser(response.data.data);
                const id = response.data.data._id;
                console.log("connecting socket with id:", id);
                connectSocket(id);
            }
            return response;
        } catch (error) {
            console.error("Error getting current user:", error);
            throw error;
        }
    }

    const connectSocket = (id: string) => {
        console.log("Connecting socket ...");
        if (socket?.connected) {
            console.log('Socket already connected');
            return;
        }

        // Disconnect existing socket if any
        if (socket) {
            socket.disconnect();
        }
        

        const newSocket = io(BACKEND_URL, {
            query: { userId: id },
            withCredentials: true,  // Important for CORS
            autoConnect: true,      // Auto connect on creation
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            timeout: 20000,
            transports: ['websocket'], // write websocket only  dont write polling first
            
        });
        // newSocket.connect( 
        //     withCredentials=true
        // );

        newSocket.on('connect', () => {
            console.log('Socket connected successfully');
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket disconnected:', reason);
            if (reason === 'io server disconnect') {
                // Server initiated disconnect, try to reconnect
                newSocket.connect();
            }
        });

        newSocket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        newSocket.on('error', (error) => {
            console.error('Socket error:', error);
        });

        setSocket(newSocket);
        
    };

    // Cleanup socket on unmount
    useEffect(() => {
        return () => {
            if (socket) {
                socket.disconnect();
            }
        };
    }, [socket]);

    const toggleDarkMode = useCallback(() => {
        setIsDarkMode((prev: boolean) => !prev);
    }, []);

    return (
        <AppContext.Provider
            value={{
                isDarkMode,
                toggleDarkMode,
                currentUser,
                setCurrentUser,
                isLoading,
                error,
                logout,
                signup,
                login,
                getCurrentUser,
                connectSocket,
                socket
            }}
        >
            {children}
        </AppContext.Provider>
    );
};

export const useApp = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within an AppProvider');
    }
    return context;
};

export const useTheme = () => {
    const { isDarkMode, toggleDarkMode } = useApp();
    return { isDarkMode, toggleDarkMode };
};