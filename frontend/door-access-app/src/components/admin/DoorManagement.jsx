import { useState, useEffect } from 'react';
import {
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Box,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Card,
  CardContent,
  CardActions,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon
} from '@mui/icons-material';
import { doorService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// Door management component
const DoorManagement = () => {
  const [doors, setDoors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState('add'); // 'add' or 'edit'
  const [selectedDoor, setSelectedDoor] = useState(null);
  
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'administrator';
  
  // Load doors on component mount
  useEffect(() => {
    fetchDoors();
  }, []);
  
  // Fetch doors from API
  const fetchDoors = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await doorService.getAll();
      setDoors(response.data.data);
    } catch (error) {
      console.error('Error fetching doors:', error);
      setError('Failed to load doors. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle adding a new door
  const handleAddDoor = () => {
    setDialogType('add');
    setSelectedDoor(null);
    setOpenDialog(true);
  };
  
  // Handle editing a door
  const handleEditDoor = (door) => {
    setDialogType('edit');
    setSelectedDoor(door);
    setOpenDialog(true);
  };
  
  // Handle deleting a door
  const handleDeleteDoor = async (doorId) => {
    // In a real app, add a confirmation dialog here
    try {
      await doorService.delete(doorId);
      setDoors(doors.filter(door => door._id !== doorId));
    } catch (error) {
      console.error('Error deleting door:', error);
      setError('Failed to delete door. Please try again.');
    }
  };
  
  // Handle toggling a door lock (placeholder)
  const handleToggleLock = async (doorId) => {
    // In a real app, this would communicate with the Tasmota switch
    alert('This would toggle the door lock in a real application');
  };
  
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Door Management
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />} 
            onClick={fetchDoors}
            sx={{ mr: 1 }}
          >
            Refresh
          </Button>
          
          {isAdmin && (
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleAddDoor}
            >
              Add Door
            </Button>
          )}
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {doors.length === 0 ? (
            <Grid item xs={12}>
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1">
                  No doors found. {isAdmin ? 'Click "Add Door" to create one.' : 'Contact an administrator to add doors.'}
                </Typography>
              </Paper>
            </Grid>
          ) : (
            doors.map((door) => (
              <Grid item xs={12} sm={6} md={4} key={door._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h5" component="h2">
                      {door.name}
                    </Typography>
                    
                    {door.location && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Location: {door.location}
                      </Typography>
                    )}
                    
                    <Box sx={{ mt: 2 }}>
                      <Chip 
                        label={door.isActive ? 'Active' : 'Inactive'} 
                        color={door.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      
                      {door.doubleVerificationDays > 0 && (
                        <Chip 
                          label={`Double Verify: ${door.doubleVerificationDays} days`}
                          color="info"
                          size="small"
                        />
                      )}
                    </Box>
                    
                    <Typography variant="body2" sx={{ mt: 2 }}>
                      IP: {door.tasmotaIp}
                    </Typography>
                  </CardContent>
                  
                  <CardActions>
                    <Button 
                      size="small" 
                      startIcon={<LockOpenIcon />}
                      onClick={() => handleToggleLock(door._id)}
                    >
                      Toggle Lock
                    </Button>
                    
                    {isAdmin && (
                      <>
                        <Button 
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleEditDoor(door)}
                        >
                          Edit
                        </Button>
                        
                        <Button 
                          size="small" 
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleDeleteDoor(door._id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
      
      {/* Door Form Dialog - Placeholder (would be a separate component in a real app) */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {dialogType === 'add' ? 'Add New Door' : 'Edit Door'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ my: 2 }}>
            This is a placeholder for the door form. In a real application, this would contain fields for:
          </Typography>
          <ul>
            <li>Door Name</li>
            <li>Location</li>
            <li>Tasmota Device IP</li>
            <li>Tasmota API Key (if required)</li>
            <li>Double Verification Days</li>
            <li>Active Status</li>
          </ul>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained">
            {dialogType === 'add' ? 'Add Door' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DoorManagement;