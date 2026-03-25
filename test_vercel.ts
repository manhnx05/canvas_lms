import axios from 'axios';

async function testLiveLogin() {
  try {
    console.log('Testing live Vercel endpoint...');
    const res = await axios.post('https://canvas-lms-rust.vercel.app/api/auth/login', {
      email: 'hocsinh@gmail.com',
      password: '123456'
    });
    console.log('SUCCESS:', res.data);
  } catch (err: any) {
    if (err.response) {
      console.log('API responded with error:', err.response.status);
      console.log(JSON.stringify(err.response.data, null, 2));
    } else {
      console.log('Network/other error:', err.message);
    }
  }
}

testLiveLogin();
