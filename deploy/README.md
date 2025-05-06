# Door Access Control System

A comprehensive door access management application for a door-mounted tablet. This system manages user access through access codes and facial recognition, integrates with Tasmota-powered door locks, and provides a complete admin panel for user management.

## Features

### User Management
- Multiple user roles: administrators, hosts, residents, guests
- Role-based access control and permissions
- User credentials and biometric data management
- Access period management with expiration dates

### Access Control
- Access verification via numeric keypad or facial recognition
- Optional periodic double verification (face + code)
- Motion detection with image capture
- Integration with Tasmota switches for door lock control

### Admin Panel
- User management dashboard
- Door configuration
- Access logs and reporting
- System settings and preferences

### Security
- Encrypted access codes
- Failed attempt monitoring
- Activity logging with image capture
- Session management and timeouts

## Quick Start Installation (Recommended)

The easiest way to get started is to use our one-click installation script:

```bash
# Clone the repository
git clone https://github.com/yourusername/DoorAccessApp.git
cd DoorAccessApp

# Make the installation script executable
chmod +x install.sh

# Run the installation script
./install.sh
```

The script will guide you through a simple setup process and start the application using Docker. After installation, you can access:

- **Frontend**: http://localhost:80
- **Backend API**: http://localhost:8001
- **Admin Login**: Email: admin@example.com, Password: admin123 (change this immediately!)

## Docker Compose Setup (Manual)

If you prefer to configure Docker Compose manually:

```bash
# Clone the repository
git clone https://github.com/yourusername/DoorAccessApp.git
cd DoorAccessApp

# Start the application with Docker Compose
docker-compose up -d
```

## Manual Installation

### Prerequisites
- Node.js (v14+)
- MongoDB (v4+)
- NPM or Yarn

### Backend Setup
1. Navigate to the backend directory:
   ```
   cd DoorAccessApp/backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Copy the example .env file and modify as needed:
   ```
   cp .env.example .env
   ```

4. Start the backend server:
   ```
   npm run dev
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```
   cd DoorAccessApp/frontend/door-access-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the API URL:
   ```
   echo "VITE_API_URL=http://localhost:8001/api" > .env
   ```

4. Start the frontend development server:
   ```
   npm run dev
   ```

## Usage Guide

### Initial Login

After installation, you can log in to the admin panel with:
- Email: admin@example.com
- Password: admin123

**Important**: Change the default admin password immediately after first login.

### Setting Up the System

1. **Add Doors**: First, add the doors you want to control using the admin panel
2. **Add Users**: Create users with appropriate roles (administrators, hosts, residents, guests)
3. **Assign Access**: Grant door access to users based on their roles
4. **Configure Settings**: Set up security settings, face recognition parameters, etc.

### Using the Door Access Interface

The main screen provides:
- Keypad for access code entry
- Camera access for facial recognition
- Visual and text feedback on access attempts

## Hardware Requirements

### Tablet Requirements
- Front-facing camera for facial recognition
- Web browser with WebRTC support
- Internet connection to backend server
- Mounted securely by the door

### Door Lock Requirements
- Tasmota-compatible smart lock or switch
- Network connectivity for API access
- Proper wiring to the door lock mechanism

## License
This project is proprietary and confidential.

## Author
Your Organization Name