module.exports = function investRejectTemplate(user, plan, amount, TID, comment, date) {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Investment Request Rejected</title>
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
        .investment-details {
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
            <h1>Investment Request Rejected</h1>
        </div>
        <div class="content">
            <p>Dear ${user.fname + " " + user.lname},</p>
            <h2>We’re Sorry to Inform You</h2>
            <p class="investment-details">
                Unfortunately, your investment request has been rejected. Here are the details:
            </p>
            <ul class="investment-details">
                <li><strong>Investment Plan:</strong> ${plan.charAt(0).toUpperCase() + plan.slice(1)}</li>
                <li><strong>Amount:</strong> $${amount}</li>
                <li><strong>Transaction ID (TID):</strong> ${TID}</li>
                <li><strong>Date of Request:</strong> ${date}</li>
            </ul>
            <p><strong>Reason for Rejection:</strong> ${comment}</p>
            <p>
                If you believe this was a mistake or have any questions, please contact our <a href="mailto:support@cashcrown.org">Support Team</a> for further assistance.
            </p>
            <p>Thank you for understanding.<br>— The Cash Crown Team</p>
        </div>
        <div class="footer">
            <p>&copy; 2024 Cash Crown. All rights reserved. This is an automated message; please do not reply.</p>
        </div>
    </div>
</body>
</html>
    `;
};
