import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  TextField,
  Dialog,
  DialogTitle,
  DialogContent, 
  DialogActions,
  Alert,
  CircularProgress,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel
} from '@mui/material';
import { Lock, LockOpen, AdminPanelSettings, Camera } from '@mui/icons-material';
import { accessService, doorService } from '../services/api';
import KeyPad from './KeyPad';
import * as faceapi from 'face-api.js';

// Initialize face-api models
const loadModels = async () => {
  try {
    // Set path to models
    const MODEL_URL = '/models';
    
    // Load models
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    
    console.log('Face recognition models loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading face recognition models:', error);
    return false;
  }
};

const AccessInterface = () => {
  const [accessCode, setAccessCode] = useState('');
  const [doors, setDoors] = useState([]);
  const [selectedDoor, setSelectedDoor] = useState('');
  const [loading, setLoading] = useState(false);
  const [faceDetectionActive, setFaceDetectionActive] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: '' });
  const [accessStatus, setAccessStatus] = useState(null); // 'granted', 'denied', null
  const [userVerified, setUserVerified] = useState(null);
  const [doubleVerificationRequired, setDoubleVerificationRequired] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  
  // Load face-api models on component mount
  useEffect(() => {
    // Download models directory from public/models
    const initFaceDetection = async () => {
      const result = await loadModels();
      setModelsLoaded(result);
    };
    
    initFaceDetection();
    
    // Fetch available doors
    const fetchDoors = async () => {
      try {
        const response = await doorService.getAll();
        setDoors(response.data.data);
        
        // If only one door, select it by default
        if (response.data.data.length === 1) {
          setSelectedDoor(response.data.data[0]._id);
        }
      } catch (error) {
        console.error('Error fetching doors:', error);
        setFeedback({
          type: 'error',
          message: 'Failed to load doors. Please try again later.'
        });
      }
    };
    
    fetchDoors();
    
    // Clean up on component unmount
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // Handle keypad input
  const handleKeypadInput = (key) => {
    if (key === 'clear') {
      setAccessCode('');
    } else if (key === 'backspace') {
      setAccessCode(prevCode => prevCode.slice(0, -1));
    } else if (key === 'enter') {
      handleAccessCodeSubmit();
    } else {
      setAccessCode(prevCode => prevCode + key);
    }
  };
  
  // Handle access code verification
  const handleAccessCodeSubmit = async () => {
    if (!selectedDoor) {
      setFeedback({
        type: 'error',
        message: 'Please select a door'
      });
      return;
    }
    
    if (!accessCode) {
      setFeedback({
        type: 'error',
        message: 'Please enter an access code'
      });
      return;
    }
    
    setLoading(true);
    setFeedback({ type: null, message: '' });
    
    try {
      const response = await accessService.verifyCode(selectedDoor, accessCode);
      
      if (response.data.doubleVerificationRequired) {
        setDoubleVerificationRequired(true);
        setUserVerified(response.data.user);
        setFeedback({
          type: 'warning',
          message: 'Double verification required. Please look at the camera for face recognition.'
        });
        startCamera(); // Start camera for face verification
      } else {
        setAccessStatus('granted');
        setUserVerified(response.data.user);
        setFeedback({
          type: 'success',
          message: `Access granted. Welcome, ${response.data.user.name}!`
        });
        
        // Reset after 5 seconds
        setTimeout(() => {
          resetInterface();
        }, 5000);
      }
    } catch (error) {
      console.error('Access verification error:', error);
      setAccessStatus('denied');
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Access denied. Invalid code.'
      });
      
      // Reset after 3 seconds
      setTimeout(() => {
        resetInterface();
      }, 3000);
    } finally {
      setLoading(false);
      setAccessCode('');
    }
  };
  
  // Start camera for face detection
  const startCamera = async () => {
    try {
      if (!modelsLoaded) {
        const result = await loadModels();
        if (!result) {
          throw new Error('Failed to load face detection models');
        }
        setModelsLoaded(true);
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
        setFaceDetectionActive(true);
      }
    } catch (error) {
      console.error('Error starting camera:', error);
      setFeedback({
        type: 'error',
        message: 'Failed to access camera. Please check permissions.'
      });
    }
  };
  
  // Stop camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setCameraActive(false);
    setFaceDetectionActive(false);
  };
  
  // Detect faces
  const detectFaces = async () => {
    if (!faceDetectionActive || !videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Make sure video is playing
    if (video.paused || video.ended || !video.readyState) {
      requestAnimationFrame(detectFaces);
      return;
    }
    
    // Set canvas dimensions to match video
    const displaySize = { width: video.videoWidth, height: video.videoHeight };
    faceapi.matchDimensions(canvas, displaySize);
    
    // Detect faces
    const detections = await faceapi.detectAllFaces(
      video, 
      new faceapi.TinyFaceDetectorOptions()
    ).withFaceLandmarks().withFaceDescriptors();
    
    // Draw detections on canvas
    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
    
    // If faces detected and double verification required, verify face
    if (detections.length > 0 && doubleVerificationRequired && userVerified) {
      await handleFaceVerification(detections[0].descriptor);
    }
    
    // Continue detection loop
    if (faceDetectionActive) {
      requestAnimationFrame(detectFaces);
    }
  };
  
  // Handle face verification
  const handleFaceVerification = async (faceDescriptor) => {
    if (!selectedDoor || !userVerified) return;
    
    setFaceDetectionActive(false); // Pause detection
    setLoading(true);
    
    try {
      // Placeholder for actual face verification API call
      // In a real app, you would send the face descriptor to your backend
      const response = await accessService.doubleVerify(selectedDoor, userVerified._id, null, faceDescriptor);
      
      setAccessStatus('granted');
      setFeedback({
        type: 'success',
        message: `Double verification successful. Welcome, ${userVerified.name}!`
      });
      
      // Reset after 5 seconds
      setTimeout(() => {
        resetInterface();
      }, 5000);
    } catch (error) {
      console.error('Face verification error:', error);
      setAccessStatus('denied');
      setFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Face verification failed.'
      });
      
      // Reset face detection
      setFaceDetectionActive(true);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle door selection
  const handleDoorChange = (event) => {
    setSelectedDoor(event.target.value);
    resetInterface();
  };
  
  // Reset interface
  const resetInterface = () => {
    setAccessCode('');
    setAccessStatus(null);
    setUserVerified(null);
    setDoubleVerificationRequired(false);
    stopCamera();
    setFeedback({ type: null, message: '' });
  };
  
  // Handle video play event to start face detection
  const handleVideoPlay = () => {
    if (faceDetectionActive) {
      detectFaces();
    }
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 4, height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Paper elevation={3} sx={{ p: 4, display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Door Access Control
          </Typography>
          
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button 
              startIcon={<AdminPanelSettings />}
              variant="outlined"
              color="primary"
            >
              Admin
            </Button>
          </Link>
        </Box>
        
        {/* Door selection */}
        {doors.length > 0 && (
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="door-select-label">Select Door</InputLabel>
            <Select
              labelId="door-select-label"
              id="door-select"
              value={selectedDoor}
              label="Select Door"
              onChange={handleDoorChange}
              disabled={loading || doubleVerificationRequired}
            >
              {doors.map((door) => (
                <MenuItem key={door._id} value={door._id}>
                  {door.name} {door.location ? `(${door.location})` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        
        {/* Feedback alert */}
        {feedback.type && (
          <Alert 
            severity={feedback.type} 
            sx={{ mb: 3 }}
            onClose={() => setFeedback({ type: null, message: '' })}
          >
            {feedback.message}
          </Alert>
        )}
        
        {/* Status icon */}
        {accessStatus && (
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 3,
              animation: 'pulse 1.5s infinite'
            }}
          >
            {accessStatus === 'granted' ? (
              <LockOpen sx={{ fontSize: 100, color: 'success.main' }} />
            ) : (
              <Lock sx={{ fontSize: 100, color: 'error.main' }} />
            )}
          </Box>
        )}
        
        {/* Face detection */}
        {cameraActive && (
          <Box sx={{ position: 'relative', width: '100%', height: 300, mb: 3 }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onPlay={handleVideoPlay}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%'
              }}
            />
          </Box>
        )}
        
        {/* Camera button */}
        {!cameraActive && !doubleVerificationRequired && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Camera />}
            onClick={startCamera}
            disabled={loading || !modelsLoaded || !selectedDoor}
            sx={{ mb: 3, alignSelf: 'center' }}
          >
            Verify with Face
          </Button>
        )}
        
        {/* Access code display */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Access Code"
          type="password"
          value={accessCode}
          InputProps={{
            readOnly: true,
            sx: { fontSize: '1.5rem', textAlign: 'center' }
          }}
          sx={{ mb: 3 }}
        />
        
        {/* Keypad */}
        <KeyPad onKeyPress={handleKeypadInput} disabled={loading || doubleVerificationRequired} />
        
        {/* Loading overlay */}
        {loading && (
          <Box 
            sx={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 100
            }}
          >
            <CircularProgress size={80} />
          </Box>
        )}
      </Paper>
      
      {/* Add some styling for pulse animation */}
      <style jsx="true">{`
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
      `}</style>
    </Container>
  );
};

export default AccessInterface;