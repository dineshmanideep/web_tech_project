import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useApp } from './AppContext';
import toast from 'react-hot-toast';

// WebRTC configuration
const peerConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ]
};

interface VideoCallContextType {
  isInCall: boolean;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (userId: string) => Promise<void>;
  endCall: () => void;
  answerCall: () => Promise<void>;
  callStatus: 'idle' | 'calling' | 'ringing' | 'connected';
  callerId: string | null;
  rejectCall: () => void;
}

const VideoCallContext = createContext<VideoCallContextType | null>(null);

export const VideoCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket } = useApp();
  const [isInCall, setIsInCall] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'ringing' | 'connected'>('idle');
  const [callerId, setCallerId] = useState<string | null>(null);
  
  // WebRTC connection reference
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const listenersSetupRef = useRef(false);

  // useEffect(() => {
   
  //   console.log("Socket in VideoCallContext:", socket);
  //   console.log("PeerConnectionRef in VideoCallContext:", peerConnectionRef.current);
  //   console.log("IsInCall in VideoCallContext:", isInCall);
  //   console.log("CallStatus in VideoCallContext:", callStatus);
  //   console.log("CallerId in VideoCallContext:", callerId);
  //   console.log("LocalStream in VideoCallContext:", localStream);
  //   console.log("RemoteStream in VideoCallContext:", remoteStream);
  //   console.log("PendingCandidatesRef in VideoCallContext:", pendingCandidatesRef.current);
  //   console.log("PendingOfferRef in VideoCallContext:", pendingOfferRef.current);
  //   console.log("PeerConfiguration in VideoCallContext:", peerConfiguration);

  // }, [socket, peerConnectionRef.current, isInCall, callStatus, callerId, localStream, remoteStream, pendingCandidatesRef.current, pendingOfferRef.current, peerConfiguration]);





  // Cleanup function
  const cleanupCall = () => {
    console.log("cleanupCall called");
    console.log('Cleaning up call resources');
    
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    pendingCandidatesRef.current = [];
    pendingOfferRef.current = null;
    setCallStatus('idle');
    setIsInCall(false);
    setCallerId(null);
    
    toast.success('Call ended', {
      icon: '📞',
    });
  };

  // Create a new RTCPeerConnection
  const createPeerConnection = () => {
    console.log('Creating new peer connection');
    const peerConnection = new RTCPeerConnection(peerConfiguration);
    
    // Set up event handlers
    peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate && socket && callerId) {
        console.log('Sending ICE candidate:', candidate);
        socket.emit('ice-candidate', {
          to: callerId,
          candidate
        });
      }
    };
    
    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState);
      
      if (peerConnection.iceConnectionState === 'connected') {
        toast.success('Video call connected', {
          icon: '✅',
        });
      }
      
      if (
        peerConnection.iceConnectionState === 'disconnected' ||
        peerConnection.iceConnectionState === 'failed' ||
        peerConnection.iceConnectionState === 'closed'
      ) {
        console.log('ICE connection failed or closed');
        toast.error('Connection lost', {
          icon: '📡',
        });
        cleanupCall();
      }
    };
    
    peerConnection.ontrack = (event) => {
      console.log('Received remote track:', event.streams[0]);
      setRemoteStream(event.streams[0]);
      toast.success('Receiving video stream', {
        icon: '🎥',
      });
    };
    
    return peerConnection;
  };

  // Start a call (as initiator)
  const startCall = async (userId: string) => {
    if (isInCall || !socket) {
      console.error('Cannot start call: already in call or socket not initialized');
      toast.error('Cannot start call at this time');
      return;
    }
    
    try {
      console.log('Starting call to user:', userId);
      toast.loading('Initiating call...', { id: 'call-init' });
      
      setCallerId(userId);
      setCallStatus('calling');
      setIsInCall(true);
      
      // Get local media stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      setLocalStream(stream);
      
      toast.success('Camera and microphone connected', { id: 'call-init' });
      
      // Create new peer connection
      const peerConnection = createPeerConnection();
      peerConnectionRef.current = peerConnection;
      
      // Add local tracks to the connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Create and send offer
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await peerConnection.setLocalDescription(offer);
      
      console.log('Sending call offer to:', userId);
      socket.emit('call-user', {
        to: userId,
        offer: peerConnection.localDescription
      });
      
      toast.success('Calling...', {
        icon: '📞',
      });
      
      // Set up socket listeners for this call
      socket.once('call-answered', async (data) => {
        if (!peerConnectionRef.current) return;
        
        console.log('Call answered, setting remote description');
        try {
          await peerConnectionRef.current.setRemoteDescription(
            new RTCSessionDescription(data.answer)
          );
          
          setCallStatus('connected');
          toast.success('Call answered', {
            icon: '✅',
          });
          
          // Apply any pending ICE candidates
          pendingCandidatesRef.current.forEach(candidate => {
            if (peerConnectionRef.current) {
              peerConnectionRef.current.addIceCandidate(candidate);
            }
          });
          pendingCandidatesRef.current = [];
          
        } catch (error) {
          console.error('Error setting remote description:', error);
          toast.error('Failed to establish connection');
          cleanupCall();
        }
      });
      
      socket.once('call-rejected', () => {
        console.log('Call was rejected');
        toast.error('Call was rejected', {
          icon: '❌',
        });
        cleanupCall();
      });
      
    } catch (error) {
      console.error('Error starting call:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Camera/microphone permission denied', {
          icon: '🚫',
          duration: 5000,
        });
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        toast.error('No camera or microphone found', {
          icon: '📷',
          duration: 5000,
        });
      } else {
        toast.error('Failed to start call');
      }
      cleanupCall();
    }
  };

  // Answer an incoming call
  const answerCall = async () => {
    if (!socket || !callerId || !pendingOfferRef.current) {
      console.error('Cannot answer call: missing required data');
      toast.error('Cannot answer call at this time');
      return;
    }
    
    try {
      console.log('Answering call from:', callerId);
      toast.loading('Connecting...', { id: 'answer-call' });
      
      setCallStatus('connected');
      
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      setLocalStream(stream);
      
      toast.success('Camera and microphone connected', { id: 'answer-call' });
      
      // Create peer connection
      const peerConnection = createPeerConnection();
      peerConnectionRef.current = peerConnection;
      
      // Add local tracks
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });
      
      // Set the remote description (offer)
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(pendingOfferRef.current)
      );
      
      // Create and send answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      console.log('Sending call answer');
      socket.emit('answer-call', {
        to: callerId,
        answer: peerConnection.localDescription
      });
      
      toast.success('Call connected', {
        icon: '✅',
      });
      
      // Apply any pending ICE candidates
      pendingCandidatesRef.current.forEach(candidate => {
        if (peerConnectionRef.current) {
          peerConnectionRef.current.addIceCandidate(candidate);
        }
      });
      pendingCandidatesRef.current = [];
      
    } catch (error) {
      console.error('Error answering call:', error);
      if (error instanceof Error && error.name === 'NotAllowedError') {
        toast.error('Camera/microphone permission denied', {
          icon: '🚫',
          duration: 5000,
        });
      } else if (error instanceof Error && error.name === 'NotFoundError') {
        toast.error('No camera or microphone found', {
          icon: '📷',
          duration: 5000,
        });
      } else {
        toast.error('Failed to answer call');
      }
      cleanupCall();
    }
  };

  // Reject an incoming call
  const rejectCall = () => {
    if (socket && callerId) {
      console.log('Rejecting call from:', callerId);
      socket.emit('call-rejected', { to: callerId });
      toast.success('Call rejected', {
        icon: '🚫',
      });
    }
    cleanupCall();
  };

  // End an ongoing call
  const endCall = () => {
    console.log('Ending call');
    if (socket && callerId) {
      console.log('Ending call with:', callerId);
      socket.emit('call-end', { to: callerId });
    }
    cleanupCall();
  };

  // Set up socket event listeners
  useEffect(() => {
  if (!socket) return;

  if (listenersSetupRef.current) {
    console.log("🛑 Listeners already set up, skipping");
    return;
  }
  
  const setupListeners = () => {
    console.log("✅ Socket connected:", socket.id);
    console.log("🔵 Registering socket event listeners in VideoCallContext");
    
    listenersSetupRef.current = true;
    
    // Handle incoming call
    const handleCallOffer = (data) => {
      console.log('Received call offer from:', data.from);
      
      if (isInCall) {
        console.log('Already in call, rejecting new call');
        socket.emit('call-rejected', { to: data.from });
        toast.error('Already in a call', {
          icon: '📞',
        });
        return;
      }
      
      setCallerId(data.from);
      setCallStatus('ringing');
      setIsInCall(true);
      pendingOfferRef.current = data.offer;
      
      toast(() => (
        <div className="flex flex-col gap-2">
          <span className="font-semibold">📞 Incoming Video Call</span>
          <span className="text-sm text-gray-300">Someone is calling you</span>
        </div>
      ), {
        duration: 30000,
        icon: '📞',
      });
    };
    
    // Handle ICE candidates
    const handleIceCandidate = (data) => {
      console.log('Received ICE candidate');
      
      const candidate = new RTCIceCandidate(data.candidate);
      
      if (peerConnectionRef.current && peerConnectionRef.current.remoteDescription) {
        console.log('Adding ICE candidate directly');
        peerConnectionRef.current.addIceCandidate(candidate);
      } else {
        console.log('Storing ICE candidate for later');
        pendingCandidatesRef.current.push(candidate);
      }
    };
    
    // Handle call end
    const handleCallEnd = () => {
      console.log('Remote peer ended the call');
      toast('Call ended by other user', {
        icon: '📞',
      });
      cleanupCall();
    };

    // Event handlers map
    const eventHandlers = {
      'call-made': handleCallOffer,
      'ice-candidate': handleIceCandidate,
      'call-end': handleCallEnd,
    };
  
    // Register all listeners
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socket.on(event, handler);
    });
    
    return eventHandlers;
  };
  
  // If socket is already connected, set up immediately
  if (socket.connected) {
    const handlers = setupListeners();
    
    return () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    };
  }
  
  // Otherwise, wait for connection
  console.log("⏳ Waiting for socket to connect...");
  
  const handleConnect = () => {
    const handlers = setupListeners();
    
    // Store cleanup function
    socket.once('disconnect', () => {
      Object.entries(handlers).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
    });
  };
  
  socket.on('connect', handleConnect);
  
  return () => {
    socket.off('connect', handleConnect);
  };
}, [socket]);

  return (
    <VideoCallContext.Provider value={{
      isInCall,
      localStream,
      remoteStream,
      startCall,
      endCall,
      answerCall,
      callStatus,
      callerId,
      rejectCall
    }}>
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
};