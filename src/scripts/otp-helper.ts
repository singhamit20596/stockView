#!/usr/bin/env tsx

import { provideOTP, getPendingOTPSessions } from '@/lib/otpHandler';

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('🔐 OTP Helper Script');
    console.log('');
    console.log('Usage:');
    console.log('  npm run otp:provide <otp>');
    console.log('  npm run otp:status');
    console.log('');
    console.log('Examples:');
    console.log('  npm run otp:provide 123456');
    console.log('  npm run otp:status');
    console.log('');
    console.log('Commands:');
    console.log('  provide <otp> - Provide OTP for pending session');
    console.log('  status        - Check pending OTP sessions');
    process.exit(1);
  }

  const command = args[0];

  if (command === 'provide') {
    const otp = args[1];
    if (!otp) {
      console.log('❌ Error: OTP required');
      console.log('Usage: npm run otp:provide <otp>');
      process.exit(1);
    }

    const sessionId = 'groww-session';
    const success = provideOTP(sessionId, otp);
    
    if (success) {
      console.log('✅ OTP provided successfully!');
      console.log(`📱 Session: ${sessionId}`);
      console.log(`🔢 OTP: ${otp}`);
    } else {
      console.log('❌ Failed to provide OTP');
      console.log('💡 Make sure there is a pending OTP request');
    }
  } else if (command === 'status') {
    const pendingSessions = getPendingOTPSessions();
    
    if (pendingSessions.length === 0) {
      console.log('📊 No pending OTP sessions');
    } else {
      console.log('📊 Pending OTP sessions:');
      pendingSessions.forEach(session => {
        console.log(`  - ${session}`);
      });
    }
  } else {
    console.log(`❌ Unknown command: ${command}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}
