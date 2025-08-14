import React, { useState } from 'react';
import { ChevronRight, Clock, MapPin, Calendar, Plane } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';

// Load Stripe with your publishable key
const stripePromise = loadStripe("pk_test_51R9No7RtOB964nOwbCnB8DQSDfS5G66dozt3WRe0mwu3E5hwlxsObPZHYORqKrmWuVVhpn8EYUsWi075a1WYCshV00IbVFQLYi");

// Utility function to format date with correct day for 2025
const formatDateWithDay = (day, month) => {
  const monthMap = {
    "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
    "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
  };
  const date = new Date(2025, monthMap[month], parseInt(day, 10));
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${dayNames[date.getDay()]}, ${day} ${month}`;
};

// Utility function to calculate arrival date based on departure date and duration
const calculateArrivalDate = (departureDateStr, durationStr) => {
  const [, datePart] = departureDateStr.split(", "); // Ignore hardcoded day
  const [day, month] = datePart.split(" ");
  const monthMap = {
    "Jan": 0, "Feb": 1, "Mar": 2, "Apr": 3, "May": 4, "Jun": 5,
    "Jul": 6, "Aug": 7, "Sep": 8, "Oct": 9, "Nov": 10, "Dec": 11
  };
  const departureDate = new Date(2025, monthMap[month], parseInt(day, 10));

  const [hours, minutes] = durationStr.match(/(\d+)h\s*(\d+)m/).slice(1).map(Number);
  const durationMs = (hours * 60 + minutes) * 60 * 1000;
  const arrivalDate = new Date(departureDate.getTime() + durationMs);

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${arrivalDate.getDate()} ${monthNames[arrivalDate.getMonth()]} ${dayNames[arrivalDate.getDay()]}`;
};

