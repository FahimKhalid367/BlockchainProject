// Import required modules
const express = require('express');
const bodyParser = require('body-parser');
const connectToMongoDB = require('./mongo');
const driver = require('bigchaindb-driver');
const cors = require('cors');
const bcrypt = require('bcrypt');
const geoip = require('geoip-lite');
const { ObjectId } = require('mongodb');

require('dotenv').config();
const nodemailer = require('nodemailer');

// 📬 Configure Nodemailer for MailerSend SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false, // Use TLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});




// Create an instance of the Express application
const app = express();
const PORT = 3001;

module.exports = app;

// Enable JSON parsing and cross-origin requests
app.use(bodyParser.json());
app.use(cors());

/**
 * Generates a new Ed25519 keypair using BigchainDB's crypto library
 */
function generateKeyPair() {
  const keypair = new driver.Ed25519Keypair();
  return keypair;
}

// Function to save a new user's data and return their private key
async function saveUserData(username, email, password) {
    const db = await connectToMongoDB();
    const collection = db.collection('users');
  
    // Check for existing user
    const existingUser = await collection.findOne({ username });
    if (existingUser) throw new Error('Username is already taken');
  
    // Hash the password securely
    const hashedPassword = await bcrypt.hash(password, 10);
  
    // Generate a new keypair (public/private wallet keys)
    const keypair = generateKeyPair();
    const publicKey = keypair.publicKey;
    const privateKey = keypair.privateKey;
  
    // Create the user document
    const user = {
      username,
      email,
      password: hashedPassword,
      publicKey,
      privateKey,
      lastLoginLocation: null
    };
  
    // Insert the new user into the database
    await collection.insertOne(user);
    console.log('User data saved to MongoDB');
  
    // Return just the private key to the caller
    return { privateKey };
  }
  
  // Route to handle registration requests
  app.post('/saveUserData', async (req, res) => {
    const { username, email, password } = req.body;
    console.log('Received registration request:', req.body);
  
    try {
      const { privateKey } = await saveUserData(username, email, password);
  
      // Respond with private key in JSON format
      res.status(200).json({
        message: 'User registered successfully',
        privateKey: privateKey
      });
    } catch (error) {
      console.error('Error during registration:', error.message);
  
      if (error.message === 'Username is already taken') {
        res.status(409).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'Internal server error' });
      }
    }
  });
  


