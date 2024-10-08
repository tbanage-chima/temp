"use client";
import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";

const firstName = ["John", "Jane", "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Henry"];
const lastName = ["Doe", "Smith", "Johnson", "Brown", "Williams", "Jones", "Garcia", "Martinez", "Hernandez", "Lopez"];
const WORKING_HOURS_START = 10; // 10:00 AM
const WORKING_HOURS_END = 18;  // 6:00 PM

interface Customer {
  id?: string,
  first_name: string,
  last_name: string,
  email: string,
  phone: string,
  address: string,
}

export default function Home() {
  const [state, setState] = useState('default');
  const [customer, setCustomer] = useState<Customer>();
  const [existingCustomer, setExistingCustomer] = useState<Boolean>(false);
  const [loading, setLoading] = useState(false);
  const [customerId, setCustomerId] = useState<string>();
  const [freeSlots, setFreeSlots] = useState<{ start: Date; end: Date; }[]>([]);

  const getCustomers = async (currentCustomer: Customer) => {
    toast.loading('Fetching customers...');
    try {
      const response = await axios.get('/api/get-customers');
      const customers = response.data.customers;

      customers.forEach((customer: Customer) => {
        if (customer.email === currentCustomer.email) {
          setExistingCustomer(true);
          setCustomerId(customer.id);
        }
      });

      toast.dismiss(); // Dismisses the loading message once processing is done
    } catch (error) {
      toast.dismiss(); // Ensure loading toast is dismissed
      console.error('Error checking customer:', error);
      toast.error('Failed to fetch customers.');
    }
  }

  const isThisCustomer = async (customer: Customer) => {
    setLoading(true);
    toast.loading('Checking if customer exists...');
    await getCustomers(customer);
    toast.dismiss();
    setLoading(false);
  }

  const addCustomer = async (customer: Customer) => {
    toast.loading('Adding customer...');
    try {
      const response = await axios.post('/api/add-customer', customer, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setCustomerId(response.data.id);
      toast.dismiss();
      toast.success('Customer added successfully');
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.dismiss();
      toast.error('Failed to add customer');
    }
  }

  function getFreeSlots(bookedSlots: { scheduled_start: Date; scheduled_end: Date; }[]) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0); // Normalize to start of the day
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setUTCDate(today.getUTCDate() + 3);
  
    const freeSlots = [];
  
    // Iterate over each day in the range
    for (let day = new Date(today); day <= sevenDaysFromNow; day.setUTCDate(day.getUTCDate() + 1)) {
      for (let hour = WORKING_HOURS_START; hour < WORKING_HOURS_END; hour++) {
        const startSlot = new Date(day);
        startSlot.setUTCHours(hour, 0, 0, 0);
        
        const endSlot = new Date(startSlot);
        endSlot.setUTCHours(hour + 1);
  
        // Check if the slot is booked
        const isBooked = bookedSlots.some(slot => {
          const bookedStart = new Date(slot.scheduled_start);
          const bookedEnd = new Date(slot.scheduled_end);
          return startSlot < bookedEnd && endSlot > bookedStart; // Overlap check
        });
  
        // If the slot is not booked, add it to the free slots
        if (!isBooked) {
          freeSlots.push({
            start: startSlot,
            end: endSlot
          });
        }
      }
    }
  
    return freeSlots;
  }

  const fetchSlots = async () => {
    toast.loading('Calculating free slots...');
    setLoading(true);

    try {
      const response = await axios.get('/api/fetch-slots');
      const bookedSlots = response.data.bookedSlots;
      
      // Calculate free slots
      const freeSlotsFetched = getFreeSlots(bookedSlots);
      setFreeSlots(freeSlotsFetched);

      toast.dismiss();
      toast.success('Slots calculated successfully');
    } catch (error) {
      console.error('Error fetching slots:', error);
      toast.dismiss();
      toast.error('Some error occurred');
    } finally {
      setLoading(false);
    }
  }

  const generateRandomNumber = (min = 0, max = 9) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  }

  const generateCustomer = async () => {
    const first_name = firstName[generateRandomNumber()];
    const last_name = lastName[generateRandomNumber()];
    const email = `${first_name.toLowerCase()}.${last_name.toLowerCase()}@gmail.com`;
    const phone = '1234567890';
    const address = '123 Main St';
    setCustomer({first_name, last_name, email, phone, address});
  }

  return (
    <div className="flex flex-col p-6 bg-gray-100 min-h-screen">
      {state === 'default' && (
        <div className="mx-auto rounded-lg p-8 w-full max-w-screen-md text-center">
          <div className="flex justify-between items-center border-b-2 border-gray-300 pb-2 mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Generate A Random Customer</h1>
            <button
              onClick={() => generateCustomer()}
              className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Generate
            </button>
          </div>
          {customer && (
            <div className="mx-auto w-fit mt-6 text-left text-gray-700">
              <div className="flex gap-2 items-center">
                <h1 className="text-lg font-semibold text-gray-700">
                  Name:
                </h1>
                <span className="font-normal">{customer.first_name + " " + customer.last_name}</span>
              </div>
              <div className="flex gap-2 items-center mt-2">
                <h2 className="text-lg font-semibold text-gray-700">
                  Email:
                </h2>
                <span className="font-normal">{customer.email}</span>
              </div>
              <div className="flex gap-2 items-center mt-2">
                <h2 className="text-lg font-semibold text-gray-700">
                  Phone:
                </h2>
                <span className="font-normal">{customer.phone}</span>
              </div>
              <div className="flex gap-2 items-center mt-2">
                <h2 className="text-lg font-semibold text-gray-700">
                  Address:
                </h2>
                <span className="font-normal">{customer.address}</span>
              </div>
              <div className="flex justify-start">
                <button
                  onClick={() => {setState('customers'); isThisCustomer(customer)}}
                  className="bg-gray-900 mt-4 text-white px-4 py-2 h-10 rounded-md hover:bg-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Use this customer
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {state === 'customers' && (
        <div className="w-full max-w-screen-md mx-auto">
          <div className="py-2 border-b border-gray-300">
            <h1 className="text-xl font-semibold text-gray-700">
              <span className="font-normal text-lg text-gray-500">{customer?.first_name + " " + customer?.last_name}</span>
            </h1>
          </div>
          <div className="flex flex-col mt-4">
            {!loading && customer &&
              (existingCustomer ? 
                (
                  <div>
                    <h1 className="text-2xl border-b-2 border-gray-300 font-semibold text-gray-700 mt-6">
                      This is existing customer
                    </h1>
                    <p className="text-gray-500 mt-2">
                      This customer already exists in the system. Would you like to schedule an appointment?
                    </p>
                    <div className="flex justify-end mt-12 gap-4">
                      <button
                        onClick={() => setState('default')}
                        className="bg-gray-400 text-white px-4 py-2 h-10 rounded-md hover:bg-gray-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Back
                      </button>
                      <button
                        onClick={async () => {setState('schedule'); await fetchSlots()}}
                        className="bg-gray-900 text-white px-4 py-2 h-10 rounded-md hover:bg-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                ) : 
                (
                  <div>
                    <h1 className="text-2xl border-b-2 border-gray-300 font-semibold text-gray-700 mt-6">
                      This is a new customer
                    </h1>
                    <p className="text-gray-500 mt-2">
                      This customer does not exist in the system. Would you like to add them?
                    </p>
                    <div className="flex justify-end mt-12 gap-4">
                      <button
                        onClick={() => setState('default')}
                        className="bg-gray-400 text-white px-4 py-2 h-10 rounded-md hover:bg-gray-500 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Back
                      </button>
                      <button
                        onClick={async () => {await addCustomer(customer); setState('schedule'); await fetchSlots()}}
                        className="bg-gray-900 text-white px-4 py-2 h-10 rounded-md hover:bg-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Add Customer
                      </button>
                    </div>
                  </div>
                )
              )
            }
          </div>
        </div>
      )}
      {state === 'schedule' && (
        <div className="w-full max-w-screen-md mx-auto">
          <div className="py-2 border-b border-gray-300">
            <h1 className="text-xl font-semibold text-gray-700">
              <span className="font-normal text-lg text-gray-500">{customer?.first_name + " " + customer?.last_name}</span>
            </h1>
          </div>
          {!loading && customerId && <AvailableSlots availableSlots={freeSlots} customerId={customerId} />}
        </div>
      )}
    </div>
  );
}

interface Slot { start: Date; end: Date; }

const AvailableSlots = ({availableSlots, customerId}: {availableSlots: Slot[], customerId: string}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSlot, setSelectedSlot] = useState<Slot>();

  function isSameDate(dateTime1: Date, dateTime2: Date) {
    const date1 = new Date(dateTime1);
    const date2 = new Date(dateTime2);
  
    return (
      date1.getUTCFullYear() === date2.getUTCFullYear() &&
      date1.getUTCMonth() === date2.getUTCMonth() &&
      date1.getUTCDate() === date2.getUTCDate()
    );
  }

  const getNext7Days = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i <= 2; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date); // Format to YYYY-MM-DD
    }
    return dates;
  };

  const createJob = async () => {
    toast.loading('Scheduling job...');

    try {
      const response = await axios.post('/api/create-job', {
        customer_id: customerId,
        schedule: {
          scheduled_start: selectedSlot?.start,
          scheduled_end: selectedSlot?.end,
        }
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log(response.data);
      toast.dismiss();
      toast.success('Job scheduled successfully');
    } catch (error) {
      console.error('Error scheduling job:', error);
      toast.dismiss();
      toast.error('Failed to schedule job');
    }
  }
  
  const formatUTCTime = (date: Date) => {
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const dates = getNext7Days();

  return (
    <div className="py-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold border-b-2 border-gray-300 text-gray-700 mb-6">Available Slots</h1>
      
      <div className="grid grid-cols-4 gap-4 mb-6">
        {dates.map((date: Date, index: number) => (
          <button
            key={index}
            onClick={() => setSelectedDate(date)}
            className={`px-4 py-2 border rounded-lg ${
              isSameDate(date, selectedDate) ? 'bg-gray-500 text-white' : 'bg-white text-gray-700'
            } hover:bg-gray-400 hover:text-white transition-colors duration-200`}
          >
            {date.toDateString().split(' ').slice(0, 3).join(' ')}
          </button>
        ))}
      </div>
      
      <div className="mt-4 text-gray-700">
        {selectedDate && (
          <div className="border-2 border-gray-300 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">
              Available Slots for {selectedDate.toDateString().split(' ').slice(0, 3).join(' ')}
            </h2>
            <ul>
              {availableSlots.filter(slot => isSameDate(slot.start, selectedDate)).length > 0 ? (
                availableSlots
                  .filter(slot => isSameDate(slot.start, selectedDate))
                  .map((slot, index) => (
                    <li
                      key={index}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2 rounded-lg border-b last:border-none cursor-pointer ${
                        selectedSlot === slot ? 'bg-gray-500 text-white' : 'hover:bg-gray-200'
                      }`}
                    >
                      {formatUTCTime(slot.start)} - {formatUTCTime(slot.end)}
                    </li>
                  ))
              ) : (
                <p>No slots available for this date.</p>
              )}
            </ul>
          </div>
        )}
      </div>

      <div>
        {selectedSlot && (
          <div className="flex justify-end mt-12 gap-4">
            <button
              onClick={async () => {await createJob()}}
              className="bg-gray-900 text-white px-4 py-2 h-10 rounded-md hover:bg-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Schedule
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

