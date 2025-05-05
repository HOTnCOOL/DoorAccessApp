import { useState, useEffect } from 'react';
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Alert,
  Chip,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Refresh as RefreshIcon,
  FilterList as FilterIcon,
  Image as ImageIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { accessService, doorService, userService } from '../../services/api';

const AccessLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  
  // Filter state
  const [filters, setFilters] = useState({
    doorId: '',
    userId: '',
    eventType: '',
    startDate: null,
    endDate: null
  });
  
  // Options for filters
  const [filterOptions, setFilterOptions] = useState({
    doors: [],
    users: [],
    eventTypes: [
      { value: 'approach', label: 'Approach' },
      { value: 'access_attempt', label: 'Access Attempt' },
      { value: 'access_granted', label: 'Access Granted' },
      { value: 'access_denied', label: 'Access Denied' },
      { value: 'double_verification', label: 'Double Verification' }
    ]
  });
  
  // Load logs on component mount and when filters/page change
  useEffect(() => {
    fetchLogs();
    fetchFilterOptions();
  }, [page]); // Intentionally not including filters to allow manual refresh
  
  // Fetch logs from API
  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Prepare query parameters
      const params = {
        page,
        limit: 10,
        ...filters
      };
      
      // Convert dates to ISO strings if present
      if (params.startDate) params.startDate = params.startDate.toISOString();
      if (params.endDate) params.endDate = params.endDate.toISOString();
      
      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });
      
      const response = await accessService.getLogs(params);
      setLogs(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      console.error('Error fetching logs:', error);
      setError('Failed to load access logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch options for filters
  const fetchFilterOptions = async () => {
    try {
      // Fetch doors
      const doorsResponse = await doorService.getAll();
      
      // Fetch users
      const usersResponse = await userService.getAll();
      
      setFilterOptions({
        ...filterOptions,
        doors: doorsResponse.data.data,
        users: usersResponse.data.data
      });
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters({
      ...filters,
      [field]: value
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    setPage(1); // Reset to first page
    fetchLogs();
  };
  
  // Reset filters
  const resetFilters = () => {
    setFilters({
      doorId: '',
      userId: '',
      eventType: '',
      startDate: null,
      endDate: null
    });
    setPage(1);
    fetchLogs();
  };
  
  // Handle page change
  const handlePageChange = (event, value) => {
    setPage(value);
  };
  
  // View log image
  const handleViewImage = async (logId) => {
    try {
      const response = await accessService.getLogImage(logId);
      setSelectedImage(URL.createObjectURL(response.data));
      setImageDialogOpen(true);
    } catch (error) {
      console.error('Error fetching log image:', error);
      alert('Failed to load image');
    }
  };
  
  // Format event type for display
  const formatEventType = (eventType) => {
    const eventColors = {
      approach: 'info',
      access_attempt: 'warning',
      access_granted: 'success',
      access_denied: 'error',
      double_verification: 'secondary'
    };
    
    const eventLabels = {
      approach: 'Approach',
      access_attempt: 'Attempted',
      access_granted: 'Granted',
      access_denied: 'Denied',
      double_verification: 'Double Verify'
    };
    
    return (
      <Chip 
        label={eventLabels[eventType] || eventType} 
        color={eventColors[eventType] || 'default'}
        size="small"
      />
    );
  };
  
  // Format verification method for display
  const formatVerificationMethod = (method) => {
    const methodLabels = {
      code: 'Code',
      face: 'Face',
      double: 'Double',
      none: 'None'
    };
    
    return methodLabels[method] || method;
  };
  
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Access Logs
        </Typography>
        
        <Button 
          variant="outlined" 
          startIcon={<RefreshIcon />} 
          onClick={fetchLogs}
        >
          Refresh
        </Button>
      </Box>
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" component="h2" gutterBottom>
          Filters
        </Typography>
        
        <Grid container spacing={2} alignItems="center">
          {/* Door filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="door-filter-label">Door</InputLabel>
              <Select
                labelId="door-filter-label"
                id="door-filter"
                value={filters.doorId}
                label="Door"
                onChange={(e) => handleFilterChange('doorId', e.target.value)}
              >
                <MenuItem value="">All Doors</MenuItem>
                {filterOptions.doors.map((door) => (
                  <MenuItem key={door._id} value={door._id}>
                    {door.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* User filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="user-filter-label">User</InputLabel>
              <Select
                labelId="user-filter-label"
                id="user-filter"
                value={filters.userId}
                label="User"
                onChange={(e) => handleFilterChange('userId', e.target.value)}
              >
                <MenuItem value="">All Users</MenuItem>
                {filterOptions.users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Event type filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="event-filter-label">Event Type</InputLabel>
              <Select
                labelId="event-filter-label"
                id="event-filter"
                value={filters.eventType}
                label="Event Type"
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
              >
                <MenuItem value="">All Events</MenuItem>
                {filterOptions.eventTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Date range placeholder - would use DatePicker in real app */}
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2">
              Date filters would go here (using MUI DatePicker)
            </Typography>
          </Grid>
          
          {/* Filter buttons */}
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="contained" 
              startIcon={<FilterIcon />}
              onClick={applyFilters}
              fullWidth
            >
              Apply Filters
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              startIcon={<ClearIcon />}
              onClick={resetFilters}
              fullWidth
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Logs table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Door</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell>Event</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Image</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No logs found matching the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log._id}>
                      <TableCell>
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {log.doorId?.name || 'Unknown Door'}
                      </TableCell>
                      <TableCell>
                        {log.userId?.name || 'Unknown User'}
                      </TableCell>
                      <TableCell>
                        {formatEventType(log.eventType)}
                      </TableCell>
                      <TableCell>
                        {formatVerificationMethod(log.verificationMethod)}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={log.success ? 'Success' : 'Failed'} 
                          color={log.success ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {log.imagePath && (
                          <IconButton 
                            size="small"
                            onClick={() => handleViewImage(log._id)}
                          >
                            <ImageIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination 
              count={totalPages} 
              page={page} 
              onChange={handlePageChange} 
              color="primary" 
            />
          </Box>
        </>
      )}
      
      {/* Image Dialog */}
      <Dialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        maxWidth="md"
      >
        <DialogTitle>
          Captured Image
          <IconButton
            onClick={() => setImageDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <ClearIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {selectedImage && (
            <img 
              src={selectedImage} 
              alt="Log capture" 
              style={{ maxWidth: '100%', maxHeight: '70vh' }}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AccessLogs;