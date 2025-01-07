module.exports = function withdrawSuccessTemplate(user, amount, TID, walletAddress, comment, acceptDate) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Withdrawal Fulfilled</title>
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
            color: #5cb85c;
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
            color: #5cb85c;
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
            color: #5cb85c;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <img src="https://cashcrown.org/asset/common/images/logo/logo.png" alt="Cash Crown Logo">
            <h1>Withdrawal Fulfilled</h1>
        </div>
        <div class="content">
            <p>Dear ${user.fname + " " + user.lname},</p>
            <h2>Your Withdrawal Has Been Successfully Fulfilled!</h2>
            <p class="withdrawal-details">
                We are pleased to inform you that your withdrawal request has been processed successfully. Here are the details:
            </p>
            <ul class="withdrawal-details">
                <li><strong>Amount:</strong> $${amount}</li>
                <li><strong>Transaction ID (TID):</strong> ${TID}</li>
                <li><strong>Wallet Address:</strong> ${walletAddress}</li>
                <li><strong>Date Fulfilled:</strong> ${acceptDate}</li>
            </ul>
            <p><strong>Note:</strong> ${comment}</p>
            <p>
                If you have any questions or notice any discrepancies, please reach out to our <a href="mailto:support@cashcrown.org">Support Team</a>.
            </p>
            <p>Thank you for using Cash Crown!<br>— The Cash Crown Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Cash Crown. All rights reserved. This is an automated message; please do not reply.</p>
        </div>
    </div>
</body>
</html>
    `;
};
