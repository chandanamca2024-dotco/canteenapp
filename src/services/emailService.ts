import { supabase } from '../lib/supabase';
import RNFS from 'react-native-fs';

interface EmailReceiptParams {
  userEmail: string;
  userName: string;
  order: {
    id: string;
    tokenNumber?: number;
    timestamp: string;
    status: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
    totalPrice: number;
  };
  pdfBase64?: string;
}

export const sendReceiptEmail = async (params: EmailReceiptParams): Promise<boolean> => {
  try {
    const { userEmail, userName, order, pdfBase64 } = params;

    // Create email HTML content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; font-size: 28px; }
          .content { background: #f9f9f9; padding: 30px; }
          .order-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .order-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
          .order-row:last-child { border-bottom: none; }
          .label { color: #666; font-weight: 500; }
          .value { font-weight: bold; color: #333; }
          .token { font-size: 24px; color: #667eea; font-weight: bold; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background: #667eea; color: white; padding: 12px; text-align: left; }
          .items-table td { padding: 12px; border-bottom: 1px solid #eee; }
          .total { background: #667eea; color: white; padding: 20px; text-align: center; font-size: 20px; font-weight: bold; border-radius: 8px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🍽️ DineDesk</h1>
            <p>Your Order Receipt</p>
          </div>
          
          <div class="content">
            <h2>Hello ${userName}! 👋</h2>
            <p>Thank you for your order! Here are your order details:</p>
            
            <div class="order-details">
              <div class="order-row">
                <span class="label">Order ID:</span>
                <span class="value">${order.id.slice(0, 8)}</span>
              </div>
              ${order.tokenNumber ? `
              <div class="order-row">
                <span class="label">Token Number:</span>
                <span class="token">#${order.tokenNumber}</span>
              </div>
              ` : ''}
              <div class="order-row">
                <span class="label">Date & Time:</span>
                <span class="value">${order.timestamp}</span>
              </div>
              <div class="order-row">
                <span class="label">Status:</span>
                <span class="value" style="color: #10b981;">${order.status}</span>
              </div>
            </div>
            
            <h3>Order Items:</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${order.items.map(item => `
                  <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>₹${item.price}</td>
                    <td>₹${item.price * item.quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total">
              Total Amount: ₹${order.totalPrice}
            </div>
            
            ${order.tokenNumber ? `
            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-top: 20px; text-align: center;">
              <p style="margin: 0; color: #92400e; font-weight: 600;">
                📢 Please collect your order when token <strong>#${order.tokenNumber}</strong> is called
              </p>
            </div>
            ` : ''}
          </div>
          
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>DineDesk - Making dining delightful 🍽️</p>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log('📧 Calling Supabase Edge Function to send email...');
    let data, error, rawResponse;
    try {
      const result = await supabase.functions.invoke('send-receipt-email', {
        body: {
          to: userEmail,
          subject: `DineDesk Order Receipt - #${order.tokenNumber || order.id.slice(0, 8)}`,
          html: emailHtml,
          userName: userName,
          tokenNumber: order.tokenNumber,
        }
      });
      data = result.data;
      error = result.error;
      rawResponse = result;
    } catch (err) {
      // If the response is not valid JSON or is empty, handle gracefully
      console.error('❌ Email sending error (network or parse):', err);
      return false;
    }

    if (error) {
      console.error('❌ Email sending error:', error);
      // Log the raw response for debugging
      console.error('Raw response:', rawResponse);
      return false;
    }

    console.log('✅ Email sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send receipt email:', error);
    return false;
  }
};

// Alternative: Use a simpler approach with mailto (opens email client)
export const openEmailClient = (params: EmailReceiptParams) => {
  const { userEmail, order } = params;
  
  const subject = `DineDesk Receipt - Order #${order.tokenNumber || order.id.slice(0, 8)}`;
  const body = `
DineDesk Order Receipt
=====================

Order ID: ${order.id.slice(0, 8)}
Token Number: #${order.tokenNumber || 'N/A'}
Date: ${order.timestamp}
Status: ${order.status}

Items:
${order.items.map((item) => `• ${item.name} x${item.quantity} - ₹${item.price * item.quantity}`).join('\n')}

Total: ₹${order.totalPrice}

Thank you for your order!
  `;

  const mailto = `mailto:${userEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return mailto;
};
