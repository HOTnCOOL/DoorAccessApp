import { useState, useEffect } from 'react';
import {
  Typography,
  Grid,
  Paper,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  PeopleAlt as UsersIcon,
  MeetingRoom as DoorsIcon,
  Security as SecurityIcon,
  WarningAmber as WarningIcon
} from '@mui/icons-material';
import { userService, doorService, accessService } from '../../services/api';

const Dashboard = () => {
  const [statistics, setStatistics] = useState({
    users: { total: 0, active: 0, loading: true },
    doors: { total: 0, active: 0, loading: true },
    access: { 
      today: 0, 
      denied: 0,
      loading: true 
    }
  });

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        // Fetch users
        const usersResponse = await userService.getAll();
        const users = usersResponse.data.data;
        const activeUsers = users.filter(user => user.isActive).length;

        // Fetch doors
        const doorsResponse = await doorService.getAll();
        const doors = doorsResponse.data.data;
        const activeDoors = doors.filter(door => door.isActive).length;

        // Fetch access logs for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const logsResponse = await accessService.getLogs({
          startDate: today.toISOString(),
          limit: 1000
        });
        
        const logs = logsResponse.data.data;
        const accessGranted = logs.filter(log => 
          log.eventType === 'access_granted' && log.success
        ).length;
        
        const accessDenied = logs.filter(log => 
          log.eventType === 'access_attempt' && !log.success
        ).length;

        setStatistics({
          users: { 
            total: users.length,
            active: activeUsers,
            loading: false 
          },
          doors: { 
            total: doors.length,
            active: activeDoors,
            loading: false 
          },
          access: {
            today: accessGranted,
            denied: accessDenied,
            loading: false
          }
        });
      } catch (error) {
        console.error('Error fetching dashboard statistics:', error);
        // Set loading to false even on error
        setStatistics(prev => ({
          users: { ...prev.users, loading: false },
          doors: { ...prev.doors, loading: false },
          access: { ...prev.access, loading: false }
        }));
      }
    };

    fetchStatistics();
  }, []);

  // StatCard component for displaying stats
  const StatCard = ({ title, value, icon, loading, secondaryValue, secondaryLabel }) => (
    <Paper elevation={2} sx={{ height: '100%' }}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={1}>
            {icon}
            <Typography variant="h6" component="h2" ml={1}>
              {title}
            </Typography>
          </Box>
          <Divider sx={{ my: 1 }} />
          {loading ? (
            <Box display="flex" justifyContent="center" my={2}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            <>
              <Typography variant="h3" component="div" align="center" my={2}>
                {value}
              </Typography>
              {secondaryValue !== undefined && (
                <Box textAlign="center">
                  <Typography variant="body2" color="text.secondary">
                    {secondaryLabel}: {secondaryValue}
                  </Typography>
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </Paper>
  );

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Users stat */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Users"
            value={statistics.users.total}
            icon={<UsersIcon color="primary" />}
            loading={statistics.users.loading}
            secondaryValue={statistics.users.active}
            secondaryLabel="Active"
          />
        </Grid>
        
        {/* Doors stat */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Doors"
            value={statistics.doors.total}
            icon={<DoorsIcon color="secondary" />}
            loading={statistics.doors.loading}
            secondaryValue={statistics.doors.active}
            secondaryLabel="Active"
          />
        </Grid>
        
        {/* Access stat */}
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Today's Access"
            value={statistics.access.today}
            icon={<SecurityIcon color="success" />}
            loading={statistics.access.loading}
            secondaryValue={statistics.access.denied}
            secondaryLabel="Denied"
          />
        </Grid>
      </Grid>
      
      {/* Recent activity placeholder */}
      <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 4 }}>
        Recent Activity
      </Typography>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="body1">
          Recent access logs will be displayed here...
        </Typography>
      </Paper>
    </>
  );
};

export default Dashboard;