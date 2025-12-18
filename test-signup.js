// Test script to debug Supabase signup JSON parsing issue
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lwgnyerzimcajauxzowx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z255ZXJ6aW1jYWphdXh6b3d4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwMzU2NjUsImV4cCI6MjA4MTYxMTY2NX0.mhYD-K2YKeNcvgerc5WPWhzuItJDXzqdrCjrK69B2Ng';

const supabase = createClient(supabaseUrl, supabaseKey);

// Test signup function
async function testSignup() {
  console.log('🧪 Testing Supabase signup...');

  // Test data
  const testEmail = 'test@example.com';
  const testPassword = 'testpassword123';
  const testFullName = 'Test User';

  console.log('📧 Email:', testEmail, 'Type:', typeof testEmail);
  console.log('🔒 Password:', testPassword.substring(0, 2) + '...', 'Type:', typeof testPassword);
  console.log('👤 Full Name:', testFullName, 'Type:', typeof testFullName);

  // Convert to strings (like in our code)
  const emailStr = String(testEmail).trim();
  const passwordStr = String(testPassword);
  const fullNameStr = String(testFullName || '').trim();

  console.log('🔄 After String() conversion:');
  console.log('- emailStr:', emailStr, 'Type:', typeof emailStr);
  console.log('- passwordStr length:', passwordStr.length, 'Type:', typeof passwordStr);
  console.log('- fullNameStr:', fullNameStr, 'Type:', typeof fullNameStr);

  // Create signup payload
  const signupPayload = {
    email: emailStr,
    password: passwordStr,
    options: {
      data: {
        full_name: fullNameStr,
        display_name: fullNameStr
      }
    }
  };

  console.log('📤 Signup payload structure:');
  console.log(JSON.stringify(signupPayload, null, 2));

  try {
    console.log('🚀 Calling supabase.auth.signUp...');
    const { data, error } = await supabase.auth.signUp(signupPayload);

    if (error) {
      console.error('❌ Signup error:', error.message);
      console.error('Full error:', error);
    } else {
      console.log('✅ Signup success!');
      console.log('User:', data.user);
      console.log('Session:', data.session);
    }
  } catch (err) {
    console.error('💥 Exception:', err);
  }
}

// Run test
testSignup();
