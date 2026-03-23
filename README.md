      Ministry of Agriculture (MoA) Hall Booking System
*Internal Team Documentation

I have successfully migrated our Hall Booking System to a modern, decoupled architecture. We have replaced the old XAMPP setup and basic php with a React frontend and a Laravel 11 backend API.
The system now runs on a portable SQLite database. 

*System Overview

The application is split into two main parts that talk to each other over a local network:

Frontend (React): Handles the user interface, booking forms, and Admin dashboard.

Backend (Laravel): Handles database logic, security, file uploads, and email sending.

Database (SQLite): A single file (database.sqlite) that stores all our data.

*Installation & Setup

1. Prerequisites
Make sure your machine has the following:

Node.js & npm (For React)

PHP 8.2+ (For Laravel)

Composer (PHP Package Manager)

2. Backend Setup (Laravel)
Open your terminal in the moa_backend folder.

Install dependencies:

composer install

Configure your Environment:

cp .env.example .env

Email Setup: Open .env and update your Gmail credentials:

Code snippet
MAIL_USERNAME=leulabetu@gmail.com
MAIL_PASSWORD=njwalntzeeadfjxw
MAIL_FROM_ADDRESS="leulabetu@gmail.com"
Initialize Database & Seed Data:

php artisan migrate --seed

Start the Server:

php artisan serve

3. Frontend Setup (React)
Open a second terminal in the moa_frontend folder.

Install dependencies:

npm install

Start the Application:

npm start