app.post('/login', async (req, res) => {
    const { username, password, walletKey } = req.body;
    // Simulated IP address for testing location
    const loginIP = '23.54.0.1'; // 🇬🇧 London
    const loginLocation = geoip.lookup(loginIP); // Will return city + country
    console.log("Simulated login from:", loginLocation);



    try {
        const db = await connectToMongoDB();
        const collection = db.collection('users');
        const user = await collection.findOne({ username });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid username or password' });
        }

        const loginLocation = geoip.lookup(loginIP);
        const previousLocation = user.lastLoginLocation;

        // 🔍 Debug: Print locations
        console.log('Login location:', loginLocation);
        console.log('Previous login location:', previousLocation);

        if (
            previousLocation &&
            loginLocation &&
            (previousLocation.country !== loginLocation.country ||
             previousLocation.city !== loginLocation.city)
        ) {
            if (!walletKey || walletKey !== user.privateKey) {
                return res.status(401).json({
                    message: 'Wallet key verification failed',
                    requireWalletKey: true
                });
            }
        }

        // Update location after successful login
        await collection.updateOne(
            { username },
            { $set: { lastLoginLocation: loginLocation } }
        );

        // res.status(200).json({ message: 'Login successful' });
        res.status(200).json({
            message: 'Login successful',
            username: user.username,
            publicKey: user.publicKey
          });
          
          
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


/**
 * API endpoint to allow users to reset their password
 * Change password using username + private wallet key
 */

app.post('/change-password', async (req, res) => {
    const { username, privateKey, newPassword } = req.body;

    // Password strength validation function
function isStrongPassword(password) {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);
    return password.length >= minLength && hasUpper && hasLower && hasNumber && hasSymbol;
  }
  
  
    try {
      const db = await connectToMongoDB();
      const users = db.collection('users');
  
      // 1. Look up the user
      const user = await users.findOne({ username });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // 2. Verify private wallet key
      if (user.privateKey !== privateKey) {
        return res.status(401).json({ message: 'Invalid private key' });
      }

      // Check if the new password is strong enough
      if (!isStrongPassword(newPassword)) {
        return res.status(400).json({
          message: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.'
        });
      }
      
  
      // 3. Hash new password and update it
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await users.updateOne(
        { username },
        { $set: { password: hashedPassword } }
      );
      console.log(`📧 Email sent to ${user.email}: Your password was successfully changed.`);


      res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
      console.error('Password change error:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

// // Start the server on the specified port
// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });

// API endpoint to send a wallet reminder email
// This is for users who have forgotten their private key and want to be reminded
app.post('/send-wallet-reminder', async (req, res) => {
    const { email } = req.body;
  
    try {
      const db = await connectToMongoDB();
      const users = db.collection('users');
      const user = await users.findOne({ email });
  
      if (!user) {
        console.log(`Wallet reminder requested for unknown email: ${email}`);
        return res.status(200).json({
          message: 'If this email exists in our system, you will be sent a reminder email of your private key.'
        });
      }
  
      //call the function
      await transporter.sendMail({
        from: `"BlockConnect" <${process.env.EMAIL_FROM}>`,
        to: email,
        subject: 'Your BlockConnect Wallet Key',
        html: `
          <p>Hello ${user.username},</p>
          <p>You requested a reminder of your private wallet key:</p>
          <p><strong>${user.privateKey}</strong></p>
          <p>Keep this private — it’s used to verify your identity.</p>
        `
      });
  
      return res.status(200).json({
        message: 'If this email exists in our system, you will be sent a reminder email of your private key.'
      });
  
    } catch (err) {
      console.error('Error sending wallet reminder:', err);
      res.status(500).json({ message: 'An error occurred. Please try again later.' });
    }
  });
  


/**********************************User Dashboard Section ***************************************/

// API endpoint to fetch user data including posts and private key in case the user loses their private key
app.get('/getUserData/:username', async (req, res) => {
    const username = req.params.username;
  
    try {
      const db = await connectToMongoDB();
      const users = db.collection('users');
      const posts = db.collection('posts');
  
      // Find the user by username
      const user = await users.findOne({ username });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // Get posts created by this user
      const userPosts = await posts.find({ authorUsername: username }).toArray();
  
      // Respond with the private key and user's posts
      res.status(200).json({
        privateKey: user.privateKey,
        posts: userPosts
      });
    } catch (err) {
      console.error('Error fetching user data:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

  //View all posts from the timeline
app.get('/getAllPosts', async (req, res) => {
    try {
      const db = await connectToMongoDB();
      const posts = db.collection('posts');
  
      // Fetch all posts, sorted by newest first
      const allPosts = await posts.find().sort({ createdAt: -1 }).toArray();
  
      res.status(200).json(allPosts);
    } catch (err) {
      console.error('Error fetching timeline:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

// Create a new post
app.post('/createPost', async (req, res) => {
    const { authorUsername, content } = req.body;
  
    try {
      const db = await connectToMongoDB();
      const posts = db.collection('posts');
      const users = db.collection('users');
  
      // 🔍 Look up the public key for this user
      const user = await users.findOne({ username: authorUsername });
  
      // Build the post object with public key included
      const newPost = {
        authorUsername,
        publicKey: user?.publicKey || "Unknown",
        content,
        createdAt: new Date()
      };
  
      // Save the post to MongoDB
      await posts.insertOne(newPost);
  
      res.status(201).json({ message: 'Post created successfully' });
    } catch (err) {
      console.error('Error creating post:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

  //Update a post
app.put('/updatePost/:id', async (req, res) => {
  const postId = req.params.id;
  const { content, username } = req.body;

  try {
    const db = await connectToMongoDB();
    const posts = db.collection('posts');

    // Find the post by its ID
    const post = await posts.findOne({ _id: new ObjectId(postId) });
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Only the original author can update their post
    if (post.authorUsername !== username) {
      return res.status(403).json({ message: 'You are not authorised to update this post' });
    }

    // Update the post's content
    await posts.updateOne(
      { _id: new ObjectId(postId) },
      { $set: { content } }
    );

    res.status(200).json({ message: 'Post updated successfully' });
  } catch (err) {
    console.error('Error updating post:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Route to delete a post by ID (only if the user is the author)
app.delete('/deletePost/:id', async (req, res) => {
    const postId = req.params.id;
    const { username } = req.body;
  
    try {
      const db = await connectToMongoDB();
      const posts = db.collection('posts');
  
      // Look up the post by ID
      const post = await posts.findOne({ _id: new ObjectId(postId) });
      if (!post) return res.status(404).json({ message: 'Post not found' });
  
      // Only the author can delete their post
      if (post.authorUsername !== username) {
        return res.status(403).json({ message: 'You are not authorised to delete this post' });
      }
  
      // Delete the post
      await posts.deleteOne({ _id: new ObjectId(postId) });
  
      res.status(200).json({ message: 'Post deleted successfully' });
    } catch (err) {
      console.error('Error deleting post:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  

  
  



