import axios from 'axios';
import prisma from './src/lib/prisma';
import jwt from 'jsonwebtoken';
import { getEnv } from './src/lib/env';

async function testApi() {
  try {
    const teacher = await prisma.user.findFirst({ where: { role: 'teacher' } });
    if (!teacher) {
      console.log('No teacher found');
      return;
    }
    
    // Generate token similar to auth.ts
    const env = getEnv();
    const token = jwt.sign(
      { id: teacher.id, role: teacher.role },
      env.JWT_SECRET,
      { expiresIn: '1h', issuer: 'canvas-lms', audience: 'canvas-lms-users'}
    );

    console.log('Testing POST /api/courses...');
    const res = await axios.post('http://localhost:3000/api/courses', {
      title: 'Khóa học API Test',
      description: 'Test body param',
      color: 'bg-indigo-500',
      icon: 'BookOpen'
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Success!', res.status, res.data);
    
    // Cleanup
    await prisma.course.delete({ where: { id: res.data.id } });
  } catch (err: any) {
    if (err.response) {
      console.error('API Error:', err.response.status, err.response.data);
    } else {
      console.error('Network Error:', err.message);
    }
  }
}

testApi();