// Updated flightDeals with unique flight codes
const flightDeals = [
  { 
    id: 1, city: "Moscow", country: "Russia", date: "Tue, 22 May", price: 8788,
    airline: "IndiGo", airlineCode: "6E", flightCode: "6E-1234", departureTime: "06:15", arrivalTime: "09:25", duration: "3h 10m",
    stops: 0, stopCities: [], cabinClass: "Economy",
    departureAirport: "Indira Gandhi International Airport (DEL)",
    arrivalAirport: "Sheremetyevo International Airport (SVO)",
    logo: "https://i.pinimg.com/474x/56/f2/3c/56f23c6ea0edbf642fce2682664b51d6.jpg",
    image: "https://i.pinimg.com/474x/29/2d/e2/292de231f2d4bb8572813423294bae60.jpg" 
  },
  { 
    id: 2, city: "Kuala Lumpur", country: "Malaysia", date: "Tue, 20 May", price: 7248,
    airline: "AirAsia", airlineCode: "AK", flightCode: "AK-5678", departureTime: "09:40", arrivalTime: "15:30", duration: "5h 50m",
    stops: 0, stopCities: ["Singapore"], cabinClass: "Economy",
    departureAirport: "Chhatrapati Shivaji Maharaj International Airport (BOM)",
    arrivalAirport: "Kuala Lumpur International Airport (KUL)",
    logo: "https://i.pinimg.com/474x/4e/28/37/4e28374b3286209b1a7da455983a8f51.jpg",
    image: "https://i.pinimg.com/474x/d4/3e/f3/d43ef32953c8cc10441255eb58a66d34.jpg" 
  },
  { 
    id: 3, city: "Muscat", country: "Oman", date: "Fri, 16 May", price: 9451,
    airline: "Oman Air", airlineCode: "WY", flightCode: "WY-9101", departureTime: "02:10", arrivalTime: "07:45", duration: "5h 35m",
    stops: 0, stopCities: [], cabinClass: "Economy",
    departureAirport: "Kempegowda International Airport (BLR)",
    arrivalAirport: "Muscat International Airport (MCT)",
    logo: "https://i.pinimg.com/474x/ba/2d/6b/ba2d6bce884e16fdcac6b29de17eca17.jpg",
    image: "https://i.pinimg.com/474x/e6/30/66/e6306613b1ecb7afc1d0b9e3e5c41a62.jpg" 
  },
  { 
    id: 4, city: "Dhaka", country: "Bangladesh", date: "Thu, 24 June", price: 9646,
    airline: "Biman Bangladesh", airlineCode: "BG", flightCode: "BG-3456", departureTime: "13:25", arrivalTime: "22:15", duration: "8h 50m",
    stops: 0, stopCities: ["Kolkata"], cabinClass: "Economy",
    departureAirport: "Sardar Vallabhbhai Patel International Airport (AMD)",
    arrivalAirport: "Hazrat Shahjalal International Airport (DAC)",
    logo: "https://i.pinimg.com/474x/1a/d0/30/1ad0301a1e8e2cfc8a465d40dfc119d8.jpg",
    image: "https://i.pinimg.com/474x/6f/64/7c/6f647c4f9940c7b9fed6cd336e537374.jpg" 
  },
  { 
    id: 5, city: "Colombo", country: "Sri Lanka", date: "Mon, 15 May", price: 11075,
    airline: "SriLankan Airlines", airlineCode: "UL", flightCode: "UL-7890", departureTime: "11:05", arrivalTime: "16:25", duration: "5h 20m",
    stops: 0, stopCities: [], cabinClass: "Economy",
    departureAirport: "Indira Gandhi International Airport (DEL)",
    arrivalAirport: "Bandaranaike International Airport (CMB)",
    logo: "https://i.pinimg.com/474x/49/b6/4a/49b64a7c09c9732c2ed8e54eb25a136f.jpg",
    image: "https://i.pinimg.com/474x/3a/84/1a/3a841a66007cae4724025e451208ef44.jpg" 
  },
  { 
    id: 6, city: "Singapore", country: "Singapore", date: "Fri, 30 May", price: 12356,
    airline: "Singapore Airlines", airlineCode: "SQ", flightCode: "SQ-2345", departureTime: "03:55", arrivalTime: "12:40", duration: "8h 45m",
    stops: 0, stopCities: ["Bangkok"], cabinClass: "Economy",
    departureAirport: "Chhatrapati Shivaji Maharaj International Airport (BOM)",
    arrivalAirport: "Singapore Changi Airport (SIN)",
    logo: "https://i.pinimg.com/474x/91/37/09/913709c8027990ce9831efa1dd44f07c.jpg",
    image: "https://i.pinimg.com/474x/1f/7a/36/1f7a36ee1580c0fc154ba480a16d5ec1.jpg" 
  },
  { 
    id: 7, city: "Bali", country: "Indonesia", date: "Fri, 28 June", price: 15450,
    airline: "Garuda Indonesia", airlineCode: "GA", flightCode: "GA-6789", departureTime: "21:05", arrivalTime: "06:45", duration: "9h 40m",
    stops: 0, stopCities: ["Jakarta"], cabinClass: "Economy",
    departureAirport: "Kempegowda International Airport (BLR)",
    arrivalAirport: "Ngurah Rai International Airport (DPS)",
    logo: "https://i.pinimg.com/474x/4d/5c/d1/4d5cd1565e04ee98ec74056275136d1e.jpg",
    image: "https://i.pinimg.com/474x/0b/40/7f/0b407f324f3948b4b5878e834d4839a2.jpg" 
  },
  { 
    id: 8, city: "Istanbul", country: "Turkey", date: "Sat, 10 May", price: 19800,
    airline: "Turkish Airlines", airlineCode: "TK", flightCode: "TK-4321", departureTime: "01:15", arrivalTime: "09:45", duration: "8h 30m",
    stops: 0, stopCities: ["Dubai"], cabinClass: "Economy",
    departureAirport: "Sardar Vallabhbhai Patel International Airport (AMD)",
    arrivalAirport: "Istanbul Airport (IST)",
    logo: "https://i.pinimg.com/474x/6a/99/ee/6a99ee843798375c5f7049316e8d31ed.jpg",
    image: "https://i.pinimg.com/474x/4d/5c/d1/4d5cd1565e04ee98ec74056275136d1e.jpg" 
  },
  { 
    id: 9, city: "Paris", country: "France", date: "Sun, 5 Jun", price: 34500,
    airline: "Air France", airlineCode: "AF", flightCode: "AF-8765", departureTime: "10:30", arrivalTime: "19:45", duration: "9h 15m",
    stops: 0, stopCities: [], cabinClass: "Economy",
    departureAirport: "Indira Gandhi International Airport (DEL)",
    arrivalAirport: "Paris Charles de Gaulle Airport (CDG)",
    logo: "https://i.pinimg.com/474x/5a/4a/a5/5a4aa5378d51b1c9da7c4e4d776b614c.jpg",
    image: "https://i.pinimg.com/474x/6a/99/ee/6a99ee843798375c5f7049316e8d31ed.jpg"
  }
];

