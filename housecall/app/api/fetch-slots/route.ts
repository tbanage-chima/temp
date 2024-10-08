// app/api/fetch-slots/route.js
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch data from the third-party API
    const response = await axios.get('https://api.housecallpro.com/jobs?page_size=100', {
      headers: {
        Accept: 'application/json',
        Authorization: 'Token 3dad8449acf144c5aa2febce00c1f9d0',
      },
    });

    // Extract the booked slots from the response
    const bookedSlots = response.data.jobs.map((job: any) => ({
      scheduled_start: job?.schedule?.scheduled_start,
      scheduled_end: job?.schedule?.scheduled_end,
    }));

    return NextResponse.json({ bookedSlots });
  } catch (error) {
    console.error('Error fetching slots:', error);
    return NextResponse.json({ error: 'Failed to fetch slots' }, { status: 500 });
  }
}
