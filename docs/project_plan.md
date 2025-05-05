# Door Access App - Project Plan

## Overview
This application will run on a door-mounted tablet to control door access via biometric verification and access codes. It will maintain a database of authorized users with different access levels and will integrate with a Tasmota switch to physically control the door lock.

## System Architecture

### Frontend Components
1. **Access Interface**
   - Virtual keypad for code entry
   - Camera feed display
   - Status/feedback screen
   - User registration interface

2. **Admin Panel**
   - User management dashboard
   - Access logs viewer
   - Configuration settings
   - Role-based access controls

### Backend Components
1. **User Management System**
   - Database for user profiles
   - Authentication logic
   - Role management (administrators, hosts, residents, guests)
   - Access period management

2. **Biometric Processing**
   - Face recognition service integration
   - Motion detection logic
   - Double verification system

3. **Access Control System**
   - Access rules enforcement
   - Tasmota switch integration
   - Door lock/unlock logic

4. **Logging System**
   - Activity logging
   - Image storage
   - Failed attempt tracking

## Database Schema

### Users Collection
- `_id`: Unique identifier
- `name`: User's full name
- `email`: User's email address
- `phone`: Contact number
- `role`: User role (administrator, host, resident, guest)
- `createdBy`: Reference to user who created this account
- `createdAt`: Account creation timestamp
- `accessCode`: Encrypted access code
- `faceData`: Face recognition data points
- `doors`: Array of doors the user has access to
- `accessPeriods`: Array of valid access periods
- `expirationDate`: Date when access expires
- `lastVerification`: Timestamp of last double verification

### Doors Collection
- `_id`: Unique identifier
- `name`: Door name/location
- `tasmotaIp`: IP address of associated Tasmota switch
- `tasmotaApiKey`: API key for Tasmota switch (if required)
- `doubleVerificationDays`: Days between required double verifications

### Logs Collection
- `_id`: Unique identifier
- `timestamp`: Time of event
- `doorId`: Reference to door
- `userId`: Reference to user (if identified)
- `eventType`: Type of event (approach, access attempt, successful access, etc.)
- `verificationMethod`: Method used (code, face, double)
- `success`: Boolean indicating success/failure
- `imagePath`: Path to captured image (if applicable)

## Technology Stack
- **Frontend**: React.js, Material-UI
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **Face Recognition**: TensorFlow.js/face-api.js
- **Camera Access**: WebRTC API
- **Door Control**: Tasmota API integration

## Implementation Phases
1. **Setup & Core Backend**: Project structure, database setup, basic API endpoints
2. **User Management**: Authentication, user CRUD operations, role management
3. **Access Interface**: Keypad, feedback system, basic camera integration
4. **Biometric Integration**: Face recognition, motion detection
5. **Door Control**: Tasmota integration, access rule enforcement
6. **Admin Panel**: User management interface, logs viewer
7. **Testing & Refinement**: Security testing, UX improvements