// Correct the hardcoded days in flightDeals
flightDeals.forEach(deal => {
  const [, datePart] = deal.date.split(", ");
  const [day, month] = datePart.split(" ");
  deal.date = formatDateWithDay(day, month);
});

const FlightDealsCards = () => {
  const [showAll, setShowAll] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const visibleDeals = showAll ? flightDeals : flightDeals.slice(0, 6);

  const handleDealClick = (deal) => {
    setSelectedDeal(deal);
  };

  const closeDetailView = () => {
    setSelectedDeal(null);
  };

  const handleBookNow = async (deal) => {
    setLoading(true);
    try {
      const arrivalDate = calculateArrivalDate(deal.date, deal.duration);
      const selectedFlight = {
        id: deal.id,
        departure: "India",
        departureAirport: deal.departureAirport,
        arrival: deal.city,
        arrivalAirport: deal.arrivalAirport,
        airline: deal.airline,
        flightNumber: deal.flightCode, // Added flightCode here
        departureTime: deal.departureTime,
        arrivalTime: deal.arrivalTime,
        departureDate: deal.date,
        arrivalDate: arrivalDate,
        logo: deal.logo,
        returnFlight: null,
      };
      const selectedFare = {
        type: deal.cabinClass,
        price: deal.price,
      };
      const searchParams = {
        tripType: "oneway",
        from: "India",
        to: deal.city,
        departDate: deal.date,
        multiCityFlights: null,
      };
      const bookingDetails = { 
        selectedFlight, 
        selectedFare, 
        searchParams, 
        isFlightDeal: true 
      };
      sessionStorage.setItem("bookingDetails", JSON.stringify(bookingDetails));

      const response = await fetch("http://localhost:5002/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: deal.price * 100,
          description: `${deal.airline} Flight ${deal.flightCode} from ${deal.departureAirport} to ${deal.arrivalAirport} - ${deal.date}`, // Updated description with flightCode
          flightId: deal.id.toString(),
          fareType: deal.cabinClass,
        }),
      });

      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const { sessionId } = await response.json();
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId });
      if (error) throw new Error(`Stripe redirect error: ${error.message}`);
    } catch (error) {
      console.error("Error initiating payment:", error.message);
      alert(`Failed to initiate payment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-blue-50 min-h-screen">
      <div className="max-w-7xl container mx-auto p-4">
        <h2 className="text-2xl font-semibold mb-4 mt-5">Flight deals from India</h2>
        <p className="mb-5 text-gray-800">Here are the flight deals with the lowest prices. Act fast – they all depart within the next three months.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleDeals.map((deal) => (
            <div 
              key={deal.id} 
              onClick={() => handleDealClick(deal)}
              className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-2xl transition duration-300 cursor-pointer"
            >
              <img src={deal.image} alt={deal.city} className="w-full h-40 object-cover" />
              <div className="p-4">
                <h3 className="text-lg font-bold">{deal.city}</h3>
                <p className="text-gray-600">{deal.country}</p>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-800">{deal.date.split(", ")[1] + " " + deal.date.split(", ")[0]}</p>
                  <span className="text-gray-700">{deal.stops === 0 ? "Direct" : `${deal.stops} Stop`}</span>
                </div>
                <p className="mt-2 text-blue-600">Get now - ₹{deal.price.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <button 
            onClick={() => setShowAll(!showAll)} 
            className="text-blue-600 mt-4 mb-4 cursor-pointer font-semibold hover:underline"
          >
            {showAll ? "See fewer deals" : "See more deals"}
          </button>
        </div>

        {selectedDeal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-[#06152B] text-white p-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">{selectedDeal.city}, {selectedDeal.country}</h2>
                  <p className="text-sm text-gray-300">{selectedDeal.date.split(", ")[1] + " " + selectedDeal.date.split(", ")[0]}</p>
                </div>
                <button 
                  onClick={closeDetailView}
                  className="text-white hover:bg-red-500 p-2 rounded-full transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 cursor-pointer" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="md:w-1/5 flex items-center space-x-3">
                        <img src={selectedDeal.logo} alt={selectedDeal.airline} className="h-8 w-8 object-contain" />
                        <div>
                          <p className="font-medium">{selectedDeal.airline}</p>
                          <p className="text-sm text-gray-500">{selectedDeal.flightCode}</p> {/* Updated to show flightCode */}
                        </div>
                      </div>
                      
                      <div className="md:w-2/5 flex items-center justify-between">
                        <div className="text-center">
                          <p className="text-lg font-bold">{selectedDeal.departureTime}</p>
                          <p className="text-sm">India</p>
                          <p className="text-xs text-gray-500">({selectedDeal.departureAirport})</p>
                        </div>
                        
                        <div className="flex flex-col items-center justify-center px-4">
                          <div className="text-xs text-gray-500">{selectedDeal.duration}</div>
                          <div className="w-24 md:w-32 h-px bg-gray-300 relative my-2">
                            {selectedDeal.stops > 0 && (
                              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-400 rounded-full"></div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {selectedDeal.stops === 0 ? "Direct" : `${selectedDeal.stops} stop`}
                          </div>
                        </div>
                        
                        <div className="text-center">
                          <p className="text-lg font-bold">{selectedDeal.arrivalTime}</p>
                          <p className="text-sm">{selectedDeal.city}</p>
                          <p className="text-xs text-gray-500">({selectedDeal.arrivalAirport})</p>
                        </div>
                      </div>
                      
                      <div className="md:w-2/5 flex flex-col-reverse md:flex-row items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500">{selectedDeal.cabinClass}</p>
                          {selectedDeal.stops > 0 && (
                            <p className="text-xs text-gray-500">
                              via {selectedDeal.stopCities.join(", ")}
                            </p>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">₹{selectedDeal.price.toLocaleString()}</p>
                          <button 
                            onClick={() => handleBookNow(selectedDeal)}
                            className="mt-2 cursor-pointer bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
                            disabled={loading}
                          >
                            {loading ? "Processing..." : "Book Now"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold mb-4">Itinerary</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <Plane className="text-blue-600" size={20} />
                            <div>
                              <p className="font-medium">{selectedDeal.departureTime} • India</p>
                              <p className="text-sm text-gray-500">({selectedDeal.departureAirport})</p>
                              <p className="text-sm text-gray-500">{selectedDeal.date.split(", ")[1] + " " + selectedDeal.date.split(", ")[0]}</p>
                            </div>
                          </div>
                          {selectedDeal.stops > 0 && (
                            <div className="flex items-center gap-3 pl-6 border-l-2 border-gray-300">
                              <Clock className="text-gray-500" size={20} />
                              <p className="text-sm text-gray-600">
                                Layover in {selectedDeal.stopCities.join(", ")} • 2h 30m
                              </p>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <MapPin className="text-blue-600" size={20} />
                            <div>
                              <p className="font-medium">{selectedDeal.arrivalTime} • {selectedDeal.city}</p>
                              <p className="text-sm text-gray-500">({selectedDeal.arrivalAirport})</p>
                              <p className="text-sm text-gray-500">{calculateArrivalDate(selectedDeal.date, selectedDeal.duration)}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-4">Price Breakdown</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <p className="text-sm">Base Fare</p>
                            <p className="text-sm">₹{Math.round(selectedDeal.price * 0.8).toLocaleString()}</p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-sm">Taxes & Fees</p>
                            <p className="text-sm">₹{Math.round(selectedDeal.price * 0.2).toLocaleString()}</p>
                          </div>
                          <div className="flex justify-between font-semibold border-t pt-2">
                            <p>Total Price</p>
                            <p>₹{selectedDeal.price.toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default FlightDealsCards;