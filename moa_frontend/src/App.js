import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import Landing from './pages/Landing';
import Booking from './pages/Booking';
import Admin from './pages/Admin';

export default function App() {
  const [dbRooms, setDbRooms] = useState([]);
  const fetchRooms = () => {
    axios.get('http://127.0.0.1:8000/api/venues').then(res => { if (!res.data.error) setDbRooms(res.data); });
  };
  useEffect(() => { fetchRooms(); }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing rooms={dbRooms} />} />
        {/* Standard User Booking */}
        <Route path="/booking" element={<Booking rooms={dbRooms} isVip={false} />} />
        {/* Special VIP Portal */}
        <Route path="/vip-portal" element={<Booking rooms={dbRooms} isVip={true} />} />
        {/* Admin Dashboard */}
        <Route path="/admin" element={<Admin rooms={dbRooms} onRoomsUpdate={fetchRooms} />} />
      </Routes>
    </Router>
  );
}