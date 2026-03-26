// Test script for Resend email service
// Run: node test-resend.js your@email.com

const { Resend } = require('resend');
require('dotenv').config();

const testEmail = async (toEmail) => {
  console.log('\n🧪 ===== RESEND EMAIL TEST =====\n');
  
  // Check environment variables
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  
  console.log('📋 Configuration Check:');
  console.log('  ✓ RESEND_API_KEY exists:', !!apiKey);
  console.log('  ✓ RESEND_API_KEY length:', apiKey?.length || 0);
  console.log('  ✓ RESEND_API_KEY format:', apiKey?.startsWith('re_') ? '✅ Valid (starts with re_)' : '❌ Invalid');
  console.log('  ✓ FROM_EMAIL:', fromEmail);
  console.log('  ✓ TO_EMAIL:', toEmail);
  console.log('  ✓ NODE_ENV:', process.env.NODE_ENV || 'not set');
  console.log('');
  
  if (!apiKey) {
    console.error('❌ ERROR: RESEND_API_KEY not found in .env file');
    console.log('\n💡 Solution:');
    console.log('  1. Add RESEND_API_KEY to your .env file');
    console.log('  2. Get API key from: https://resend.com/api-keys');
    process.exit(1);
  }
  
  if (!apiKey.startsWith('re_')) {
    console.error('❌ ERROR: RESEND_API_KEY format is invalid');
    console.log('\n💡 Solution:');
    console.log('  1. API key must start with "re_"');
    console.log('  2. Get a new API key from: https://resend.com/api-keys');
    process.exit(1);
  }
  
  if (!toEmail) {
    console.error('❌ ERROR: No email address provided');
    console.log('\n💡 Usage:');
    console.log('  node test-resend.js your@email.com');
    process.exit(1);
  }
  
  try {
    console.log('🚀 Initializing Resend client...');
    const resend = new Resend(apiKey);
    
    // Generate test OTP
    const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔢 Generated test OTP:', testOTP);
    console.log('');
    
    console.log('📧 Sending test email...');
    console.log('  From:', fromEmail);
    console.log('  To:', toEmail);
    console.log('');
    
    const startTime = Date.now();
    
    const { data, error } = await resend.emails.send({
      from: `Canvas LMS Test <${fromEmail}>`,
      to: [toEmail],
      subject: '🧪 Test Email - Canvas LMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #0ea5e9 0%, #3b82f6 100%); padding: 30px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🧪 Test Email</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Canvas LMS Email Service</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 30px; border: 2px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
              ✅ <strong>Email service đang hoạt động tốt!</strong>
            </p>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #0ea5e9;">
              <p style="margin: 0 0 10px 0; color: #0369a1; font-weight: bold;">Test OTP Code:</p>
              <div style="text-align: center; font-size: 36px; font-weight: bold; color: #0ea5e9; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                ${testOTP}
              </div>
            </div>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                <strong>Thông tin kỹ thuật:</strong><br>
                📧 Gửi từ: ${fromEmail}<br>
                📬 Gửi đến: ${toEmail}<br>
                ⏰ Thời gian: ${new Date().toLocaleString('vi-VN')}<br>
                🔑 API: Resend
              </p>
            </div>
            
            <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
              Nếu bạn nhận được email này, có nghĩa là cấu hình Resend đã hoạt động chính xác! 🎉
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; padding: 20px;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              Canvas LMS - AI-Powered Learning Management System<br>
              Đây là email test tự động
            </p>
          </div>
        </div>
      `
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (error) {
      console.error('❌ FAILED: Email sending failed\n');
      console.error('Error details:', JSON.stringify(error, null, 2));
      console.log('\n💡 Common issues:');
      console.log('  1. With free tier, you can only send to verified emails');
      console.log('  2. Check if your domain is verified (for custom domains)');
      console.log('  3. Check your quota: free tier = 100 emails/day');
      console.log('  4. Visit Resend Dashboard > Logs for more details');
      console.log('     https://resend.com/emails');
      process.exit(1);
    }
    
    console.log('✅ SUCCESS: Email sent successfully!\n');
    console.log('📊 Results:');
    console.log('  ✓ Email ID:', data?.id);
    console.log('  ✓ Duration:', duration + 'ms');
    console.log('  ✓ Test OTP:', testOTP);
    console.log('  ✓ Timestamp:', new Date().toISOString());
    console.log('');
    console.log('📬 Next steps:');
    console.log('  1. Check your inbox:', toEmail);
    console.log('  2. Check spam folder if not in inbox');
    console.log('  3. View in Resend Dashboard: https://resend.com/emails');
    console.log('');
    console.log('🎉 Test completed successfully!');
    console.log('\n===============================\n');
    
  } catch (error) {
    console.error('❌ CRITICAL ERROR:', error.message);
    console.error('\nStack trace:', error.stack);
    console.log('\n💡 Troubleshooting:');
    console.log('  1. Make sure "resend" package is installed: npm install resend');
    console.log('  2. Check your internet connection');
    console.log('  3. Verify API key is correct');
    process.exit(1);
  }
};

// Get email from command line argument
const toEmail = process.argv[2];

if (!toEmail) {
  console.log('\n📧 Resend Email Test Script\n');
  console.log('Usage:');
  console.log('  node test-resend.js your@email.com');
  console.log('');
  console.log('Example:');
  console.log('  node test-resend.js test@example.com');
  console.log('');
  console.log('⚠️  Note: With free tier, you can only send to the email');
  console.log('    address you used to register your Resend account.');
  console.log('');
  process.exit(1);
}

// Run the test
testEmail(toEmail);
