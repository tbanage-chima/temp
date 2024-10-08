// app/api/get-customers/route.js
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Fetch data from the third-party API
    const response = await axios.get('https://api.housecallpro.com/customers?page_size=100', {
      headers: {
        Accept: 'application/json',
        Authorization: 'Token 816e3aa168674ea18138946988fb34ff',
      },
    });

    // Return the data as JSON
    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}
