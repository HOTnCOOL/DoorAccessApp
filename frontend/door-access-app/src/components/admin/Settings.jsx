import { useState } from 'react';
import {
  Typography,
  Paper,
  Box,
  Button,
  Divider,
  TextField,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  Alert,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';

const Settings = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrator';
  
  // Placeholder settings
  const [settings, setSettings] = useState({
    faceRecognition: {
      enabled: true,
      confidenceThreshold: 0.85,
      motionDetectionInterval: 1000,
    },
    security: {
      lockoutThreshold: 5,
      lockoutDuration: 15,
      sessionTimeout: 30,
    },
    notifications: {
      emailNotifications: true,
      emailRecipients: '',
      notifyOnFailedAttempts: true,
      notifyOnSuccessfulAccess: false,
    }
  });
  
  const [saved, setSaved] = useState(false);
  
  // Handle settings change
  const handleSettingsChange = (section, field, value) => {
    setSettings({
      ...settings,
      [section]: {
        ...settings[section],
        [field]: value
      }
    });
    setSaved(false);
  };
  
  // Save settings
  const handleSaveSettings = () => {
    // In a real app, this would call an API to save settings
    console.log('Saving settings:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };
  
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          System Settings
        </Typography>
        
        <Button 
          variant="contained" 
          startIcon={<SaveIcon />} 
          onClick={handleSaveSettings}
          disabled={!isAdmin}
        >
          Save Settings
        </Button>
      </Box>
      
      {saved && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Settings saved successfully!
        </Alert>
      )}
      
      {!isAdmin && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are viewing settings in read-only mode. Only administrators can modify settings.
        </Alert>
      )}
      
      <Grid container spacing={3}>
        {/* Face Recognition Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Face Recognition" 
              action={
                <IconButton aria-label="help">
                  <HelpIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.faceRecognition.enabled}
                    onChange={(e) => handleSettingsChange('faceRecognition', 'enabled', e.target.checked)}
                    disabled={!isAdmin}
                  />
                }
                label="Enable Face Recognition"
                sx={{ mb: 2, display: 'block' }}
              />
              
              <TextField
                fullWidth
                label="Confidence Threshold"
                type="number"
                value={settings.faceRecognition.confidenceThreshold}
                onChange={(e) => handleSettingsChange('faceRecognition', 'confidenceThreshold', parseFloat(e.target.value))}
                disabled={!isAdmin || !settings.faceRecognition.enabled}
                InputProps={{ inputProps: { min: 0, max: 1, step: 0.01 } }}
                helperText="Minimum confidence score to consider a face match (0-1)"
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Motion Detection Interval (ms)"
                type="number"
                value={settings.faceRecognition.motionDetectionInterval}
                onChange={(e) => handleSettingsChange('faceRecognition', 'motionDetectionInterval', parseInt(e.target.value))}
                disabled={!isAdmin || !settings.faceRecognition.enabled}
                InputProps={{ inputProps: { min: 500, step: 100 } }}
                helperText="Milliseconds between motion detection checks"
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Security Settings */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Security Settings" 
              action={
                <IconButton aria-label="help">
                  <HelpIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              <TextField
                fullWidth
                label="Failed Attempt Lockout Threshold"
                type="number"
                value={settings.security.lockoutThreshold}
                onChange={(e) => handleSettingsChange('security', 'lockoutThreshold', parseInt(e.target.value))}
                disabled={!isAdmin}
                InputProps={{ inputProps: { min: 1, step: 1 } }}
                helperText="Number of failed attempts before temporary lockout"
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Lockout Duration (minutes)"
                type="number"
                value={settings.security.lockoutDuration}
                onChange={(e) => handleSettingsChange('security', 'lockoutDuration', parseInt(e.target.value))}
                disabled={!isAdmin}
                InputProps={{ inputProps: { min: 1, step: 1 } }}
                helperText="Duration of lockout after failed attempts"
                margin="normal"
              />
              
              <TextField
                fullWidth
                label="Session Timeout (minutes)"
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) => handleSettingsChange('security', 'sessionTimeout', parseInt(e.target.value))}
                disabled={!isAdmin}
                InputProps={{ inputProps: { min: 1, step: 1 } }}
                helperText="Admin session timeout duration"
                margin="normal"
              />
            </CardContent>
          </Card>
        </Grid>
        
        {/* Notification Settings */}
        <Grid item xs={12}>
          <Card>
            <CardHeader 
              title="Notification Settings" 
              action={
                <IconButton aria-label="help">
                  <HelpIcon />
                </IconButton>
              }
            />
            <Divider />
            <CardContent>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onChange={(e) => handleSettingsChange('notifications', 'emailNotifications', e.target.checked)}
                    disabled={!isAdmin}
                  />
                }
                label="Enable Email Notifications"
                sx={{ mb: 2, display: 'block' }}
              />
              
              <TextField
                fullWidth
                label="Email Recipients"
                placeholder="email1@example.com, email2@example.com"
                value={settings.notifications.emailRecipients}
                onChange={(e) => handleSettingsChange('notifications', 'emailRecipients', e.target.value)}
                disabled={!isAdmin || !settings.notifications.emailNotifications}
                helperText="Comma-separated list of email recipients"
                margin="normal"
              />
              
              <Box sx={{ mt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.notifyOnFailedAttempts}
                      onChange={(e) => handleSettingsChange('notifications', 'notifyOnFailedAttempts', e.target.checked)}
                      disabled={!isAdmin || !settings.notifications.emailNotifications}
                    />
                  }
                  label="Notify on Failed Access Attempts"
                />
              </Box>
              
              <Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.notifications.notifyOnSuccessfulAccess}
                      onChange={(e) => handleSettingsChange('notifications', 'notifyOnSuccessfulAccess', e.target.checked)}
                      disabled={!isAdmin || !settings.notifications.emailNotifications}
                    />
                  }
                  label="Notify on Successful Access"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Save button at bottom */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
        <Button 
          variant="contained" 
          startIcon={<SaveIcon />} 
          onClick={handleSaveSettings}
          disabled={!isAdmin}
          size="large"
        >
          Save All Settings
        </Button>
      </Box>
    </>
  );
};

export default Settings;