# BlockConnect

BlockConnect is a secure, blockchain-inspired social platform where users can register, log in, post statements, and manage their profiles using private wallet keys. Built as a university project with real-world authentication and location verification, it showcases strong security and personalisation.

---

## Features

- **User Registration & Login**  
  Users create accounts with email, password, and auto-generated wallet key pairs (private + public keys).

- **GeoIP Location Verification**  
  Users must provide their private wallet key if logging in from a new location for added security.

- **Password Reset with Verification**  
  Users can reset their password using their username and private wallet key.

- **Email Wallet Key Reminders**  
  Secure modal lets users request their wallet key to be emailed if they forget it.

- **User Dashboard**  
  - Displays personal posts and wallet key
  - Allows users to create, edit, and delete their own posts
  - Supports multi-photo uploads per post
  - Timeline shows posts from all users

- **Image Uploads**  
  Upload multiple images per post with same-size display and click-to-enlarge modals.

- **Password Strength Enforcement**  
  Users must choose strong passwords with uppercase, lowercase, number, and symbol.

---

## Tech Stack

- **Frontend:** HTML, CSS, Bootstrap, JavaScript  
- **Backend:** Node.js, Express  
- **Database:** MongoDB (with MongoDB Atlas)  
- **Email Service:** MailerSend SMTP  
- **Blockchain Key Generation:** BigchainDB Driver  
- **Geolocation:** geoip-lite
- **Security:** bcrypt (password hashing)

---

## Installation

- **How to start the Server**
  Start server.js
  Once you have started the server.js file, the project will be ready to use/test. 
  Simply "run" the server.js file in order to do this.

## When testing

- **How to unit test and integration test**
  In Command Prompt, navigate to your project folder e.g., cd "C:\Users\fahim\Project Code"
  Once you are in the directory, run jest using "npx jest" in command prompt

    **Note** YOU MAY NEED TO TEMPORARILY ALLOW SCRIPT EXECUTION FOR UNIT TESTING AND INTEGRATION TESTING (COMMAND BELOW)
  
      Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass



   
