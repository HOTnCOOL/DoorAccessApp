# Door Access App - Quick Setup Guide

This guide helps you get started with the Door Access App using our simplified installation process.

## Prerequisites

Before you begin, make sure you have:

- A computer with Docker and Docker Compose installed
- Internet connection for downloading Docker images
- (Optional) A MongoDB instance if you prefer to use your own database

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/DoorAccessApp.git
cd DoorAccessApp
```

### 2. Run the Installation Script

```bash
chmod +x install.sh
./install.sh
```

### 3. Follow the Prompts

The installation script will ask a few simple questions:

- **Use built-in MongoDB?** [Y/n]
  - Press Enter (or Y) to use the built-in MongoDB that comes with the app
  - Enter 'n' if you want to use your own MongoDB instance, then provide the connection URI

- **Admin Email** [admin@example.com]
  - Press Enter to use the default email or enter your preferred admin email

- **Admin Password** [admin123]
  - Press Enter to use the default password or enter your preferred admin password
  
- **Backend Port** [8001]
  - Press Enter to use the default port or specify a different port

- **Frontend Port** [80]
  - Press Enter to use the default port or specify a different port

### 4. Wait for Installation to Complete

The script will:
1. Configure the application based on your inputs
2. Download and build Docker images (this may take a few minutes)
3. Start all the necessary services

### 5. Access the Application

Once installation is complete, you'll see a success message with URLs:

- **Frontend**: http://localhost:80 (or your custom port)
- **Backend API**: http://localhost:8001 (or your custom port)

### 6. Log In to the Admin Panel

Use the credentials you provided during installation (or the defaults):
- Email: admin@example.com (or your custom email)
- Password: admin123 (or your custom password)

**IMPORTANT**: Change the default admin password immediately after logging in!

## Managing the Application

- **Stop the application**: `docker-compose down`
- **Start the application**: `docker-compose up -d`
- **View logs**: `docker-compose logs`
- **Update the application**: Pull latest changes and restart with Docker Compose

## Initial Setup Steps

1. After logging in, go to the "Doors" section and add your first door
2. Configure the Tasmota device IP for the door
3. Add users with appropriate roles
4. Grant door access to users
5. Test the access interface

## Troubleshooting

### Common Issues

1. **Application doesn't start**
   - Check Docker logs: `docker-compose logs`
   - Ensure ports aren't already in use on your system

2. **Cannot connect to MongoDB**
   - If using external MongoDB, check connection string
   - Ensure MongoDB is running and accessible

3. **Frontend doesn't load**
   - Check if the backend is running: `docker-compose logs backend`
   - Verify the correct API URL in frontend environment

4. **Camera doesn't work**
   - Ensure you're accessing the app via HTTPS or localhost
   - Check browser permissions for camera access

For more detailed help, refer to the full documentation in the README.md file.