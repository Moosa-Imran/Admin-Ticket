module.exports = function withdrawRejectTemplate(user, amount, TID, walletAddress, comment, rejectDate) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Withdrawal Request Rejected</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f9f9f9;
            margin: 0;
            padding: 20px;
        }
        .email-container {
            background-color: #ffffff;
            max-width: 600px;
            margin: 0 auto;
            border: 1px solid #dddddd;
            border-radius: 5px;
            overflow: hidden;
        }
        .header {
            background-color: #1a1a1d;
            padding: 20px;
            text-align: center;
            color: #ffffff;
        }
        .header img {
            max-width: 250px;
        }
        .content {
            padding: 20px;
            color: #333333;
        }
        .content h2 {
            color: #d9534f;
            font-size: 24px;
            margin-top: 0;
        }
        .withdrawal-details {
            font-size: 16px;
            color: #333333;
            margin: 20px 0;
        }
        .username {
            font-size: 20px;
            color: #d9534f;
            font-weight: bold;
            margin: 10px 0;
        }
        .footer {
            background-color: #f1f1f1;
            padding: 10px;
            text-align: center;
            font-size: 12px;
            color: #888888;
        }
        p a {
            color: #d9534f;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="https://cashcrown.org/asset/common/images/logo/logo.png" alt="Cash Crown Logo">
            <h1>Withdrawal Request Rejected</h1>
        </div>
        <div class="content">
            <p>Dear ${user.fname + " " + user.lname},</p>
            <h2>Unfortunately, Your Withdrawal Request Was Rejected</h2>
            <p class="withdrawal-details">
                We regret to inform you that your withdrawal request has been rejected. Here are the details:
            </p>
            <ul class="withdrawal-details">
                <li><strong>Amount:</strong> $${amount}</li>
                <li><strong>Transaction ID (TID):</strong> ${TID}</li>
                <li><strong>Wallet Address:</strong> ${walletAddress}</li>
                <li><strong>Date Rejected:</strong> ${rejectDate}</li>
            </ul>
            <p><strong>Reason for Rejection:</strong> ${comment}</p>
            <p>
                The amount you attempted to withdraw will now be available in your current profit balance.
            </p>
            <p>
                If you have any questions or need further assistance, please contact our <a href="mailto:support@cashcrown.org">Support Team</a>.
            </p>
            <p>We appreciate your understanding.<br>— The Cash Crown Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Cash Crown. All rights reserved. This is an automated message; please do not reply.</p>
        </div>
    </div>
</body>
</html>
    `;
};
