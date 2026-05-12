# Reporter
**Community-Based Incident Reporting Platform**

Software Development Capstone Project
Developer: Vasileios - Panagiotis Katsoudas
Supervisor: Ioannis Vetsikas
Deree - The American College of Greece
Spring Semester 2026

A cross-platform mobile application developed for a final year Capstone project. The system allows users to collaboratively report and monitor local safety incidents through real-time geospatial data.

## Core Features
* **Incident Feed:** Three-mode filtering system including Nearby (proximity-based), Trending (engagement-based), and Safety Zones (geofenced).
* **Interactive Mapping:** Map interface utilizing dynamic markers that update color based on report verification status.
* **Safety Zones:** User-defined geographical radiuses for monitoring specific high-priority locations.
* **Verification System:** A reputation-based voting mechanism allowing the community to validate or flag reports.
* **Search:** Integrated search functionality for locating specific users and incident reports.

## Technical Stack
* **Framework:** React Native/Expo
* **Routing:** Expo Router
* **State Management:** React Context API (AuthContext and ReportsContext)
* **Location Services:** expo-location
* **Mathematics:** Haversine formula for proximity and geofencing calculations.

## Installation Instructions

1. **Extract Source Code**
   Unzip the submitted project folder and navigate to the root directory using a terminal.

2. **Install Dependencies**
   npm install

3. **Execution**
   npx expo start
   *Use the Expo Go application on a mobile device to scan the generated QR code.*

## Deployment Commands

### Android APK Generation
eas build -p android --profile preview

### iOS Simulator Build
eas build -p ios --profile simulator

## Testing Credentials
The following account is provided for evaluation and grading:

* **Email:** grading@email.com
* **Password:** grading

## Project Structure
* **/app:** Contains the primary application logic and file-based routing.
* **/components:** Reusable UI elements (SideMenu).
* **/context:** Global state management for authentication and incident data.
* **/constants:** Category and type configurations.
* **/hooks:** Custom React hooks for relative time and location logic.