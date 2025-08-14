import React from "react";
import { useState, useEffect } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import Header from "./components/Header";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SearchSection from "./components/SearchSection";
import SignUp from "./components/Signup";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import ForgotPassword from "./components/ForgotPassword";
import CarHire from "./components/Carhire";
import Hotels from "./components/Hotels";
import FeaturesSection from "./components/FeaturesSection";
import HotelSearch from "./components/HotelSearch";
import Favorite from "./components/Favorite";
import FlightData from "./components/FlightData";
import FlightCart from "./components/FlightCart";
import BookingConfirmation from "./components/BookingConfirmation";
import HotelCard from "./components/HotelCard";
import HotelFilter from "./components/HotelFilter";
import HotelDetails from "./components/HotelDetails";
import HotelBooking from "./components/HotelBooking";
import FlightBookingHistory from "./components/FlightBookingHistory";
import HotelBookingHistory from "./components/HotelBookingHistory";
import CabBookingHistory from "./components/CabBookingHistory";
import CabBookingConfirmation from "./components/CabBookingConfirmation";
import CarHireFAQ from "./components/CarHireFAQ";
import CarConfirmation from "./components/CarConfirmation";
import Cancel from "./components/Cancel";
import CarCard from "./components/CarCard";
import CabListing from "./components/CabListing";
import IndividualHotelDeals from "./components/IndividualHotelDeals";
import TermsAndConditions from "./components/TermsAndConditions";
import SwiperPopularCarDeals from "./components/SwiperPopularCarDeals";
import CountryFacts from "./components/CountryFacts.jsx"; 
import RegionalSettings from "./components/RegionalSettings.jsx";
import Help from "./components/Help.jsx";
import PrivacyPolicy from "./components/PrivacyPolicy.jsx";

