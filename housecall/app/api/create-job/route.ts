// app/api/create-job/route.js
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(request: any) {
  try {
    const { customer_id, schedule } = await request.json(); // Read the job details from the request body

    const response = await axios.post('https://api.housecallpro.com/jobs', {
      customer_id,
      schedule,
    }, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Token 816e3aa168674ea18138946988fb34ff',
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: 'Failed to create job' }, { status: 500 });
  }
}
