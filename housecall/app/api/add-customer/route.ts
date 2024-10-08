// app/api/add-customer/route.js
import axios from 'axios';
import { NextResponse } from 'next/server';

export async function POST(request: any) {
  try {
    const customer = await request.json(); // Read the customer data from the request body

    // Make the request to the third-party API
    const response = await axios.post('https://api.housecallpro.com/customers', {
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email,
      company: 'Avoca',
      notifications_enabled: false,
      mobile_number: customer.phone,
    }, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Token 816e3aa168674ea18138946988fb34ff',
      },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error adding customer:', error);
    return NextResponse.json({ error: 'Failed to add customer' }, { status: 500 });
  }
}