const initialFlightData = [
  {
    id: 1,
    price: 8000, 
    departureDate: "2025-04-15",
    cabinClass: "Economy",
    isFavorite: false,
    airline: "IndiGo",
    airlineCode: "6E",
    flightNumber: "231",
    departureTime: "08:00",
    arrivalTime: "10:15",
    duration: "2h 15m",
    stops: 0,
    stopCities: [],
    departure: "Delhi",
    arrival: "Mumbai",
    logo: "https://i.pinimg.com/474x/e9/82/55/e98255f2c1040c38dd2314a6288f1850.jpg",
  },
  {
    id: 2,
    price: 12000,
    departureDate: "2025-04-15",
    cabinClass: "Economy",
    isFavorite: false,
    airline: "Air India",
    airlineCode: "AI",
    flightNumber: "102",
    departureTime: "09:30",
    arrivalTime: "12:00",
    duration: "2h 30m",
    stops: 0,
    stopCities: [],
    departure: "Delhi",
    arrival: "Mumbai",
    logo: "https://i.pinimg.com/736x/dd/f1/ce/ddf1ceee59fd228201084a162cbfb48c.jpg",
  },
  {
    id: 3,
    price: 10000, 
    departureDate: "2025-04-15",
    cabinClass: "Economy",
    isFavorite: false,
    airline: "SpiceJet",
    airlineCode: "SG",
    flightNumber: "123",
    departureTime: "07:45",
    arrivalTime: "10:30",
    duration: "2h 45m",
    stops: 0,
    stopCities: [],
    departure: "Delhi",
    arrival: "Chennai",
    logo: "https://i.pinimg.com/474x/1f/5c/77/1f5c77cbff120399a8e50b101329a039.jpg",
  },
  {
    id: 4,
    price: 15000, 
    departureDate: "2025-04-15",
    cabinClass: "Economy",
    isFavorite: false,
    airline: "Vistara",
    airlineCode: "UK",
    flightNumber: "945",
    departureTime: "12:00",
    arrivalTime: "14:30",
    duration: "2h 30m",
    stops: 0,
    stopCities: [],
    departure: "Bengaluru",
    arrival: "Delhi",
    logo: "https://i.pinimg.com/474x/6b/d3/8c/6bd38cd030c054f5ea2c5d16974d7fbb.jpg",
  },
  {
    id: 5,
    price: 11500,
    departureDate: "2025-04-15",
    cabinClass: "Economy",
    isFavorite: false,
    airline: "Air India",
    airlineCode: "AI",
    flightNumber: "789",
    departureTime: "14:00",
    arrivalTime: "16:20",
    duration: "2h 20m",
    stops: 0,
    stopCities: [],
    departure: "Kolkata",
    arrival: "Delhi",
    logo: "https://i.pinimg.com/736x/dd/f1/ce/ddf1ceee59fd228201084a162cbfb48c.jpg",
  },
  {
    id: 6,
    price: 8200, 
    departureDate: "2025-04-15",
    cabinClass: "Economy",
    isFavorite: false,
    airline: "IndiGo",
    airlineCode: "6E",
    flightNumber: "456",
    departureTime: "06:30",
    arrivalTime: "07:45",
    duration: "1h 15m",
    stops: 0,
    stopCities: [],
    departure: "Chennai",
    arrival: "Hyderabad",
    logo: "https://i.pinimg.com/474x/e9/82/55/e98255f2c1040c38dd2314a6288f1850.jpg",
  },
  {
    id: 7,
    price: 9500, 
    departureDate: "2025-04-15",
    cabinClass: "Economy",
    isFavorite: false,
    airline: "SpiceJet",
    airlineCode: "SG",
    flightNumber: "789",
    departureTime: "11:00",
    arrivalTime: "12:15",
    duration: "1h 15m",
    stops: 0,
    stopCities: [],
    departure: "Mumbai",
    arrival: "Goa",
    logo: "https://i.pinimg.com/474x/1f/5c/77/1f5c77cbff120399a8e50b101329a039.jpg",
  },
  {
    id: 8,
    price: 14500,
    departureDate: "2025-04-15",
    cabinClass: "Economy",
    isFavorite: false,
    airline: "Vistara",
    airlineCode: "UK",
    flightNumber: "821",
    departureTime: "15:30",
    arrivalTime: "17:00",
    duration: "1h 30m",
    stops: 0,
    stopCities: [],
    departure: "Delhi",
    arrival: "Ahmedabad",
    logo: "https://i.pinimg.com/474x/6b/d3/8c/6bd38cd030c054f5ea2c5d16974d7fbb.jpg",
  },
  {
    id: 9,
    price: 8300, 
    departureDate: "2025-04-15",
    cabinClass: "Economy",
    isFavorite: false,
    airline: "IndiGo",
    airlineCode: "6E",
    flightNumber: "987",
    departureTime: "13:00",
    arrivalTime: "14:10",
    duration: "1h 10m",
    stops: 0,
    stopCities: [],
    departure: "Hyderabad",
    arrival: "Bengaluru",
    logo: "https://i.pinimg.com/474x/e9/82/55/e98255f2c1040c38dd2314a6288f1850.jpg",
  },
  {
    id: 10,
    price: 11800, 
    departureDate: "2025-04-15",
    cabinClass: "Economy",
    isFavorite: false,
    airline: "Air India",
    airlineCode: "AI",
    flightNumber: "543",
    departureTime: "17:00",
    arrivalTime: "19:15",
    duration: "2h 15m",
    stops: 0,
    stopCities: [],
    departure: "Delhi",
    arrival: "Kolkata",
    logo: "https://i.pinimg.com/736x/dd/f1/ce/ddf1ceee59fd228201084a162cbfb48c.jpg",
  },
  {
    id: 11,
    price: 9000, 
    departureDate: "2025-04-15",
    cabinClass: "Economy",
    isFavorite: false,
    airline: "SpiceJet",
    airlineCode: "SG",
    flightNumber: "654",
    departureTime: "08:15",
    arrivalTime: "09:10",
    duration: "55m",
    stops: 0,
    stopCities: [],
    departure: "Bengaluru",
    arrival: "Chennai",
    logo: "https://i.pinimg.com/474x/1f/5c/77/1f5c77cbff120399a8e50b101329a039.jpg",
  },
  {
    id: 12,
    price: 14800, 
    departureDate: "2025-04-15",
    cabinClass: "Economy",
    isFavorite: false,
    airline: "Vistara",
    airlineCode: "UK",
    flightNumber: "673",
    departureTime: "19:00",
    arrivalTime: "21:15",
    duration: "2h 15m",
    stops: 0,
    stopCities: [],
    departure: "Mumbai",
    arrival: "Delhi",
    logo: "https://i.pinimg.com/474x/6b/d3/8c/6bd38cd030c054f5ea2c5d16974d7fbb.jpg",
  },
  {
    id: 13,
    price: 8100, 
    departureDate: "2025-04-15",
    cabinClass: "Economy",
    isFavorite: false,
    airline: "IndiGo",
    airlineCode: "6E",
    flightNumber: "741",
    departureTime: "10:00",
    arrivalTime: "12:10",
    duration: "2h 10m",
    stops: 0,
    stopCities: [],
    departure: "Pune",
    arrival: "Delhi",
    logo: "https://i.pinimg.com/474x/e9/82/55/e98255f2c1040c38dd2314a6288f1850.jpg",
  },
  {
    id: 14,
    price: 12200, 
    departureDate: "2025-04-15",
    cabinClass: "Economy",
    isFavorite: false,
    airline: "Air India",
    airlineCode: "AI",
    flightNumber: "321",
    departureTime: "16:30",
    arrivalTime: "18:30",
    duration: "2h 00m",
    stops: 0,
    stopCities: [],
    departure: "Chennai",
    arrival: "Mumbai",
    logo: "https://i.pinimg.com/736x/dd/f1/ce/ddf1ceee59fd228201084a162cbfb48c.jpg",
  },
  {
    id: 15,
    price: 9200, 
    departureDate: "2025-04-15",
    cabinClass: "Economy",
    isFavorite: false,
    airline: "SpiceJet",
    airlineCode: "SG",
    flightNumber: "987",
    departureTime: "09:00",
    arrivalTime: "10:00",
    duration: "1h 00m",
    stops: 0,
    stopCities: [],
    departure: "Delhi",
    arrival: "Jaipur",
    logo: "https://i.pinimg.com/474x/1f/5c/77/1f5c77cbff120399a8e50b101329a039.jpg",
  },
];


