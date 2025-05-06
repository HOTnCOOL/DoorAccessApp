#!/bin/bash

# GitHub repository creation script
# This requires the GitHub CLI (gh) tool to be installed and authenticated

REPO_NAME="DoorAccessApp"
REPO_DESCRIPTION="A door access management application with facial recognition and code verification"
REPO_VISIBILITY="public"

# Check if gh is installed
if ! command -v gh &> /dev/null; then
    echo "GitHub CLI (gh) is not installed. Please install it first."
    exit 1
fi

# Create the repository
echo "Creating GitHub repository: $REPO_NAME"
gh repo create $REPO_NAME --public --description "$REPO_DESCRIPTION"

# Add the remote
git remote add origin https://github.com/hotncool/DoorAccessApp.git

# Push to the repository
git push -u origin master

echo "Repository created and code pushed successfully!"