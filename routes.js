const express = require('express');
const path = require('path');
const { ObjectId } = require('mongodb');
const multer = require('multer');
const nodemailer = require('nodemailer');;
const router = express.Router();
const emailTemplates = require('./emailTemplates');
const dotenv = require('dotenv');

dotenv.config();

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/', 'application/pdf'];
    if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
        cb(null, true);
    } else {
        cb(new Error('Only image and PDF files are allowed!'), false);
    }
};

const upload = multer({ storage, fileFilter });


// Protected Route Middleware
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    } else {
        return res.redirect('/');
    }
}

// Create a transporter using Namecheap SMTP settings
const transporter = nodemailer.createTransport({
    host: "smtp.privateemail.com",
    port: 587,
    secure: false, // Set to true if using port 465
    auth: {
        user: process.env.EMAIL, // Email from your .env file
        pass: process.env.PASSWORD // Password from your .env file
    }
});

// Route for Fetching User's Detials
router.get('/fetchUser', async (req, res) => {
    // Get the user ID from the session
    const userId = req.session.user ? req.session.user.id : null;
    const usersDb = req.app.locals.usersDb;

    try {
        // Check if the user ID exists
        if (!userId) {
            return res.status(401).json({ status: false, message: 'User not authenticated.' });
        }

        // Search for the user in the Customers collection
        const user = await usersDb.collection('Admin').findOne({ _id: new ObjectId(userId) });
        if (user) {
            // If user is found, send the user data along with status
            res.status(200).json({ status: true, user });
        } else {
            // If user does not exist, send status false
            res.status(404).json({ status: false, message: 'User not found.' });
        }
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ status: false, message: 'Internal server error' });
    }
});

// Route for Fetching Users
router.get('/allusers', isAuthenticated, async (req, res) => {
    try {
        // Connect to the Customers collection in userDb
        const userDb = req.app.locals.usersDb;
        const customersCollection = userDb.collection('Customers');

        // Fetch all documents from the Customers collection
        const customers = await customersCollection.find({}).toArray();

        // Send the retrieved documents as a JSON response
        res.status(200).json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Unable to fetch customers' });
    }
});

// Route for Fetching Tickets
router.get('/alltickets', isAuthenticated, async (req, res) => {
    try {
        // Connect to the All collection in ticketsDb
        const ticketsDb = req.app.locals.ticketsDb;
        const ticketsCollection = ticketsDb.collection('All');

        // Fetch all documents from the All collection
        const tickets = await ticketsCollection.find({}).toArray();

        // Send the retrieved documents as a JSON response
        res.status(200).json(tickets);
    } catch (error) {
        console.error('Error fetching tickets:', error);
        res.status(500).json({ error: 'Unable to fetch tickets' });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const usersDb = req.app.locals.usersDb;
    try {
        // Search for the user by username or email
        const user = await usersDb.collection('Admin').findOne({ username: username });

        // If user is not found
        if (!user) {
            return res.status(401).json({ status: 'invalid', message: 'Invalid username.' });
        }

        if (user.password !== password) {
            return res.status(401).json({ status: 'incorrect', message: 'Incorrect password.' });
        }

        // If valid, store user session and create cookie
        req.session.user = {
            id: user._id,
            username: user.username,
        };

        // Send success response
        res.status(200).json({ status: 'success', message: 'Login successful!' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
});

// Route to get tickets by status
router.get('/tickets/status', isAuthenticated, async (req, res) => {
    const { status } = req.query;

    if (!status) {
        return res.status(400).json({ message: 'Status is required' });
    }

    try {
        const tickets = await req.app.locals.ticketsDb.collection('All').find({ status }).toArray();

        // Return an empty array if no tickets are found
        return res.status(200).json(tickets);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Route for sending messages in a ticket conversation
router.post('/ticket/:ticketNo/message', async (req, res) => {
    try {
        const { ticketNo } = req.params;
        const { sender, message } = req.body;
        
        const ticket = await req.app.locals.ticketsDb.collection('All').findOne({ ticketNo });

        if (!ticket) {
            return res.status(404).json({ status: 'error', message: 'Ticket not found' });
        }

        const newMessage = {
            sender,
            message,
            timestamp: new Date()
        };

        // Push the new message to the conversation array
        await req.app.locals.ticketsDb.collection('All').updateOne(
            { ticketNo },
            { $push: { conversation: newMessage }, $set: { status: 'Open' } }
        );

        res.json({ status: 'ok', message: 'Message sent' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Something went wrong' });
    }
});

// Route for file upload in a ticket conversation
router.post('/ticket/:ticketNo/file-upload', upload.single('file'), async (req, res) => {
    try {
        const { ticketNo } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ status: 'error', message: 'No file uploaded' });
        }

        // Fetch the ticket from the database
        const ticket = await req.app.locals.ticketsDb.collection('All').findOne({ ticketNo });

        if (!ticket) {
            return res.status(404).json({ status: 'error', message: 'Ticket not found' });
        }

        // Create the message with the file prefix
        const newMessage = {
            sender: 'agent', 
            message: `$$file:=>${file.filename}`, // Prefix to indicate a file
            timestamp: new Date()
        };

        // Push the new message to the conversation array
        await req.app.locals.ticketsDb.collection('All').updateOne(
            { ticketNo },
            { $push: { conversation: newMessage }, $set: { status: 'Open' } }
        );

        res.json({ status: 'ok', message: 'File uploaded as message' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Something went wrong' });
    }
});

// Route to resolve a ticket
router.post('/ticket/:ticketNo/resolve', async (req, res) => {
    try {
        const ticketNo = req.params.ticketNo;
        const { status } = req.body;

        // Update the ticket status to "Resolved"
        const result = await req.app.locals.ticketsDb.collection('All').updateOne(
            { ticketNo },
            { $set: { status } }
        );

        if (result.modifiedCount > 0) {
            res.json({ status: 'ok' });
        } else {
            res.status(400).json({ status: 'error', message: 'Ticket not found or already resolved' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: 'Something went wrong' });
    }
});


// Route for Logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed. Please try again later.' });
        }
        res.clearCookie('connect.sid');
        res.status(200).json({ logout: true, message: 'Logout successful!' });
    });
});


// Dashboard Route (Protected)
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard');
});

router.get('/users', isAuthenticated, (req, res) => {
    res.render('users');

});

// Route to handle viewing a specific ticket
router.get('/ticket', async (req, res) => {
    try {
        const userId = req.session.user;
        const usersDb = req.app.locals.usersDb;
        const user = await usersDb.collection('Customers').findOne({ _id: new ObjectId(userId) });
        const { tid } = req.query; // Get the ticket number from the query string

        // Fetch the ticket from the database
        const ticket = await req.app.locals.ticketsDb.collection('All').findOne({ ticketNo: tid });

        if (!ticket) {
            return res.status(404).render('error', { message: 'Ticket not found' });
        }

        // Render the ticket details page and pass the ticket data
        res.render('ticket-details', { ticket, user });
    } catch (error) {
        console.error(error);
        res.status(500).render('error', { message: 'Something went wrong, please try again later.' });
    }
});

router.get('/pending-tickets', isAuthenticated, (req, res) => {
    res.render('pending-tickets');
});

router.get('/resolved-tickets', isAuthenticated, (req, res) => {
    res.render('resolved-tickets');
});




module.exports = router;