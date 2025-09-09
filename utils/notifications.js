const axios = require('axios');

// Notification service using multiple channels
const sendNotification = async (recipient, notification) => {
  try {
    const { type, message, data } = notification;
    
    switch (type) {
      case 'sms':
        return await sendSMS(recipient, message);
      case 'email':
        return await sendEmail(recipient, message, data);
      case 'push':
        return await sendPushNotification(recipient, message, data);
      case 'call':
        return await makeEmergencyCall(recipient, message);
      default:
        throw new Error('Unsupported notification type');
    }
  } catch (error) {
    console.error('Notification error:', error);
    throw error;
  }
};

// Send SMS notification
const sendSMS = async (recipient, message) => {
  try {
    // Extract phone number
    const phoneNumber = typeof recipient === 'string' ? recipient : recipient.phone || recipient.phoneNumber;
    
    if (!phoneNumber) {
      throw new Error('Phone number not provided');
    }

    // In a real implementation, integrate with SMS service like Twilio, AWS SNS, etc.
    console.log(`SMS sent to ${phoneNumber}: ${message}`);
    
    // Mock SMS API call
    if (process.env.SMS_API_KEY) {
      const response = await axios.post('https://api.smsservice.com/send', {
        to: phoneNumber,
        message: message,
        api_key: process.env.SMS_API_KEY
      });
      
      return { success: true, messageId: response.data.messageId };
    }
    
    return { success: true, messageId: 'mock_' + Date.now() };
  } catch (error) {
    console.error('SMS error:', error);
    return { success: false, error: error.message };
  }
};

// Send email notification
const sendEmail = async (recipient, message, data) => {
  try {
    const email = typeof recipient === 'string' ? recipient : recipient.email;
    
    if (!email) {
      throw new Error('Email address not provided');
    }

    const emailData = {
      to: email,
      subject: data?.subject || 'Tourist Safety Alert',
      html: generateEmailTemplate(message, data)
    };

    // In a real implementation, use nodemailer, SendGrid, AWS SES, etc.
    console.log(`Email sent to ${email}: ${message}`);
    
    return { success: true, messageId: 'email_' + Date.now() };
  } catch (error) {
    console.error('Email error:', error);
    return { success: false, error: error.message };
  }
};

// Send push notification
const sendPushNotification = async (recipient, message, data) => {
  try {
    const deviceToken = typeof recipient === 'string' ? recipient : recipient.deviceToken;
    
    const pushData = {
      to: deviceToken,
      title: data?.title || 'Tourist Safety Alert',
      body: message,
      data: data || {}
    };

    // In a real implementation, use Firebase Cloud Messaging, OneSignal, etc.
    console.log(`Push notification sent: ${message}`);
    
    return { success: true, messageId: 'push_' + Date.now() };
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
};

// Make emergency call
const makeEmergencyCall = async (recipient, message) => {
  try {
    const phoneNumber = typeof recipient === 'string' ? recipient : recipient.phone || recipient.phoneNumber;
    
    if (!phoneNumber) {
      throw new Error('Phone number not provided');
    }

    // In a real implementation, integrate with voice calling service
    console.log(`Emergency call initiated to ${phoneNumber}: ${message}`);
    
    return { success: true, callId: 'call_' + Date.now() };
  } catch (error) {
    console.error('Emergency call error:', error);
    return { success: false, error: error.message };
  }
};

// Send bulk notifications
const sendBulkNotifications = async (recipients, notification) => {
  const results = [];
  
  for (const recipient of recipients) {
    try {
      const result = await sendNotification(recipient, notification);
      results.push({ recipient, ...result });
    } catch (error) {
      results.push({ 
        recipient, 
        success: false, 
        error: error.message 
      });
    }
  }
  
  return results;
};

// Generate email template
const generateEmailTemplate = (message, data) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background-color: #d32f2f; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f5f5f5; }
            .alert { background-color: #fff3cd; padding: 15px; margin: 10px 0; border-left: 4px solid #ffc107; }
            .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Tourist Safety Alert</h1>
            </div>
            <div class="content">
                <div class="alert">
                    <strong>Alert:</strong> ${message}
                </div>
                ${data?.alertId ? `<p><strong>Alert ID:</strong> ${data.alertId}</p>` : ''}
                ${data?.location ? `<p><strong>Location:</strong> ${data.location.coordinates ? data.location.coordinates.join(', ') : 'GPS coordinates provided'}</p>` : ''}
                ${data?.touristName ? `<p><strong>Tourist:</strong> ${data.touristName}</p>` : ''}
                <p>Time: ${new Date().toLocaleString()}</p>
                <p>If this is an emergency, please contact local authorities immediately.</p>
            </div>
            <div class="footer">
                <p>Tourist Safety Monitoring System</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// WebSocket notification for real-time updates
const sendWebSocketNotification = (ws, notification) => {
  try {
    if (ws && ws.readyState === 1) { // WebSocket.OPEN
      ws.send(JSON.stringify({
        type: 'notification',
        timestamp: new Date().toISOString(),
        ...notification
      }));
      return { success: true };
    }
    return { success: false, error: 'WebSocket not connected' };
  } catch (error) {
    console.error('WebSocket notification error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendNotification,
  sendSMS,
  sendEmail,
  sendPushNotification,
  makeEmergencyCall,
  sendBulkNotifications,
  sendWebSocketNotification
};
