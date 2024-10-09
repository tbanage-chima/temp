"use client";
import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from 'react-places-autocomplete';

const firstName = ["John", "Jane", "Alice", "Bob", "Charlie", "David", "Eve", "Frank", "Grace", "Henry"];
const lastName = ["Doe", "Smith", "Johnson", "Brown", "Williams", "Jones", "Garcia", "Martinez", "Hernandez", "Lopez"];
const WORKING_HOURS_START = 10; // 10:00 AM
const WORKING_HOURS_END = 18;  // 6:00 PM

interface Customer {
  id?: string,
  name: string,
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

  return (
    <div className="flex flex-col p-6 bg-gray-100 min-h-screen">
      {state === 'default' && (
        <div className="mx-auto rounded-lg p-8 w-full max-w-screen-md">
          <CustomerForm setCustomer={setCustomer} setState={setState} isThisCustomer={isThisCustomer}/>
        </div>
      )}
      {state === 'customers' && (
        <div className="w-full max-w-screen-md mx-auto">
          <div className="py-2 border-b border-gray-300">
            <h1 className="text-xl font-semibold text-gray-700">
              <span className="font-normal text-lg text-gray-500">{customer?.name}</span>
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
              <span className="font-normal text-lg text-gray-500">{customer?.name}</span>
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


const CustomerForm = ({setCustomer, setState, isThisCustomer}: 
  {setCustomer: React.Dispatch<React.SetStateAction<Customer | undefined>>;
  setState: React.Dispatch<React.SetStateAction<string>>;
  isThisCustomer: (customer: Customer) => void;
  }) => {
  const [customerData, setCustomerData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [isAddressValid, setIsAddressValid] = useState(false);

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setCustomerData({ ...customerData, [name]: value });
  };

  const handleAddressChange = (address: any) => {
    setCustomerData({ ...customerData, address });
    // Reset address validity on change
    setIsAddressValid(false);
  };
  
  const handleAddressSelect = async (address: any) => {
    setCustomerData({ ...customerData, address });
    try {
      const results = await geocodeByAddress(address);
      const latLng = await getLatLng(results[0]);
      console.log('Address is valid:', results[0].formatted_address);
      console.log('Coordinates:', latLng);
  
      setIsAddressValid(true);
    } catch (error) {
      console.error('Error validating address:', error);
      setIsAddressValid(false);
      toast.error('Invalid address');
    }
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
  
    // Check if Name and Email are provided
    if (!customerData.name.trim()) {
      toast.error('Please enter a name.');
      return;
    }
  
    if (!customerData.email.trim()) {
      toast.error('Please enter an email.');
      return;
    }
  
    // Simple email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerData.email)) {
      toast.error('Please enter a valid email address.');
      return;
    }
  
    // Validate Phone Number
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(customerData.phone)) {
      toast.error('Please enter a valid 10-digit phone number.');
      return;
    }
  
    // Check if the address is valid
    if (!isAddressValid) {
      toast.error('Please enter a valid address before submitting.');
      return;
    }
  
    // If all checks pass, proceed with form submission
    toast.success('Customer data submitted successfully');
    console.log('Customer Data:', customerData);
    // Add form submission logic here (e.g., send data to a server or API)
    setCustomer(customerData);
    setState('customers');
    isThisCustomer(customerData);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full rounded-md">
      <h2 className="text-2xl text-gray-700 font-bold mb-6 border-b-2 border-gray-300">Enter Customer Data</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Name</label>
        <input
          type="text"
          name="name"
          value={customerData.name}
          onChange={handleInputChange}
          className="border text-gray-700 p-2 w-full rounded-lg bg-transparent border-gray-300 focus-visible:ring-offset-2 focus-visible:ring-gray-600 focus-visible:ring-2 focus-visible:outline-none"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Email</label>
        <input
          type="email"
          name="email"
          value={customerData.email}
          onChange={handleInputChange}
          className="border text-gray-700 p-2 w-full rounded-lg bg-transparent border-gray-300 focus-visible:ring-offset-2 focus-visible:ring-gray-600 focus-visible:ring-2 focus-visible:outline-none"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Phone</label>
        <input
          type="tel"
          name="phone"
          value={customerData.phone}
          onChange={handleInputChange}
          className="border text-gray-700 p-2 w-full rounded-lg bg-transparent border-gray-300 focus-visible:ring-offset-2 focus-visible:ring-gray-600 focus-visible:ring-2 focus-visible:outline-none"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 mb-2">Address</label>
        <PlacesAutocomplete
          value={customerData.address}
          onChange={handleAddressChange}
          onSelect={handleAddressSelect}
        >
          {({ getInputProps, suggestions, getSuggestionItemProps, loading }) => (
            <div>
              <input
                {...getInputProps({
                  placeholder: 'Enter an address...',
                  className: "border text-gray-700 p-2 w-full rounded-lg bg-transparent border-gray-300 focus-visible:ring-offset-2 focus-visible:ring-gray-600 focus-visible:ring-2 focus-visible:outline-none"
                })}
                required
              />
              <div className="shadow rounded-md text-gray-700 overflow-hidden mt-2">
                {loading && <div className="p-2">Loading...</div>}
                {suggestions.map((suggestion) => {
                  const style = suggestion.active
                    ? { backgroundColor: 'rgb(209 213 219)', cursor: 'pointer', padding: '8px' }
                    : { backgroundColor: '#ffffff', cursor: 'pointer', padding: '8px' };

                  return (
                    <div
                      {...getSuggestionItemProps(suggestion, { style })}
                      key={suggestion.placeId}
                    >
                      {suggestion.description}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </PlacesAutocomplete>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="bg-gray-900 text-white px-4 py-2 h-10 rounded-md hover:bg-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Submit
        </button>
      </div>
    </form>
  );
};
