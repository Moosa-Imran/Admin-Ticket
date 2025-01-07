const express = require('express');
const path = require('path');
const { ObjectId } = require('mongodb'); 
const nodemailer = require('nodemailer');;
const router = express.Router();
const emailTemplates = require('./emailTemplates');
const dotenv = require('dotenv');

dotenv.config(); 


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

// Route for Fetching Investments
router.get('/investments', isAuthenticated, async (req, res) => {
    try {
        // Connect to the Investments collection in transactionsDb
        const transactionsDb = req.app.locals.transactionsDb;
        const investmentsCollection = transactionsDb.collection('Investments');

        // Fetch all documents from the Investments collection
        const investments = await investmentsCollection.find({}).toArray();

        // Send the retrieved documents as a JSON response
        res.status(200).json(investments);
    } catch (error) {
        console.error('Error fetching Investments:', error);
        res.status(500).json({ error: 'Unable to fetch Investments' });
    }
});

// Route for Fetching Withdrawals
router.get('/withdrawals', isAuthenticated, async (req, res) => {
    try {
        // Connect to the Withdrawals collection in transactionsDb
        const transactionsDb = req.app.locals.transactionsDb;
        const withdrawalsCollection = transactionsDb.collection('Withdrawals');

        // Fetch all documents from the Withdrawals collection
        const withdrawals = await withdrawalsCollection.find({}).toArray();

        // Send the retrieved documents as a JSON response
        res.status(200).json(withdrawals);
    } catch (error) {
        console.error('Error fetching Withdrawals:', error);
        res.status(500).json({ error: 'Unable to fetch Withdrawals' });
    }
});


// Login Route
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const usersDb = req.app.locals.usersDb;
    try {
        // Search for the user by username or email
        const user = await usersDb.collection('Managment').findOne({username: username});

        // If user is not found
        if (!user) {
            return res.status(401).json({status: 'invalid', message: 'Invalid username.' });
        }

        if (user.password !== password) {
            return res.status(401).json({status: 'incorrect', message: 'Incorrect password.' });
        }

        // If valid, store user session and create cookie
        req.session.user = {
            id: user._id,
            username: user.username,
        };

        // Send success response
        res.status(200).json({status: 'success', message: 'Login successful!' });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({status: 'error',  message: 'Internal server error' });
    }
});

