import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { 
  Calendar, Search, Paperclip, CheckCircle2, Monitor, 
  AlertCircle, Crown, Users, Trash2, Edit3, ArrowRight, Clock, CalendarRange
} from 'lucide-react';
import { EthDateTime } from 'ethiopian-calendar-date-converter';

// ==========================================
// UTILITY FUNCTIONS & CONSTANTS
// ==========================================
const parseJSON = (str) => { try { return JSON.parse(str); } catch { return []; } };

// 1-indexed month array
const monthNames = ["", "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit", "Megabit", "Miyazia", "Ginbot", "Sene", "Hamle", "Nehasse", "Pagume"];

// ==========================================
// 1. CUSTOM ETHIOPIAN DATE PICKER
// ==========================================
const EthDatePicker = ({ year, month, day, setYear, setMonth, setDay }) => {
  const isLeapYear = year % 4 === 3;
  const daysInMonth = month === 13 ? (isLeapYear ? 6 : 5) : 30;

  return (
    <div className="flex flex-wrap gap-2">
      <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="flex-1 bg-white p-4 rounded-xl border outline-none font-bold text-sm focus:border-[#2E8B57] transition-colors cursor-pointer">
        {monthNames.slice(1).map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
      </select>
      <select value={day} onChange={(e) => setDay(Number(e.target.value))} className="w-20 bg-white p-4 rounded-xl border outline-none font-bold text-sm focus:border-[#2E8B57] transition-colors cursor-pointer">
        {Array.from({ length: daysInMonth }).map((_, i) => <option key={i+1} value={i+1}>{i+1}</option>)}
      </select>
      <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-24 bg-white p-4 rounded-xl border outline-none font-bold text-sm focus:border-[#2E8B57] transition-colors cursor-pointer">
        {Array.from({ length: 15 }).map((_, i) => {
          const y = 2015 + i; return <option key={y} value={y}>{y}</option>;
        })}
      </select>
    </div>
  );
};

// ==========================================
// 2. PROFESSIONAL 1-12 TIME PICKER 
// ==========================================
const EthTimePicker = ({ hour, minute, setHour, setMinute }) => {
  return (
    <div className="flex items-center gap-1 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm focus-within:border-[#2E8B57] focus-within:ring-2 focus-within:ring-green-50 transition-all">
      <Clock size={18} className="text-[#2E8B57] shrink-0 mr-2"/>
      <select value={hour} onChange={(e) => setHour(Number(e.target.value))} className="appearance-none bg-transparent outline-none font-black text-xl text-slate-800 text-center cursor-pointer hover:text-[#2E8B57] transition-colors">
        {Array.from({ length: 12 }).map((_, i) => (
          <option key={i+1} value={i+1}>{(i+1).toString().padStart(2, '0')}</option>
        ))}
      </select>
      <span className="font-black text-slate-300 text-xl mx-1 animate-pulse">:</span>
      <select value={minute} onChange={(e) => setMinute(e.target.value)} className="appearance-none bg-transparent outline-none font-black text-xl text-slate-800 text-center cursor-pointer hover:text-[#2E8B57] transition-colors">
        {Array.from({ length: 60 }).map((_, i) => {
          const m = i.toString().padStart(2, '0');
          return <option key={m} value={m}>{m}</option>;
        })}
      </select>
      <span className="ml-3 text-[9px] font-black text-[#2E8B57] bg-green-50 border border-green-100 px-2 py-1 rounded flex items-center tracking-widest uppercase">Local</span>
    </div>
  );
};

// ==========================================
// MAIN BOOKING COMPONENT
// ==========================================
export default function Booking({ rooms, isVip }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('book');
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successId, setSuccessId] = useState('');
  
  const [editingId, setEditingId] = useState(null);
  const [bookedRanges, setBookedRanges] = useState([]); 
  const [dbServices, setDbServices] = useState([]);

  const ethNow = EthDateTime.fromEuropeanDate(new Date());
  
  // OUTER DATE RANGE STATES
  const [startY, setStartY] = useState(ethNow.year);
  const [startM, setStartM] = useState(ethNow.month);
  const [startD, setStartD] = useState(ethNow.date);

  const [endY, setEndY] = useState(ethNow.year);
  const [endM, setEndM] = useState(ethNow.month);
  const [endD, setEndD] = useState(ethNow.date);
  
  // INDIVIDUAL DAILY TIMES STATE
  const [dailyConfig, setDailyConfig] = useState({});

  const [formData, setFormData] = useState({
    full_name: '', organization: '', email: '', phone: '',
    event_title: '', event_description: '', pax: '', venue_id: '', tech_needs: [], support_needs: []
  });
  const [file, setFile] = useState(null);
  
  // TRACKING STATE
  const [trackId, setTrackId] = useState('');
  const [trackResult, setTrackResult] = useState([]);

  const selectedRoom = rooms.find(r => r.venue_id == formData.venue_id);

  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/services').then(res => setDbServices(res.data));
    if (location.state?.selectedRoomId) setFormData(prev => ({ ...prev, venue_id: location.state.selectedRoomId }));
  }, [location.state]);

  useEffect(() => {
    if (formData.venue_id) {
      axios.get(`http://127.0.0.1:8000/api/get_availability?venue_id=${formData.venue_id}`)
        .then(res => setBookedRanges(res.data.ranges || []));
    }
  }, [formData.venue_id]);

  useEffect(() => {
    const startVal = startY * 10000 + startM * 100 + startD;
    const endVal = endY * 10000 + endM * 100 + endD;
    if (endVal < startVal) {
        setEndY(startY); setEndM(startM); setEndD(startD);
    }
  }, [startY, startM, startD, endY, endM, endD]);

  const getDaysBetween = () => {
    const days = [];
    let currY = startY, currM = startM, currD = startD;
    let count = 0;
    while (count < 14) { 
        days.push({ y: currY, m: currM, d: currD, key: `${currY}-${currM}-${currD}` });
        if (currY === endY && currM === endM && currD === endD) break;
        
        currD++;
        const isLeap = currY % 4 === 3;
        const maxDays = currM === 13 ? (isLeap ? 6 : 5) : 30;
        if (currD > maxDays) {
            currD = 1;
            currM++;
            if (currM > 13) { currM = 1; currY++; }
        }
        count++;
    }
    return days;
  };

  const activeDays = getDaysBetween();

  useEffect(() => {
    setDailyConfig(prev => {
        const next = { ...prev };
        activeDays.forEach(day => {
            if (!next[day.key]) next[day.key] = { startH: 2, startM: '00', endH: 6, endM: '00', isAllDay: false };
        });
        return next;
    });
  }, [startY, startM, startD, endY, endM, endD]);

  const handleDailyChange = (dayKey, field, val) => {
    setDailyConfig(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], [field]: val } }));
  };

  // THE FIX: "All Day" now maps strictly to 1:00 Local (07:00) to 12:00 Local (18:00)
  const getGregISO = (y, m, d, ethH, ethMin, isStart, isAllDay) => {
    try {
      const dt = new EthDateTime(y, m, d);
      const greg = dt.toEuropeanDate(); // Gets exact local date
      
      const gYear = greg.getFullYear();
      const gMonth = greg.getMonth();
      const gDate = greg.getDate();

      let gH = ethH + 6; 
      let gM = Number(ethMin);
      
      if (isAllDay) { 
          gH = isStart ? 7 : 18; // 7am (1:00 Local) to 6pm (12:00 Local)
          gM = 0; 
      }
      
      const pad = (n) => n.toString().padStart(2, '0');
      return `${gYear}-${pad(gMonth + 1)}-${pad(gDate)}T${pad(gH)}:${pad(gM)}`;
    } catch(e) { return ""; }
  };

  const isInvalidTime = () => {
    for (let day of activeDays) {
        const conf = dailyConfig[day.key];
        if (!conf) continue;
        if (conf.isAllDay) continue; // 1 to 12 is naturally valid
        if (conf.startH > conf.endH) return true;
        if (conf.startH === conf.endH && Number(conf.startM) >= Number(conf.endM)) return true;
    }
    return false;
  };

  const getOverlaps = () => {
    if (isVip) return { confirmed: false, approved: false };
    let isConf = false; let isApp = false;

    activeDays.forEach(day => {
        const conf = dailyConfig[day.key];
        if(!conf) return;
        const checkStart = new Date(getGregISO(day.y, day.m, day.d, conf.startH, conf.startM, true, conf.isAllDay));
        const checkEnd = new Date(getGregISO(day.y, day.m, day.d, conf.endH, conf.endM, false, conf.isAllDay));

        bookedRanges.forEach(range => {
            const rStart = new Date(range.start.replace(' ', 'T'));
            const rEnd = new Date(range.end.replace(' ', 'T'));
            if (checkStart < rEnd && checkEnd > rStart) {
                if (range.status === 'Confirmed') isConf = true;
                if (range.status === 'Approved') isApp = true;
            }
        });
    });
    return { confirmed: isConf, approved: isApp };
  };

  const calculateTotalForDay = (day, conf) => {
    if (!selectedRoom || !conf) return 0;
    const startISO = getGregISO(day.y, day.m, day.d, conf.startH, conf.startM, true, conf.isAllDay);
    const endISO = getGregISO(day.y, day.m, day.d, conf.endH, conf.endM, false, conf.isAllDay);
    const hrs = Math.max(0, Math.ceil((new Date(endISO) - new Date(startISO)) / 36e5));
    
    let dailyTotal = hrs * Number(selectedRoom.price_per_hour);
    [...formData.tech_needs, ...formData.support_needs].forEach(srvId => {
      const srv = dbServices.find(s => s.id == srvId);
      if(srv) dailyTotal += Number(srv.price);
    });
    return dailyTotal;
  };

  const calculateGrandTotal = () => {
    let grandTotal = 0;
    activeDays.forEach(day => { grandTotal += calculateTotalForDay(day, dailyConfig[day.key]); });
    return grandTotal;
  };

  const handleCheckbox = (category, serviceId) => {
    setFormData(prev => {
      const list = prev[category] || [];
      return { ...prev, [category]: list.includes(serviceId) ? list.filter(i => i !== serviceId) : [...list, serviceId] };
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    let attachmentUrl = formData.attachment_url || ""; 
    try {
      if (file) {
        const fileData = new FormData(); fileData.append('file', file);
        const uploadRes = await axios.post('http://127.0.0.1:8000/api/upload', fileData);
        if (uploadRes.data.success) attachmentUrl = uploadRes.data.url;
      }

      const generatedIds = [];
      const generatedTrackId = editingId ? trackId : `BKG-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      for (let i = 0; i < activeDays.length; i++) {
          const day = activeDays[i];
          const conf = dailyConfig[day.key];
          if (!conf) continue;

          const startISO = getGregISO(day.y, day.m, day.d, conf.startH, conf.startM, true, conf.isAllDay);
          const endISO = getGregISO(day.y, day.m, day.d, conf.endH, conf.endM, false, conf.isAllDay);
          
          const titleSuffix = activeDays.length > 1 ? ` (Day ${i+1} of ${activeDays.length})` : '';
          let finalTitle = `[#${generatedTrackId}] ${formData.event_title}${titleSuffix}`;
          if (isWaitlist && !isVip) finalTitle = `[WAITLIST] ${finalTitle}`;

          const payload = { 
            ...formData, 
            event_title: finalTitle,
            start_time: startISO,
            end_time: endISO,
            attachment_url: attachmentUrl, 
            is_vip: isVip, 
            total_amount: calculateTotalForDay(day, conf),
            booking_id: (editingId && activeDays.length === 1) ? editingId : null 
          };
          
          const res = await axios.post('http://127.0.0.1:8000/api/book', payload);
          if (res.data.success) generatedIds.push(res.data.booking_id);
          else throw new Error(res.data.error);
      }

      setSuccessId(generatedTrackId); 
      setStep(5); 
      setEditingId(null); 
    } catch (err) { alert("Network Error."); }
    setIsSubmitting(false);
  };

  const handleTrack = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/api/track?id=${trackId.trim()}`);
      if (res.data.success && res.data.data.length > 0) setTrackResult(res.data.data);
      else alert("Booking not found.");
    } catch (err) { alert("Network Error."); }
  };

  const handleEditRequest = () => {
    if (trackResult.length > 1) {
        alert("For Multi-Day bookings, please 'Cancel' the request and submit a new one to adjust dates."); return;
    }

    const resData = trackResult[0];
    const st = new Date(resData.start_time.replace(' ', 'T'));
    const et = new Date(resData.end_time.replace(' ', 'T'));
    const stEth = EthDateTime.fromEuropeanDate(st);

    setStartY(stEth.year); setStartM(stEth.month); setStartD(stEth.date);
    setEndY(stEth.year); setEndM(stEth.month); setEndD(stEth.date); 

    const stH = st.getHours(); const etH = et.getHours();
    
    let isAllDayLocal = false;
    let eSh = 2, eEh = 6;
    
    // Check if it matches our new 1:00 to 12:00 definition (07:00 to 18:00 Gregorian)
    if (stH === 7 && st.getMinutes() === 0 && etH === 18 && et.getMinutes() === 0) {
      isAllDayLocal = true;
      eSh = 1; eEh = 12;
    } else {
      eSh = stH - 6; if (eSh <= 0) eSh += 12; if (eSh > 12) eSh -= 12;
      eEh = etH - 6; if (eEh <= 0) eEh += 12; if (eEh > 12) eEh -= 12;
    }

    setDailyConfig({
        [`${stEth.year}-${stEth.month}-${stEth.date}`]: {
            startH: eSh, startM: st.getMinutes().toString().padStart(2, '0'),
            endH: eEh, endM: et.getMinutes().toString().padStart(2, '0'),
            isAllDay: isAllDayLocal
        }
    });

    setFormData({
      full_name: resData.full_name,
      organization: resData.organization,
      email: resData.email,
      phone: resData.phone || '',
      event_title: resData.event_name.replace(/\[#BKG-[A-Z0-9]+\]\s*/, '').replace('[WAITLIST] ', '').replace(/ \(Day \d+ of \d+\)/, ''),
      event_description: resData.event_description || '',
      pax: resData.pax_count,
      venue_id: resData.venue_id,
      tech_needs: parseJSON(resData.technical_needs),
      support_needs: parseJSON(resData.support_needs),
      attachment_url: resData.attachment_url
    });
    setEditingId(resData.booking_id);
    setActiveTab('book');
    setStep(1); 
  };

  const handleCancelRequest = async () => {
    if(!window.confirm("Are you sure you want to cancel this entire reservation?")) return;
    try {
      for (const resData of trackResult) {
          await axios.post('http://127.0.0.1:8000/api/admin_api', { 
            booking_id: resData.booking_id, 
            status: 'Canceled',
            message: 'User requested cancellation via portal.'
          });
      }
      alert("Booking Canceled Successfully.");
      setTrackResult([]);
      setTrackId('');
    } catch(err) { alert("Error connecting to server."); }
  };

  // Simplifies Output to ALWAYS show Local Time beautifully
  const formatEthDateDisplay = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString.replace(' ', 'T'));
      const eth = EthDateTime.fromEuropeanDate(d);
      
      let gH = d.getHours();
      let gM = d.getMinutes().toString().padStart(2, '0');

      let ethH = gH - 6; if (ethH <= 0) ethH += 12; if (ethH > 12) ethH -= 12;
      return `${eth.date} ${monthNames[eth.month]}, ${eth.year} EC - ${ethH}:${gM} Local`;
    } catch(e) { return new Date(isoString).toLocaleString(); }
  };

  const getDayBookingInfo = (dayNum) => {
    try {
      const currentVal = startY * 10000 + startM * 100 + dayNum;
      let hasConfirmed = false, hasApproved = false;

      bookedRanges.forEach(range => {
        try {
          const rStartEth = EthDateTime.fromEuropeanDate(new Date(range.start.replace(' ', 'T')));
          const rEndEth = EthDateTime.fromEuropeanDate(new Date(range.end.replace(' ', 'T')));
          const startVal = rStartEth.year * 10000 + rStartEth.month * 100 + rStartEth.date;
          const endVal = rEndEth.year * 10000 + rEndEth.month * 100 + rEndEth.date;

          if (currentVal >= startVal && currentVal <= endVal) {
            if (range.status === 'Confirmed') hasConfirmed = true;
            if (range.status === 'Approved') hasApproved = true;
          }
        } catch(err) {}
      });
      return { confirmed: hasConfirmed, approved: hasApproved };
    } catch(e) { return { confirmed: false, approved: false }; }
  };

  const capacityExceeded = selectedRoom ? Number(formData.pax) > Number(selectedRoom.capacity) : false;
  const invalidTime = isInvalidTime();
  const overlaps = getOverlaps();
  const dateConflict = overlaps.confirmed;
  const isWaitlist = overlaps.approved && !overlaps.confirmed;

  const StepIndicator = () => (
    <div className="flex justify-center items-center gap-4 md:gap-12 py-8 bg-white border-b border-slate-100 mb-8 px-4">
      {['Details', 'Venue', 'Services', 'Finish'].map((label, index) => {
        const stepNum = index + 1;
        const isActive = step >= stepNum;
        return (
          <div key={label} className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 transition-colors ${isActive ? (isVip ? 'bg-amber-600 text-white' : 'bg-[#2E8B57] text-white') : 'bg-slate-100 text-slate-400'}`}>
              {stepNum}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider hidden md:block ${isActive ? (isVip ? 'text-amber-600' : 'text-[#2E8B57]') : 'text-slate-400'}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* NAVBAR */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center px-6">
          <button onClick={() => navigate('/')} className="text-sm font-bold text-slate-400 hover:text-[#2E8B57]">← Home</button>
          <div className="flex gap-8">
            <button onClick={() => { setActiveTab('book'); setStep(1); setEditingId(null); }} className={`py-6 font-bold text-sm border-b-4 transition-colors ${activeTab === 'book' ? 'border-[#2E8B57] text-[#2E8B57]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>New Reservation</button>
            <button onClick={() => setActiveTab('track')} className={`py-6 font-bold text-sm border-b-4 transition-colors ${activeTab === 'track' ? 'border-[#2E8B57] text-[#2E8B57]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>Track Status</button>
          </div>
        </div>
      </div>

      {activeTab === 'book' ? (
        <div className="pb-20">
          <div className={`${isVip ? 'bg-amber-600' : 'bg-[#2E8B57]'} text-white text-center py-16 px-4 transition-colors`}>
            {isVip ? <Crown className="mx-auto w-10 h-10 mb-4 text-amber-200" /> : <Calendar className="mx-auto w-8 h-8 opacity-80 mb-4" />}
            <h1 className="text-4xl font-serif font-bold mb-2">
              {editingId ? `Modify Booking` : (isVip ? 'VIP Executive Portal' : 'Reserve a Conference Venue')}
            </h1>
            <p className="text-white/70 uppercase tracking-widest text-[10px] font-bold">
              {editingId ? 'Updating your existing reservation' : (isVip ? 'Priority Booking & Override Active' : 'Official Ministry of Agriculture Portal')}
            </p>
          </div>

          {step < 5 && <StepIndicator />}

          <div className="max-w-3xl mx-auto px-4 mt-8">
            <div className="bg-white rounded-2xl shadow-xl border p-8 md:p-12">
              
              {/* STEP 1: ORGANIZER DETAILS */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="text-2xl font-serif font-bold mb-8 flex items-center"><Users className={`mr-3 ${isVip ? 'text-amber-600' : 'text-[#2E8B57]'}`} /> Organizer Details</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div><label className="block text-xs font-bold text-slate-600 mb-2">Name *</label><input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl border outline-none" /></div>
                    <div><label className="block text-xs font-bold text-slate-600 mb-2">Organization *</label><input type="text" value={formData.organization} onChange={e => setFormData({...formData, organization: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl border outline-none" /></div>
                    <div><label className="block text-xs font-bold text-slate-600 mb-2">Email *</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl border outline-none" /></div>
                    <div><label className="block text-xs font-bold text-slate-600 mb-2">Phone *</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl border outline-none" /></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-slate-600 mb-2">Event Title *</label><input type="text" value={formData.event_title} onChange={e => setFormData({...formData, event_title: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl border outline-none" /></div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-600 mb-2">Event Description (Optional)</label>
                      <textarea value={formData.event_description} onChange={e => setFormData({...formData, event_description: e.target.value})} placeholder="Provide a brief description of the event..." className="w-full bg-slate-50 p-4 rounded-xl border outline-none h-24 resize-none"></textarea>
                    </div>
                  </div>
                  <button onClick={() => setStep(2)} disabled={!formData.full_name || !formData.email || !formData.event_title} className={`w-full ${isVip ? 'bg-amber-600' : 'bg-[#2E8B57]'} text-white py-4 rounded-xl font-bold mt-8 disabled:opacity-50`}>Continue</button>
                </div>
              )}

            {/* STEP 2: VENUE & MULTI-DAY SCHEDULE */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="text-2xl font-serif font-bold mb-8 flex items-center"><Calendar className={`mr-3 ${isVip ? 'text-amber-600' : 'text-[#2E8B57]'}`} /> Venue & Schedule</h3>
                  
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-2">Select Venue *</label>
                    <select value={formData.venue_id} onChange={e => setFormData({...formData, venue_id: e.target.value})} className="w-full bg-slate-50 p-4 rounded-xl border font-bold">
                      <option value="">-- Choose a Hall --</option>
                      {rooms.map(r => <option key={r.venue_id} value={r.venue_id}>{r.name} (Max: {r.capacity} Pax)</option>)}
                    </select>
                  </div>
                  
                  {selectedRoom && (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-2">Number of Participants (Pax) *</label>
                      <input 
                        type="number" value={formData.pax} onChange={e => setFormData({...formData, pax: e.target.value})} 
                        className={`w-full bg-slate-50 p-4 rounded-xl border outline-none ${capacityExceeded ? 'border-red-500 ring-2 ring-red-200' : 'focus:border-[#2E8B57]'}`} 
                      />
                      {capacityExceeded && (
                        <p className="text-red-500 text-xs font-bold mt-2 flex items-center"><AlertCircle className="w-4 h-4 mr-1" /> Maximum capacity for this hall is {selectedRoom.capacity} people.</p>
                      )}
                    </div>
                  )}

                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-4 flex items-center"><CalendarRange className="w-4 h-4 mr-2 text-[#2E8B57]"/> 1. Select Date Range</h4>
                    <div className="grid md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">Start Date (EC)</label>
                        <EthDatePicker year={startY} month={startM} day={startD} setYear={setStartY} setMonth={setStartM} setDay={setStartD} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 mb-2 uppercase tracking-wider">End Date (EC)</label>
                        <EthDatePicker year={endY} month={endM} day={endD} setYear={setEndY} setMonth={setEndM} setDay={setEndD} />
                      </div>
                    </div>
                  </div>

                  {activeDays.length > 0 && (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-6">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide mb-4 flex items-center"><Clock className="w-4 h-4 mr-2 text-[#2E8B57]"/> 2. Configure Daily Times</h4>
                      <p className="text-xs text-slate-500 mb-6">Set specific hours for each day. Check "All Day" to book the entire 1:00 to 12:00 block.</p>
                      
                      <div className="space-y-4">
                        {activeDays.map(day => {
                          const conf = dailyConfig[day.key] || { startH: 2, startM: '00', endH: 6, endM: '00', isAllDay: false };
                          
                          return (
                            <div key={day.key} className="flex flex-col xl:flex-row items-center justify-between bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-[#2E8B57] transition-colors">
                              <div className="font-black text-slate-700 w-full xl:w-1/3 mb-4 xl:mb-0 flex items-center">
                                <div className="w-8 h-8 rounded bg-green-50 text-[#2E8B57] flex items-center justify-center mr-3">{day.d}</div>
                                {monthNames[day.m]}, {day.y}
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-4 w-full xl:w-2/3 xl:justify-end">
                                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-3 rounded-lg border hover:border-[#2E8B57] transition-colors select-none">
                                  <input type="checkbox" checked={conf.isAllDay} onChange={(e) => handleDailyChange(day.key, 'isAllDay', e.target.checked)} className="accent-[#2E8B57] w-4 h-4 cursor-pointer" />
                                  <span className="text-xs font-black uppercase tracking-wider text-slate-600">All Day</span>
                                </label>

                                {!conf.isAllDay && (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <EthTimePicker hour={conf.startH} minute={conf.startM} setHour={(v) => handleDailyChange(day.key, 'startH', v)} setMinute={(v) => handleDailyChange(day.key, 'startM', v)} />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">TO</span>
                                    <EthTimePicker hour={conf.endH} minute={conf.endM} setHour={(v) => handleDailyChange(day.key, 'endH', v)} setMinute={(v) => handleDailyChange(day.key, 'endM', v)} />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {invalidTime && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center mt-4">
                      <AlertCircle className="mr-2 w-5 h-5"/> Invalid Times: End Time must be later than Start Time!
                    </div>
                  )}
                  {dateConflict && !isVip && !invalidTime && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold flex items-center mt-4">
                      <AlertCircle className="mr-2 w-5 h-5"/> One or more of your selected times conflicts with a Confirmed event!
                    </div>
                  )}
                  {isWaitlist && !isVip && !invalidTime && (
                    <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl text-sm font-bold flex items-center mt-4 border border-yellow-200">
                      <Clock className="mr-2 w-5 h-5 text-yellow-600"/> 
                      Notice: Some selected slots are Approved for someone else, but not yet paid. You will be placed on the Waitlist.
                    </div>
                  )}

                  {formData.venue_id && (
                    <div className="bg-white p-6 rounded-xl border mt-6 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Availability Map ({monthNames[startM]} {startY})
                        </h4>
                      </div>
                      <div className="grid grid-cols-6 md:grid-cols-10 gap-2 text-center">
                        {Array.from({ length: startM === 13 ? ((startY % 4 === 3) ? 6 : 5) : 30 }).map((_, i) => {
                          const { confirmed, approved } = getDayBookingInfo(i + 1);
                          let bgClass = "bg-slate-50 border-slate-100 text-slate-600";
                          if (confirmed) bgClass = "bg-red-50 border-red-200 text-red-500 shadow-sm"; 
                          else if (approved) bgClass = "bg-yellow-50 border-yellow-300 text-yellow-700 shadow-sm"; 

                          return <div key={i} className={`py-2 rounded-lg text-xs font-bold border ${bgClass}`}>{i + 1}</div>;
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between mt-8">
                    <button onClick={() => setStep(1)} className="px-8 py-4 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors">Back</button>
                    <button 
                      onClick={() => setStep(3)} 
                      disabled={
                        !formData.venue_id || 
                        !formData.pax || 
                        activeDays.length === 0 ||
                        (!isVip && dateConflict) || 
                        invalidTime || 
                        capacityExceeded
                      } 
                      className={`px-8 py-4 ${isVip ? 'bg-amber-600 hover:bg-amber-700' : 'bg-[#2E8B57] hover:bg-[#246d44]'} text-white rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: SERVICES */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="text-2xl font-serif font-bold mb-8 flex items-center"><Monitor className={`mr-3 ${isVip ? 'text-amber-600' : 'text-[#2E8B57]'}`} /> Extra Services</h3>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-bold text-slate-800 mb-4">Technical Needs</h4>
                      {dbServices.filter(s => s.category === 'Technical').map(srv => (
                        <label key={srv.id} className="flex items-center space-x-3 mb-3 cursor-pointer">
                          <input type="checkbox" checked={formData.tech_needs.includes(srv.id)} onChange={() => handleCheckbox('tech_needs', srv.id)} className="w-5 h-5" />
                          <span className="text-sm font-medium">{srv.name} <span className="text-slate-400 font-bold">(${srv.price})</span></span>
                        </label>
                      ))}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 mb-4">Support Needs</h4>
                      {dbServices.filter(s => s.category === 'Support').map(srv => (
                        <label key={srv.id} className="flex items-center space-x-3 mb-3 cursor-pointer">
                          <input type="checkbox" checked={formData.support_needs.includes(srv.id)} onChange={() => handleCheckbox('support_needs', srv.id)} className="w-5 h-5" />
                          <span className="text-sm font-medium">{srv.name} <span className="text-slate-400 font-bold">(${srv.price})</span></span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center mt-6">
                    <Paperclip className="mx-auto text-slate-400 w-8 h-8 mb-2" />
                    <p className="text-xs font-bold text-slate-500 mb-2">Attach Contract (PDF) {editingId && '- Leave blank to keep existing'}</p>
                    <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-[#198754] file:text-white hover:file:bg-[#146c43] cursor-pointer" />
                  </div>
                  <div className="flex justify-between mt-8">
                    <button onClick={() => setStep(2)} className="px-8 py-4 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Back</button>
                    <button onClick={() => setStep(4)} className={`px-8 py-4 ${isVip ? 'bg-amber-600' : 'bg-[#2E8B57]'} text-white rounded-xl font-bold`}>Review</button>
                  </div>
                </div>
              )}

              {/* STEP 4: REVIEW & SUBMIT */}
              {step === 4 && (
                <div className="space-y-6 animate-in fade-in">
                  <h3 className="text-2xl font-serif font-bold mb-8 flex items-center"><CheckCircle2 className={`mr-3 ${isVip ? 'text-amber-600' : 'text-[#2E8B57]'}`} /> Review & Submit</h3>
                  
                  {isWaitlist && !isVip && (
                    <div className="bg-yellow-100 p-4 rounded-xl border border-yellow-300 text-yellow-900 text-sm font-bold mb-6 text-center shadow-sm">
                      Notice: By submitting this request, you agree to be placed on a Waitlist for overlapping days.
                    </div>
                  )}

                  <div className="bg-slate-50 p-6 rounded-2xl text-sm text-slate-600 border">
                    <p><strong>Organizer:</strong> {formData.full_name} ({formData.organization})</p>
                    <p><strong>Event:</strong> {formData.event_title}</p>
                    <p><strong>Pax:</strong> {formData.pax} people</p>
                    <hr className="my-4 border-slate-200" />
                    
                    <h4 className="font-bold text-[#2E8B57] mb-3 mt-2 uppercase tracking-wide text-xs">Daily Schedule:</h4>
                    <ul className="space-y-2">
                      {activeDays.map(day => {
                        const conf = dailyConfig[day.key]; if (!conf) return null;
                        const timeStr = conf.isAllDay ? "01:00 to 12:00 Local" : `${conf.startH.toString().padStart(2,'0')}:${conf.startM} to ${conf.endH.toString().padStart(2,'0')}:${conf.endM} Local`;
                        return (
                          <li key={day.key} className="flex justify-between bg-white p-3 rounded-lg border shadow-sm">
                            <span className="font-bold">{day.d} {monthNames[day.m]}, {day.y}</span>
                            <span className="text-slate-500 font-medium">{timeStr}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  
                  <h3 className="text-2xl font-serif font-bold text-center mt-8">Calculated Price: ${calculateGrandTotal().toFixed(2)}</h3>
                  
                  <div className="flex justify-between mt-8">
                    <button onClick={() => setStep(3)} className="px-8 py-4 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Back</button>
                    <button onClick={handleSubmit} disabled={isSubmitting} className={`px-8 py-4 ${isVip ? 'bg-amber-600' : 'bg-[#2E8B57]'} text-white rounded-xl font-bold shadow-xl disabled:opacity-50 flex items-center`}>
                      {isSubmitting ? 'Transmitting...' : (editingId ? 'Save Changes' : 'Submit Final Reservation')} <ArrowRight className="ml-2 w-4 h-4"/>
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: SUCCESS */}
              {step === 5 && (
                <div className="text-center py-12 animate-in slide-in-from-bottom-8">
                  <CheckCircle2 size={64} className={`mx-auto mb-4 ${isVip ? 'text-amber-600' : 'text-[#2E8B57]'}`} />
                  <h2 className="text-3xl font-black mb-4">{editingId ? 'Update Successful!' : 'Success!'}</h2>
                  <div className="bg-slate-50 p-6 rounded-xl border inline-block text-lg font-mono font-black text-[#2E8B57] max-w-full overflow-hidden break-words">
                    <p className="text-xs text-slate-400 mb-2 uppercase">Your Official Tracking ID</p>
                    {successId}
                  </div>
                  <p className="text-slate-500 mt-4">Save this ID to check your status in the "Track Status" tab.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TRACKING VIEW */
        <main className="max-w-3xl mx-auto py-20 px-6 animate-in slide-in-from-right duration-500">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 space-y-10">
            <div className="text-center">
               <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border shadow-sm">
                 <Search className="text-[#2E8B57]" size={30} />
               </div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">Track & Manage</h2>
               <p className="text-slate-400 text-sm mt-2">Enter your Tracking ID to view or modify your booking.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
               <input 
                 type="text" 
                 placeholder="BKG-XXXXXX" 
                 value={trackId} 
                 onChange={e => setTrackId(e.target.value.toUpperCase())} 
                 className="flex-1 p-5 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-[#2E8B57] font-mono font-bold text-center text-xl border" 
               />
               <button onClick={handleTrack} className="bg-[#2E8B57] text-white px-10 py-5 rounded-2xl font-black text-sm shadow-xl hover:bg-[#246d44] transition-all">FETCH RECORD</button>
            </div>

            {trackResult && trackResult.length > 0 && (
              <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-200 relative overflow-hidden">
                <h4 className="font-black text-2xl text-slate-800">{trackResult[0].venue_name}</h4>
                <p className="text-slate-500 text-sm font-medium mt-1 mb-6">{trackResult[0].event_name.replace(/\[#BKG-[A-Z0-9]+\]\s*/, '').replace('[WAITLIST] ', '')}</p>

                {/* DYNAMIC MULTI-DAY STATUS LIST */}
                <div className="space-y-2 mb-6">
                  {trackResult.map((res, i) => {
                    let badgeClass = 'bg-slate-200 text-slate-700';
                    if (res.status === 'Confirmed') badgeClass = 'bg-red-500 text-white';
                    else if (res.status === 'Approved') badgeClass = 'bg-yellow-400 text-yellow-900';
                    
                    return (
                      <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border shadow-sm">
                        <div>
                          <p className="text-xs font-bold text-slate-700">{formatEthDateDisplay(res.start_time).split(' - ')[0]}</p>
                          <p className="text-[10px] text-slate-400 font-bold">{formatEthDateDisplay(res.start_time).split(' - ')[1]}</p>
                        </div>
                        <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-full ${badgeClass}`}>{res.status}</span>
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-slate-200 pt-6">
                  {trackResult.length === 1 ? (
                    <button onClick={handleEditRequest} className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600 hover:text-[#2E8B57] hover:border-[#2E8B57] transition-all shadow-sm">
                      <Edit3 size={18} /> Edit Details
                    </button>
                  ) : (
                    <button onClick={handleEditRequest} className="flex items-center justify-center gap-2 p-4 bg-slate-100 border border-slate-200 rounded-xl font-bold text-sm text-slate-400 hover:text-[#2E8B57] hover:border-[#2E8B57]">
                      <Edit3 size={18} /> Multi-Day Edit Locked
                    </button>
                  )}
                  
                  <button onClick={handleCancelRequest} className="flex items-center justify-center gap-2 p-4 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-400 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm">
                    <Trash2 size={18} /> Cancel Entire Event
                  </button>
                </div>

                {trackResult[0].admin_message && (
                  <div className="p-4 bg-white rounded-xl border-l-4 border-[#2E8B57] shadow-sm mt-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Message from Coordinator</p>
                    <p className="text-sm italic text-slate-700">"{trackResult[0].admin_message}"</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}