function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [mockUsers, setMockUsers] = useState(() => {
    const savedMockUsers = localStorage.getItem("mockUsers");
    return savedMockUsers
      ? JSON.parse(savedMockUsers)
      : [
          {
            username: "testuser",
            email: "test@example.com",
            password: "Password123",
          },
        ];
  });

  const [allFlights, setAllFlights] = useState(initialFlightData);
  const [tripType, setTripType] = useState("oneway");
  const [returnDate, setReturnDate] = useState("");

  useEffect(() => {
    if (user) {
      localStorage.setItem("user", JSON.stringify(user));
    } else {
      localStorage.removeItem("user");
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem("mockUsers", JSON.stringify(mockUsers));
  }, [mockUsers]);

  const handleSignUp = (userData) => {
    const completeUserData = {
      ...userData,
      password: userData.password || "google-auth",
    };
    setMockUsers((prev) => [...prev, completeUserData]);
    setUser({ username: userData.username, email: userData.email });
  };

  const handleLogin = (userData) => {
    setUser(userData);
  };

  // const handleLogout = () => {
  //   setUser(null);
  // };

  return (
    <GoogleOAuthProvider clientId="903553660853-d2uiue8osd3cjshdgidtd2hq3pge2sce.apps.googleusercontent.com">
      <Router>
        <Header
          user={user}
          // handleLogout={handleLogout}
          allFlights={allFlights}
          tripType={tripType}
          returnDate={returnDate}
        />
        <Routes>
          <Route
            path="/login"
            element={<Login onLogIn={handleLogin} mockUsers={mockUsers} />}
          />
          <Route
            path="/signup"
            element={<SignUp onSignUp={handleSignUp} mockUsers={mockUsers} />}
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/forgot-password"
            element={
              <ForgotPassword
                mockUsers={mockUsers}
                setMockUsers={setMockUsers}
              />
            }
          />
          <Route path="/carhire" element={<CarHire />} />
          <Route
            path="/flight-cart"
            element={<FlightCart user={user} />} // Pass user to FlightCart
          />
          <Route
            path="/search-results"
            element={
              <FlightData
                allFlights={allFlights}
                setAllFlights={setAllFlights}
                tripType={tripType}
                setTripType={setTripType}
                returnDate={returnDate}
                setReturnDate={setReturnDate}
              />
            }
          />
          <Route path="/" element={<SearchSection />} />
          <Route path="/features" element={<FeaturesSection />} />
          <Route path="/hotel-search" element={<HotelSearch />} />
          {/* <Route path="/car-confirmation" element={<CarConfirmation />} /> */}
        <Route path="/hotel-details/:hotel/:arrival" element={<HotelDetails />} /> 
        <Route path="/hotel-booking" element={<HotelBooking />} />
          <Route path="/favorites" element={<Favorite allFlights={allFlights} />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          <Route path="/hotels" element={<Hotels />} />
          <Route path="/hotel-card" element={<HotelCard />} />
          <Route path="/hotel-filter" element={<HotelFilter />} />
          <Route path="/flight-data" element={<FlightData />} />
          <Route path="/flight-cart" element={<FlightCart />} />
          <Route path="/flight-booking-history" element={<FlightBookingHistory />} />
          <Route path="/hotel-booking-history" element={<HotelBookingHistory />} />
          <Route path="/cab-booking-confirmation" element={<CabBookingConfirmation />} />
          <Route path="/car-hire-faq" element={<CarHireFAQ />} />
          <Route path="/car-confirmation" element={<CarConfirmation />} />
          <Route path="/cancel" element={<Cancel />} />
          <Route path="/car-card" element={<CarCard />} />
          <Route path="/cabs" element={<CabListing />} />
          <Route path="/cab-booking-history" element={<CabBookingHistory />} />
          <Route path="/individual-hotel-deals/:hotel/:arrival" element={<IndividualHotelDeals/>}/>
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/swiper-popular-car-deals" element={<SwiperPopularCarDeals />} />
          <Route path="/country-facts" element={<CountryFacts />} />
          <Route path="/regional-settings" element={<RegionalSettings />} />
          <Route path="/help" element={<Help />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Routes>
      
      
      </Router>
      </GoogleOAuthProvider>
  );
}

export default App;