// Route to get investments by status
router.get('/investments/status', isAuthenticated, async (req, res) => {
    const { status } = req.query;

    if (!status) {
        return res.status(400).json({ message: 'Status is required' });
    }

    try {
        const investments = await req.app.locals.transactionsDb.collection('Investments').find({ status }).toArray();

        // Return an empty array if no investments are found
        return res.status(200).json(investments);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


// Route to get investment by ID
router.get('/investments/:investId', isAuthenticated, async (req, res) => {
    const { investId } = req.params; // Get investId from URL parameters

    try {
        // Connect to the Investments collection and find the investment by ID
        const investment = await req.app.locals.transactionsDb.collection('Investments').findOne({ _id: new ObjectId(investId) });

        // Check if the investment was found
        if (!investment) {
            return res.status(404).json({ message: 'Investment not found' });
        }

        // Send the found investment as a response
        return res.status(200).json(investment);
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).json({ message: 'Internal server error' }); // Send server error response
    }
});

// Dictionary of plans and their respective amounts
const plans = {
    silver: 4,
    gold: 20,
    platinum: 65,
    diamond: 130,
    elite: 325 
};

// Dictionary of referrals and their respective amounts
const ref = {
    silver: 10,
    gold: 50,
    platinum: 150,
    diamond: 300,
    elite: 500 
};

// Update investment status route
router.put('/investmentControl/:investId', isAuthenticated, async (req, res) => {
    const investId = req.params.investId; // Extracting investment ID from route parameters
    const { status, comment } = req.query; // Extracting status and comment from query parameters

    // Check if the investment exists in the Investments collection
    const investment = await req.app.locals.transactionsDb.collection('Investments').findOne({ _id: new ObjectId(investId) });

    if (!investment) {
        return res.status(404).json({ message: 'Investment not found' });
    }

    if (status === 'rejected') {
        const { username, plan, TID, amount } = investment; 
        // Update the investment status to 'rejected' and add comment
        await req.app.locals.transactionsDb.collection('Investments').updateOne(
            { _id: new ObjectId(investId) },
            {
                $set: {
                    status: 'rejected', // Update status to 'rejected'
                    comment // Add comment to the investment document
                }
            }
        );

        res.status(200).json({ message: 'Investment rejected successfully', investmentId: investId });
        const user = await req.app.locals.usersDb.collection('Customers').findOne({ username });
        const date = new Date();
        // Send email in the background
        const emailHtml = emailTemplates.investRejectTemplate(user, plan, amount, TID, comment, date);
        transporter.sendMail({
            from: `"Cash Crown" <${process.env.EMAIL}>`,
            to: user.email,
            subject: 'Investment Rejected!',
            html: emailHtml // Use the HTML content
        }).catch(error => {
            console.error('Error sending email:', error);
        });
        return;

    } else if (status === 'active') {
        const { username, plan, TID, amount } = investment; 
        const acceptDate = new Date(); 
    
        // Update the investment status to 'active', add comment, and set acceptDate
        await req.app.locals.transactionsDb.collection('Investments').updateOne(
            { _id: new ObjectId(investId) },
            {
                $set: {
                    status: 'active', // Update status to 'active'
                    comment, // Add comment to the investment document
                    acceptDate // Add current date as 'acceptDate'
                }
            }
        );
    
        // Check if user exists in the Customers collection
        const user = await req.app.locals.usersDb.collection('Customers').findOne({ username });
    
        if (user) {
            // Calculate the ppd increment based on the plan
            const ppdIncrement = plans[plan] || 0; // Default to 0 if plan is not found in the dictionary
            const refIncrement = ref[plan] || 0; 
    
            // Check if the referral code exists and is valid
            if (user.ref.code && user.ref.code.trim() !== '' && !user.ref.paid) {
                // Get the value of user.ref.code
                const refCode = user.ref.code;
    
                // Find the referrer by username
                const referrer = await req.app.locals.usersDb.collection('Customers').findOne({ username: refCode });
    
                if (referrer) {
                    // Increment the referrer’s bonus and total count
                    await req.app.locals.usersDb.collection('Customers').updateOne(
                        { username: refCode },
                        {
                            $inc: {
                                'ref.bonus': refIncrement, // Increase the bonus by 20
                                'ref.total': 1    // Increase the total count by 1
                            }
                        }
                    );
                }
    
                // Set ref.paid to true for the original user (if the above conditions are met)
                await req.app.locals.usersDb.collection('Customers').updateOne(
                    { username },
                    {
                        $set: {
                            'ref.paid': true // Set ref.paid to true for the original user
                        }
                    }
                );
            }
    
            // User exists, update the 'ppd' field and set active to true
            await req.app.locals.usersDb.collection('Customers').updateOne(
                { username },
                {
                    $set: {
                        active: true 
                    },
                    $inc: {
                        ppd: ppdIncrement // Increment 'ppd' according to the plan
                    }
                }
            );
    
             res.status(200).json({ message: 'Investment activated successfully', investmentId: investId });
                            // Send email in the background
                            const emailHtml = emailTemplates.investSuccessTemplate(user, plan, amount, TID, comment, acceptDate);
                            transporter.sendMail({
                                from: `"Cash Crown" <${process.env.EMAIL}>`,
                                to: user.email,
                                subject: 'Investment Activated Successfully!',
                                html: emailHtml // Use the HTML content
                            }).catch(error => {
                                console.error('Error sending email:', error);
                            });
                            return;
        } else {
            return res.status(404).json({ message: 'User not found' });
        }
    }
    
    else if (status === 'delete') {
        // Delete the investment document
        await req.app.locals.transactionsDb.collection('Investments').deleteOne({ _id: new ObjectId(investId) });
        
        return res.status(200).json({ message: 'Investment deleted successfully', investmentId: investId });

    } else {
        return res.status(400).json({ message: 'Invalid status provided' });
    }
});

// Route to get withdraw by status
router.get('/withdraws/status', isAuthenticated, async (req, res) => {
    const { status } = req.query;

    if (!status) {
        return res.status(400).json({ message: 'Status is required' });
    }

    try {
        const Withdrawals = await req.app.locals.transactionsDb.collection('Withdrawals').find({ status }).toArray();

        // Return an empty array if no Withdrawals are found
        return res.status(200).json(Withdrawals);
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to get withdraw by ID
router.get('/withdraws/:withdrawId', isAuthenticated, async (req, res) => {
    const { withdrawId } = req.params; // Get withdrawId from URL parameters

    try {
        // Connect to the withdraws collection and find the withdraw by ID
        const withdraw = await req.app.locals.transactionsDb.collection('Withdrawals').findOne({ _id: new ObjectId(withdrawId) });

        // Check if the withdraw was found
        if (!withdraw) {
            return res.status(404).json({ message: 'Withdraw not found' });
        }

        // Send the found withdraw as a response
        return res.status(200).json(withdraw);
    } catch (error) {
        console.error(error); // Log the error for debugging
        return res.status(500).json({ message: 'Internal server error' }); // Send server error response
    }
});

// Update withdraw status route
router.put('/withdrawControl/:withdrawId', isAuthenticated, async (req, res) => {
    const withdrawId = req.params.withdrawId; // Extracting withdraw ID from route parameters
    const { status, comment } = req.query; // Extracting status and comment from query parameters

    try {
        // Check if the withdraw exists in the withdraws collection
        const withdraw = await req.app.locals.transactionsDb.collection('Withdrawals').findOne({ _id: new ObjectId(withdrawId) });

        if (!withdraw) {
            return res.status(404).json({ message: 'Withdraw not found' });
        }

        if (status === 'active') { 
            const { username, amount, walletAddress, TID } = withdraw; 
            const acceptDate = new Date(); 
            // Update the withdraw status to 'completed' and add comment
            await req.app.locals.transactionsDb.collection('Withdrawals').updateOne(
                { _id: new ObjectId(withdrawId) },
                {
                    $set: {
                        status: 'completed', // Update status to 'completed'
                        comment, // Add comment to the withdraw document
                        acceptDate
                    }
                }
            );

            res.status(200).json({ message: 'Withdraw accepted successfully', withdrawId: withdrawId });
            const user = await req.app.locals.usersDb.collection('Customers').findOne({ username });
            // Send email in the background
            const emailHtml = emailTemplates.withdrawSuccessTemplate(user, amount, TID, walletAddress, comment, acceptDate);
            transporter.sendMail({
                from: `"Cash Crown" <${process.env.EMAIL}>`,
                to: user.email,
                subject: 'Withdraw Fulfilled!',
                html: emailHtml // Use the HTML content
            }).catch(error => {
                console.error('Error sending email:', error);
            });
            return;

        } else if (status === 'rejected') {
            const { username, amount, walletAddress, TID } = withdraw; 
            const rejectDate = new Date(); 

            // Update the withdraw status to 'rejected', add comment, and set rejectDate
            await req.app.locals.transactionsDb.collection('Withdrawals').updateOne(
                { _id: new ObjectId(withdrawId) },
                {
                    $set: {
                        status: 'rejected', // Update status to 'rejected'
                        comment, // Add comment to the withdraw document
                        rejectDate // Add current date as 'rejectDate'
                    }
                }
            );

            // Check if user exists in the Customers collection
            const user = await req.app.locals.usersDb.collection('Customers').findOne({ username });

            if (user) {
                // User exists, update the 'profit' field
                await req.app.locals.usersDb.collection('Customers').updateOne(
                    { username },
                    {
                        $inc: {
                            profit: amount, 
                        }
                    }
                );
            } else {
                return res.status(404).json({ message: 'User not found' });
            }

            res.status(200).json({ message: 'Withdraw rejected successfully', withdrawId: withdrawId });
            // Send email in the background
            const emailHtml = emailTemplates.withdrawRejectTemplate(user, amount, TID, walletAddress, comment, rejectDate);
            transporter.sendMail({
                from: `"Cash Crown" <${process.env.EMAIL}>`,
                to: user.email,
                subject: 'Withdraw Request Rejected!',
                html: emailHtml // Use the HTML content
            }).catch(error => {
                console.error('Error sending email:', error);
            });
            return;

        } else if (status === 'delete') {
            // Delete the withdraw document
            await req.app.locals.transactionsDb.collection('Withdrawals').deleteOne({ _id: new ObjectId(withdrawId) });
            
            return res.status(200).json({ message: 'Withdraw deleted successfully', withdrawId: withdrawId });

        } else {
            return res.status(400).json({ message: 'Invalid status provided' });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


// Route for Logout
router.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: 'Logout failed. Please try again later.' });
        }
        res.clearCookie('connect.sid'); 
        res.status(200).json({ message: 'Logout successful!' });
    });
});


// Dashboard Route (Protected)
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard');
});

router.get('/pending-payments', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'pending-payments.html'));
});

router.get('/accepted-payments', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'accepted-payments.html'));
});

router.get('/rejected-payments', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'rejected-payments.html'));
});

router.get('/withdraw-pending', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'withdraw-pending.html'));
});

router.get('/withdraw-rejected', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'withdraw-rejected.html'));
});

router.get('/withdraw-accepted', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'withdraw-accepted.html'));
});

router.get('/users', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'users.html'));
});


module.exports = router;