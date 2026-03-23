import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Calendar as CalIcon, Settings, Check, X, 
  Mail, Crown, Building2, Eye, Plus, FileText, Image as ImageIcon, Trash2, ShieldCheck, CheckCircle2, Users, ClipboardList, Clock, ChevronLeft, ChevronRight
} from 'lucide-react';
import { EthDateTime } from 'ethiopian-calendar-date-converter';

const VenueGallery = ({ venueId }) => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!venueId) { setImages([]); return; }
    axios.get(`http://127.0.0.1:8000/api/venue_images_api?venue_id=${venueId}`)
      .then(res => setImages(res.data || []));
  }, [venueId]);

  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => setCurrentIndex(prev => (prev + 1) % images.length), 4000);
    return () => clearInterval(timer);
  }, [images]);

  if (!images || images.length === 0) return <div className="w-full h-48 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 text-sm border-2 border-dashed border-slate-200 mb-6">No Images Currently Saved</div>;

  return (
    <div className="relative w-full h-48 rounded-2xl overflow-hidden shadow-sm mb-6 bg-black">
      <img src={images[currentIndex]} className="w-full h-full object-cover transition-opacity duration-700" alt="Venue" />
      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {images.map((_, i) => <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentIndex ? 'w-5 bg-[#198754]' : 'w-1.5 bg-white/70'}`}></div>)}
        </div>
      )}
    </div>
  );
};

const formatEthDateDisplay = (isoString) => {
  if (!isoString) return "";
  try {
    const d = new Date(isoString.replace(' ', 'T'));
    const eth = EthDateTime.fromEuropeanDate(d);
    const months = ["", "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit", "Megabit", "Miyazia", "Ginbot", "Sene", "Hamle", "Nehasse", "Pagume"];
    
    let gH = d.getHours(); let gM = d.getMinutes().toString().padStart(2, '0');
    if (gH === 0 && gM === '00') return `${eth.date} ${months[eth.month]}, ${eth.year} EC (All Day)`;
    if (gH === 23 && gM === '59') return `${eth.date} ${months[eth.month]}, ${eth.year} EC (All Day)`;

    let ethH = gH - 6; if (ethH <= 0) ethH += 12; if (ethH > 12) ethH -= 12;
    return `${eth.date} ${months[eth.month]}, ${eth.year} EC - ${ethH}:${gM}`;
  } catch(e) { return new Date(isoString).toLocaleString(); }
};

const AllocationCard = ({ booking, dbServices, staffList, onSave }) => {
  const [selectedStaff, setSelectedStaff] = useState('');
  const [selectedTasks, setSelectedTasks] = useState([]);

  const isHistory = new Date(booking.end_time.replace(' ', 'T')) < new Date();

  const parseJSON = (str) => { try { const p = JSON.parse(str); return Array.isArray(p) ? p : []; } catch { return []; } };
  const getServiceName = (id) => { const service = dbServices.find(s => String(s.id) === String(id)); return service ? service.name : `Unknown #${id}`; };

  const requestedServices = [ ...parseJSON(booking.technical_needs).map(getServiceName), ...parseJSON(booking.support_needs).map(getServiceName) ];
  if (requestedServices.length === 0) requestedServices.push('General Oversight');

  let currentAllocations = parseJSON(booking.allocated_staff);
  currentAllocations = currentAllocations.map(alloc => {
    if (typeof alloc === 'string' || typeof alloc === 'number') {
      const s = staffList.find(st => st.staff_id.toString() === alloc.toString());
      return { staff_id: alloc.toString(), name: s ? s.name : 'Unknown Staff', tasks: [] };
    } return alloc;
  });

  const toggleTask = (task) => setSelectedTasks(prev => prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]);

  const handleAssign = () => {
    if (!selectedStaff || selectedTasks.length === 0) return alert('Please select staff and tasks.');
    const staffObj = staffList.find(s => s.staff_id.toString() === selectedStaff);
    const newAlloc = { staff_id: selectedStaff, name: staffObj.name, tasks: selectedTasks };
    const updated = currentAllocations.filter(a => a.staff_id !== selectedStaff);
    updated.push(newAlloc);
    onSave(booking.booking_id, updated); setSelectedStaff(''); setSelectedTasks([]);
  };

  const handleRemove = (staffId) => {
    if(!window.confirm('Remove staff?')) return;
    const updated = currentAllocations.filter(a => a.staff_id !== staffId.toString());
    onSave(booking.booking_id, updated);
  };

  return (
    <div className={`bg-white p-8 rounded-3xl shadow-sm border mb-6 ${isHistory ? 'opacity-80 grayscale-[20%]' : ''}`}>
      {isHistory && <div className="bg-slate-100 text-slate-500 p-3 rounded-xl mb-6 text-xs font-bold uppercase tracking-wider flex items-center"><Clock className="w-4 h-4 mr-2" /> Event Completed</div>}
      <div className="flex justify-between items-start mb-6 border-b pb-4">
        <div>
          <h3 className="font-black text-xl text-[#198754]">Booking #{booking.booking_id}: {booking.event_name.replace(/\[#BKG-[A-Z0-9]+\]\s*/, '').replace('[WAITLIST] ', '')}</h3>
          <p className="text-sm font-bold text-slate-500">{booking.room_name} • {formatEthDateDisplay(booking.start_time)}</p>
        </div>
        <span className={`px-4 py-2 rounded-full text-xs font-black uppercase ${booking.status === 'Confirmed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{booking.status}</span>
      </div>
      <div className={`grid ${isHistory ? 'grid-cols-1' : 'lg:grid-cols-2'} gap-10`}>
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Assigned Personnel</h4>
          {currentAllocations.length === 0 ? <p className="text-sm text-slate-500 italic">No staff assigned.</p> : (
            <div className="space-y-3">
              {currentAllocations.map((alloc, idx) => (
                <div key={idx} className="bg-slate-50 p-4 rounded-xl border flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-slate-800">{alloc.name}</p>
                    <div className="flex flex-wrap gap-1 mt-2">{alloc.tasks && alloc.tasks.map(t => <span key={t} className="bg-white border px-2 py-1 text-[10px] uppercase font-bold text-slate-500 rounded-md">{t}</span>)}</div>
                  </div>
                  {!isHistory && <button onClick={() => handleRemove(alloc.staff_id)} className="p-2 text-red-500 hover:bg-red-100 rounded-lg"><Trash2 size={16}/></button>}
                </div>
              ))}
            </div>
          )}
        </div>
        {!isHistory && (
          <div className="bg-slate-50 p-6 rounded-2xl border">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Assign Tasks</h4>
            <div className="space-y-4">
              <select value={selectedStaff} onChange={(e) => setSelectedStaff(e.target.value)} className="w-full p-4 bg-white border rounded-xl text-sm font-bold outline-none">
                <option value="">-- Choose Staff Member --</option>
                {staffList.map(s => <option key={s.staff_id} value={s.staff_id}>{s.name} ({s.role})</option>)}
              </select>
              <div className="bg-white p-4 rounded-xl border">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-3">Select Required Tasks</p>
                <div className="space-y-2">
                  {requestedServices.map((task, i) => (
                    <label key={i} className="flex items-center space-x-3 cursor-pointer">
                      <input type="checkbox" checked={selectedTasks.includes(task)} onChange={() => toggleTask(task)} className="w-4 h-4 text-[#198754]" />
                      <span className="text-sm font-medium">{task}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button onClick={handleAssign} className="w-full py-4 bg-[#198754] hover:bg-[#146c43] text-white font-bold rounded-xl shadow-md">Assign to Event</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function Admin({ rooms, onRoomsUpdate }) {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [activeTab, setActiveTab] = useState('queue');
  const [bookings, setBookings] = useState([]);
  
  const [emailModal, setEmailModal] = useState({ isOpen: false, ids: [], status: '', message: '' });
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, group: null });
  
  const [venueForm, setVenueForm] = useState({ venue_id: '', name: '', capacity: '', price_per_hour: '', best_for: '' });
  const [pendingImages, setPendingImages] = useState([]); 
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  const [dbServices, setDbServices] = useState([]);
  const [serviceForm, setServiceForm] = useState({ id: '', name: '', price: '', category: 'Support' });

  const [staffList, setStaffList] = useState([]);
  const [staffForm, setStaffForm] = useState({ staff_id: '', name: '', role: 'Technical', email: '', phone: '', password: '' });

  const [calYear, setCalYear] = useState(() => { try { return EthDateTime.fromEuropeanDate(new Date()).year; } catch(e) { return 2016; } });
  const [calMonth, setCalMonth] = useState(() => { try { return EthDateTime.fromEuropeanDate(new Date()).month; } catch(e) { return 1; } });

  const ethMonthNames = ["", "Meskerem", "Tikimt", "Hidar", "Tahsas", "Tir", "Yekatit", "Megabit", "Miyazia", "Ginbot", "Sene", "Hamle", "Nehasse", "Pagume"];
  const daysInEthMonth = calMonth === 13 ? ((calYear % 4 === 3) ? 6 : 5) : 30;

  const handlePrevMonth = () => { if (calMonth === 1) { setCalMonth(13); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); };
  const handleNextMonth = () => { if (calMonth === 13) { setCalMonth(1); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); };

  const fetchData = () => {
    axios.get('http://127.0.0.1:8000/api/admin_api').then(res => setBookings(res.data || []));
    axios.get('http://127.0.0.1:8000/api/services').then(res => setDbServices(res.data || []));
    axios.get('http://127.0.0.1:8000/api/staff_api').then(res => setStaffList(res.data || []));
  };

  useEffect(() => { if (isAuthenticated) fetchData(); }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginEmail === "admin@moa.gov.et" && loginPass === "admin123") setIsAuthenticated(true);
    else alert("Invalid credentials.");
  };

  // SMART GROUPING ALGORITHM FOR QUEUE
  const groupedBookings = [];
  const groupMap = {};

  bookings.forEach(b => {
      const match = b.event_name?.match(/\[#(BKG-[A-Z0-9]+)\]/);
      const trackId = match ? match[1] : `LEGACY-${b.booking_id}`;
      const cleanTitle = b.event_name?.replace(/\[#BKG-[A-Z0-9]+\]\s*/, '').replace(/\[WAITLIST\]\s*/, '').replace(/ \(Day \d+ of \d+\)/, '');

      if (!groupMap[trackId]) {
          groupMap[trackId] = {
              ...b, event_name: cleanTitle, tracking_id: trackId, all_ids: [b.booking_id],
              schedules: [{ start: b.start_time, end: b.end_time }], total_amount: Number(b.total_amount),
              is_waitlist: b.event_name?.includes('[WAITLIST]')
          };
          groupedBookings.push(groupMap[trackId]);
      } else {
          groupMap[trackId].all_ids.push(b.booking_id);
          groupMap[trackId].schedules.push({ start: b.start_time, end: b.end_time });
          groupMap[trackId].total_amount += Number(b.total_amount);
      }
  });

  const submitStatusUpdate = async () => {
    for (const bId of emailModal.ids) {
        await axios.post('http://127.0.0.1:8000/api/admin_api', { booking_id: bId, status: emailModal.status, message: emailModal.message });
    }
    fetchData(); setEmailModal({ isOpen: false, ids: [], status: '', message: '' });
  };

  const handleDeleteGroup = async (ids) => {
    if (window.confirm("Are you sure you want to permanently delete this ENTIRE multi-day booking?")) {
      for (const id of ids) {
        await axios.post('http://127.0.0.1:8000/api/delete_booking', { booking_id: id });
      }
      fetchData();
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setIsUploadingImages(true);
    const uploadedUrls = [];
    try {
      for (const file of files) {
        const fileData = new FormData(); fileData.append('file', file);
        const uploadRes = await axios.post('http://127.0.0.1:8000/api/upload', fileData);
        if (uploadRes.data.success) uploadedUrls.push(uploadRes.data.url);
      }
      setPendingImages(prev => [...prev, ...uploadedUrls]);
    } catch (err) { alert('Error uploading images.'); }
    setIsUploadingImages(false);
  };

  const handleSaveVenue = async (e) => {
    e.preventDefault(); setIsUploadingImages(true);
    try {
      const res = await axios.post('http://127.0.0.1:8000/api/update_venue', venueForm);
      if (res.data.success) {
        const savedVenueId = res.data.venue_id || venueForm.venue_id;
        if (pendingImages.length > 0) await axios.post('http://127.0.0.1:8000/api/venue_images_api', { venue_id: savedVenueId, images: pendingImages });
        alert('Venue Saved!'); setVenueForm({ venue_id: '', name: '', capacity: '', price_per_hour: '', best_for: '' });
        setPendingImages([]); onRoomsUpdate(); 
      } else alert('Error saving venue.');
    } catch (err) { alert('Error saving venue.'); }
    setIsUploadingImages(false);
  };

  const handleDeleteVenue = async (venueId) => {
    if(window.confirm("Delete this venue permanently?")) {
      try {
        await axios.post('http://127.0.0.1:8000/api/update_venue', { action: 'delete', venue_id: venueId });
        if (venueForm.venue_id === venueId) setVenueForm({ venue_id: '', name: '', capacity: '', price_per_hour: '', best_for: '' });
        onRoomsUpdate(); 
      } catch(e) { alert("Error deleting venue."); }
    }
  };

  const handleSaveService = async (e) => {
    e.preventDefault(); await axios.post('http://127.0.0.1:8000/api/services', serviceForm);
    setServiceForm({ id: '', name: '', price: '', category: 'Support' }); fetchData(); 
  };

  const handleSaveStaff = async (e) => {
    e.preventDefault(); await axios.post('http://127.0.0.1:8000/api/staff_api', staffForm);
    setStaffForm({ staff_id: '', name: '', role: 'Technical', email: '', phone: '', password: '' }); fetchData();
  };

  const handleDeleteStaff = async (id) => {
    if (window.confirm("Delete staff member?")) { await axios.delete('http://127.0.0.1:8000/api/staff_api', { data: { staff_id: id } }); fetchData(); }
  };

  const handleSaveAllocation = async (bookingId, staffArrayObjects) => {
    try { await axios.post('http://127.0.0.1:8000/api/admin_api', { action: 'allocate_staff', booking_id: bookingId, staff_ids: staffArrayObjects }); fetchData(); } catch (err) {}
  };

  const parseJSON = (str) => { try { const parsed = JSON.parse(str); return Array.isArray(parsed) ? parsed : []; } catch { return []; } };
  const getServiceName = (id) => { const service = dbServices.find(s => String(s.id) === String(id)); return service ? service.name : `Unknown #${id}`; };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full">
          <h2 className="text-3xl font-black mb-8 text-center text-[#198754]">Admin Login</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} placeholder="Email" className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:border-[#198754]" />
            <input type="password" value={loginPass} onChange={e => setLoginPass(e.target.value)} placeholder="Password" className="w-full p-4 bg-slate-50 border rounded-xl outline-none focus:border-[#198754]" />
            <button type="submit" className="w-full bg-[#198754] text-white py-4 rounded-xl font-bold">Login</button>
          </form>
        </div>
      </div>
    );
  }

  const validBookings = bookings.filter(b => b.status === 'Approved' || b.status === 'Confirmed');
  const today = new Date();
  const activeAllocations = validBookings.filter(b => new Date(b.end_time.replace(' ', 'T')) >= today);
  const historyAllocations = validBookings.filter(b => new Date(b.end_time.replace(' ', 'T')) < today);

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="w-72 bg-[#198754] text-white p-6 sticky top-0 h-screen shadow-2xl flex flex-col">
        <h2 className="text-xl font-black mb-10 flex items-center gap-2"><Crown/> Admin Suite</h2>
        <nav className="space-y-2 flex-1">
          <button onClick={() => setActiveTab('queue')} className={`w-full text-left p-3 rounded-xl font-bold text-sm ${activeTab === 'queue' ? 'bg-white/20 border-l-4 border-white' : 'hover:bg-white/10'}`}><LayoutDashboard className="inline mr-2 w-4 h-4"/> Queue</button>
          <button onClick={() => setActiveTab('calendar')} className={`w-full text-left p-3 rounded-xl font-bold text-sm ${activeTab === 'calendar' ? 'bg-white/20 border-l-4 border-white' : 'hover:bg-white/10'}`}><CalIcon className="inline mr-2 w-4 h-4"/> Calendar</button>
          <button onClick={() => setActiveTab('allocations')} className={`w-full text-left p-3 rounded-xl font-bold text-sm ${activeTab === 'allocations' ? 'bg-white/20 border-l-4 border-white' : 'hover:bg-white/10'}`}><ClipboardList className="inline mr-2 w-4 h-4"/> Task Allocations</button>
          <button onClick={() => setActiveTab('venues')} className={`w-full text-left p-3 rounded-xl font-bold text-sm ${activeTab === 'venues' ? 'bg-white/20 border-l-4 border-white' : 'hover:bg-white/10'}`}><Building2 className="inline mr-2 w-4 h-4"/> Manage Venues</button>
          <button onClick={() => setActiveTab('services')} className={`w-full text-left p-3 rounded-xl font-bold text-sm ${activeTab === 'services' ? 'bg-white/20 border-l-4 border-white' : 'hover:bg-white/10'}`}><Settings className="inline mr-2 w-4 h-4"/> Manage Services</button>
          <button onClick={() => setActiveTab('staff')} className={`w-full text-left p-3 rounded-xl font-bold text-sm ${activeTab === 'staff' ? 'bg-white/20 border-l-4 border-white' : 'hover:bg-white/10'}`}><Users className="inline mr-2 w-4 h-4"/> Manage Staff</button>
          <div className="pt-8 border-t border-white/20 mt-8">
            <button onClick={() => navigate('/vip-portal')} className="w-full text-left p-3 rounded-xl font-black text-amber-300 hover:bg-white/10 uppercase text-xs"><Crown className="inline mr-2 w-4 h-4"/> VIP Booking</button>
          </div>
        </nav>
        <button onClick={() => { setIsAuthenticated(false); navigate('/'); }} className="text-xs font-bold text-white/50 pt-4 border-t border-white/10 hover:text-white mt-auto">Log Out</button>
      </aside>

      <main className="flex-1 p-10 relative overflow-y-auto h-screen">
        <h2 className="text-3xl font-black capitalize mb-8">{activeTab === 'staff' ? 'Staff & Admins' : activeTab === 'allocations' ? 'Operations & Tasks' : activeTab}</h2>

        {emailModal.isOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
            <div className="bg-white p-8 rounded-3xl w-full max-w-md shadow-2xl">
              <h3 className="text-xl font-bold mb-4">{emailModal.status} Booking</h3>
              <p className="text-xs text-slate-500 mb-2">This message will be emailed to the user.</p>
              <textarea value={emailModal.message} onChange={e => setEmailModal({...emailModal, message: e.target.value})} className="w-full p-4 bg-slate-50 border rounded-xl h-32 mb-6 outline-none" placeholder="Message to user..."></textarea>
              <div className="flex gap-4">
                <button onClick={() => setEmailModal({ isOpen: false, ids: [], status: '', message: '' })} className="flex-1 py-3 bg-slate-100 rounded-xl font-bold">Cancel</button>
                <button onClick={submitStatusUpdate} className="flex-1 py-3 bg-[#198754] text-white rounded-xl font-bold flex justify-center items-center gap-2"><Mail size={16}/> Send & Save</button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL FOR SMART GROUPED DETAILS */}
        {detailsModal.isOpen && detailsModal.group && (
          <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4">
            <div className="bg-white p-8 rounded-3xl w-full max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div>
                  <h3 className="text-2xl font-black text-[#198754]">Booking {detailsModal.group.tracking_id}</h3>
                  <p className="text-sm font-bold text-slate-500">{detailsModal.group.event_name}</p>
                </div>
                <button onClick={() => setDetailsModal({ isOpen: false, group: null })} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200"><X size={20}/></button>
              </div>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">Organizer</p>
                  <p className="font-bold">{detailsModal.group.full_name}</p>
                  {detailsModal.group.organization && <p className="text-[11px] font-black text-slate-400 uppercase mb-1">{detailsModal.group.organization}</p>}
                  <p className="text-sm text-slate-600">{detailsModal.group.email}</p>
                </div>
                <div><p className="text-xs text-slate-400 font-bold uppercase">Venue & Pax</p><p className="font-bold">{detailsModal.group.room_name}</p><p className="text-sm text-slate-600">{detailsModal.group.pax_count} People Expected</p></div>
              </div>

              <div className="mb-6">
                <p className="text-xs text-slate-400 font-bold uppercase mb-1">Event Description</p>
                <p className="text-sm bg-slate-50 p-4 rounded-xl border">{detailsModal.group.event_description || 'No description provided.'}</p>
              </div>

              {/* LIST ALL DAYS IN THE GROUP */}
              <div className="mb-6 border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 p-3 border-b text-xs font-bold text-slate-500 uppercase tracking-wider">Multi-Day Schedule</div>
                <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto">
                  {detailsModal.group.schedules.map((sch, i) => (
                    <div key={i} className="p-3 text-sm font-bold text-slate-700 flex justify-between">
                      <span>Day {i+1}</span>
                      <span className="text-slate-500">{formatEthDateDisplay(sch.start)} to {formatEthDateDisplay(sch.end).split('-')[1] || 'All Day'}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">Tech & Support Needs</p>
                  <ul className="list-disc pl-4 text-sm font-medium text-slate-700 mb-4">
                    {parseJSON(detailsModal.group.technical_needs).map(id => <li key={id}>{getServiceName(id)}</li>)}
                    {parseJSON(detailsModal.group.support_needs).map(id => <li key={id}>{getServiceName(id)}</li>)}
                    {parseJSON(detailsModal.group.technical_needs).length === 0 && parseJSON(detailsModal.group.support_needs).length === 0 && <li>None Requested</li>}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase mb-2">Grand Total</p>
                  <p className="text-2xl font-black text-[#198754]">${detailsModal.group.total_amount.toFixed(2)}</p>
                </div>
              </div>

              {detailsModal.group.attachment_url && (
                <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center border border-blue-100 mt-6">
                  <div className="flex items-center gap-2 text-blue-800"><FileText size={20}/> <span className="font-bold text-sm">Contract Attached</span></div>
                  <a href={detailsModal.group.attachment_url} target="_blank" rel="noreferrer" className="bg-white text-blue-600 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-600 hover:text-white transition-colors">Open File</a>
                </div>
              )}
            </div>
          </div>
        )}

        {/* OPERATIONS QUEUE - NOW USES SMART GROUPING */}
        {activeTab === 'queue' && (
          <div className="bg-white rounded-3xl shadow-sm border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-xs text-slate-400 uppercase">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Event & User</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Details</th>
                  <th className="p-4 text-center">Update Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedBookings.map(g => {
                  let badgeClass = 'bg-slate-100 text-slate-700'; 
                  if (g.status === 'Approved') badgeClass = 'bg-yellow-100 text-yellow-700';
                  if (g.status === 'Confirmed') badgeClass = 'bg-red-100 text-red-700'; 
                  if (g.status.includes('Overridden') || g.status === 'Canceled' || g.status === 'Rejected') badgeClass = 'bg-slate-800 text-white';
                  if (g.is_vip) badgeClass = 'bg-amber-100 text-amber-700';

                  return (
                    <tr key={g.tracking_id} className={`border-b ${g.is_vip ? 'bg-amber-50' : 'border-slate-50'}`}>
                      <td className="p-4 font-mono text-xs font-bold">
                        {g.tracking_id} {g.is_vip && <Crown size={12} className="text-amber-500 inline"/>}
                      </td>
                      <td className="p-4 font-bold text-sm">
                        {g.room_name} 
                        {g.is_waitlist && <span className="ml-2 text-[9px] bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded uppercase tracking-wider">Waitlist</span>}
                        <br/>
                        <span className="text-xs text-slate-400 font-normal">
                          {g.schedules.length > 1 ? `${g.schedules.length} Days Block` : formatEthDateDisplay(g.start_time).split('-')[0]} • {g.full_name}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${badgeClass}`}>{g.status}</span>
                      </td>
                      <td className="p-4 text-center"><button onClick={() => setDetailsModal({ isOpen: true, group: g })} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Eye size={18}/></button></td>
                      <td className="p-4 text-center">
                        <select 
                          value="" 
                          onChange={(e) => {
                            const newStatus = e.target.value;
                            if (!newStatus) return;
                            if (newStatus === 'Delete') { handleDeleteGroup(g.all_ids); return; }
                            
                            let defaultMsg = '';
                            if (newStatus === 'Approved') defaultMsg = 'Your booking has been approved by the coordinator and is moving to confirmation. Please process payment.';
                            if (newStatus === 'Confirmed') defaultMsg = 'Your booking is fully confirmed and the slot is booked. We look forward to hosting you.';
                            if (newStatus === 'Rejected') defaultMsg = 'We regret to inform you that we cannot accommodate your request at this time.';
                            if (newStatus === 'Canceled') defaultMsg = 'Your booking has been canceled.';
                            if (newStatus === 'Pending') defaultMsg = 'Your booking status has been reverted to pending.';
                            
                            setEmailModal({ isOpen: true, ids: g.all_ids, status: newStatus, message: defaultMsg });
                          }} 
                          className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold outline-none cursor-pointer hover:border-[#198754]"
                        >
                          <option value="">Update Status...</option>
                          <option value="Pending">Set to Pending</option>
                          <option value="Approved">Approve (Wait/Pay)</option>
                          <option value="Confirmed">Confirm (Locked)</option>
                          <option value="Rejected">Reject</option>
                          <option value="Canceled">Cancel Booking</option>
                          <option value="Delete" className="text-red-500 font-bold">🗑️ Delete Record</option>
                        </select>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ALLOCATIONS TAB */}
        {activeTab === 'allocations' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-2">Active Events</h3>
              <p className="text-sm text-slate-500 mb-6">Assign staff and delegate tasks for upcoming confirmed events. (Listed per individual day)</p>
              {activeAllocations.length === 0 ? (
                <div className="bg-white p-10 text-center rounded-3xl border shadow-sm text-slate-500 font-bold">No active upcoming bookings.</div>
              ) : (
                activeAllocations.map(b => <AllocationCard key={b.booking_id} booking={b} dbServices={dbServices} staffList={staffList} onSave={handleSaveAllocation} />)
              )}
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 mb-6 pt-8 border-t border-slate-200">Allocation History</h3>
              {historyAllocations.length === 0 ? (
                <div className="bg-white p-10 text-center rounded-3xl border shadow-sm text-slate-500 font-bold">No past events recorded.</div>
              ) : (
                historyAllocations.map(b => <AllocationCard key={b.booking_id} booking={b} dbServices={dbServices} staffList={staffList} onSave={handleSaveAllocation} />)
              )}
            </div>
          </div>
        )}

        {/* FULLY FUNCTIONAL ETHIOPIAN CALENDAR */}
        {activeTab === 'calendar' && (
          <div>
            <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
              <button onClick={handlePrevMonth} className="p-3 bg-slate-50 rounded-xl hover:bg-[#198754] hover:text-white transition-colors"><ChevronLeft /></button>
              <h3 className="text-2xl font-black text-[#198754] uppercase tracking-wide">
                {ethMonthNames[calMonth]} {calYear} <span className="text-slate-400 text-lg">EC</span>
              </h3>
              <button onClick={handleNextMonth} className="p-3 bg-slate-50 rounded-xl hover:bg-[#198754] hover:text-white transition-colors"><ChevronRight /></button>
            </div>

            <div className="grid grid-cols-5 md:grid-cols-7 gap-4">
              {Array.from({ length: daysInEthMonth }).map((_, i) => {
                const day = i + 1;
                
                let dayStartGreg, dayEndGreg;
                try {
                  dayStartGreg = new EthDateTime(calYear, calMonth, day, 0, 0, 0).toEuropeanDate();
                  dayEndGreg = new EthDateTime(calYear, calMonth, day, 23, 59, 59).toEuropeanDate();
                } catch(e) { return null; }
                
                const dayBookings = bookings.filter(b => {
                  if (b.status === 'Rejected' || b.status === 'Canceled' || b.status.includes('Overridden')) return false;
                  if (!b.is_vip && b.status === 'Pending') return false;
                  
                  try {
                    const bStartEth = EthDateTime.fromEuropeanDate(new Date(b.start_time.replace(' ', 'T')));
                    const bEndEth = EthDateTime.fromEuropeanDate(new Date(b.end_time.replace(' ', 'T')));
                    
                    const startVal = bStartEth.year * 10000 + bStartEth.month * 100 + bStartEth.date;
                    const endVal = bEndEth.year * 10000 + bEndEth.month * 100 + bEndEth.date;
                    const currentVal = calYear * 10000 + calMonth * 100 + day;
                    
                    return (currentVal >= startVal && currentVal <= endVal); 
                  } catch(e) { return false; }
                });

                return (
                  <div key={i} className="bg-white p-4 rounded-xl border min-h-[120px] shadow-sm hover:shadow-md transition-shadow">
                    <p className="font-black text-slate-300 mb-2 text-lg">{day}</p>
                    {dayBookings.map(b => {
                      let colorClass = 'bg-slate-100 text-slate-600 border border-slate-200'; // Default / Pending
                      if (b.status === 'Approved') colorClass = 'bg-yellow-100 text-yellow-800 border border-yellow-300 shadow-sm';
                      if (b.status === 'Confirmed') colorClass = 'bg-red-500 text-white shadow-md border border-red-600';
                      if (b.is_vip) colorClass = 'bg-amber-600 text-white shadow-md border border-amber-700';

                      return (
                        <div key={b.booking_id} className={`text-[10px] p-2 rounded mb-1 font-bold ${colorClass}`}>
                          <p className="truncate">{b.is_vip && <Crown size={10} className="inline mr-1"/>}{b.room_name}</p>
                          <p className="truncate opacity-80">{b.full_name || b.email}</p>
                        </div>
                      )
                    })}
                  </div>
                );
              })}
            </div>
            
            <div className="flex flex-wrap justify-center gap-6 mt-8 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-slate-100 border border-slate-200 rounded"></div> Pending</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-yellow-400 border border-yellow-500 rounded"></div> Approved (Waitlist Open)</div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 border border-red-600 rounded"></div> Confirmed (Locked)</div>
            </div>

          </div>
        )}

        {/* MANAGE VENUES WITH IMAGE UPLOADER */}
        {activeTab === 'venues' && (
          <div className="grid lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl shadow-sm border max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold">Existing Venues</h3>
                <button onClick={() => { setVenueForm({ venue_id: '', name: '', capacity: '', price_per_hour: '', best_for: '' }); setPendingImages([]); }} className="flex items-center gap-1 text-xs font-bold text-[#198754] bg-green-50 px-3 py-2 rounded-lg">
                  <Plus size={14}/> Add New
                </button>
              </div>
              <div className="space-y-4">
                {rooms.map(room => (
                  <div key={room.venue_id} className={`flex flex-col p-4 border rounded-xl hover:bg-slate-50 transition-colors ${venueForm.venue_id === room.venue_id ? 'border-green-500 bg-green-50' : 'border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-sm">{room.name}</h4>
                        <p className="text-[10px] text-slate-500 uppercase">Cap: {room.capacity} | ${room.price_per_hour}/hr</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setVenueForm(room); setPendingImages([]); }} className="px-3 py-1 bg-blue-50 text-blue-600 font-bold rounded-lg text-xs">Edit</button>
                        <button onClick={() => handleDeleteVenue(room.venue_id)} className="px-3 py-1 bg-red-50 text-red-600 font-bold rounded-lg text-xs"><Trash2 size={14}/></button>
                      </div>
                    </div>
                    {room.best_for && <p className="text-xs text-slate-400 italic">Best for: {room.best_for}</p>}
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:col-span-7 sticky top-10 h-max">
              <div className="bg-white p-8 rounded-3xl shadow-xl border">
                {venueForm.venue_id && <VenueGallery venueId={venueForm.venue_id} />}
                <form onSubmit={handleSaveVenue} className="space-y-4 mt-6">
                  <h3 className="font-serif text-2xl font-bold mb-6 text-[#198754]">{venueForm.venue_id ? `Editing: ${venueForm.name}` : 'Create New Venue'}</h3>
                  <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                    <label className="text-xs font-bold text-slate-500 block mb-2"><ImageIcon className="inline mr-2 w-4 h-4"/>Upload Hall Images (Select Multiple)</label>
                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} disabled={isUploadingImages} className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-[#198754] file:text-white" />
                    {isUploadingImages && <p className="text-[10px] text-[#198754] mt-2 font-bold animate-pulse">Uploading to server...</p>}
                    {pendingImages.length > 0 && <p className="text-xs text-blue-600 font-bold mt-2">{pendingImages.length} images ready to save.</p>}
                  </div>
                  <div><label className="text-xs font-bold text-slate-500">Venue Name *</label><input required type="text" value={venueForm.name} onChange={e => setVenueForm({...venueForm, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none" /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-slate-500">Max Capacity *</label><input required type="number" value={venueForm.capacity} onChange={e => setVenueForm({...venueForm, capacity: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none" /></div>
                    <div><label className="text-xs font-bold text-slate-500">Price/Hour ($) *</label><input required type="number" value={venueForm.price_per_hour} onChange={e => setVenueForm({...venueForm, price_per_hour: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none" /></div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">Best For (Optional)</label>
                    <input type="text" value={venueForm.best_for || ''} onChange={e => setVenueForm({...venueForm, best_for: e.target.value})} placeholder="e.g. Seminars, Trainings, Diplomatic Meetings" className="w-full p-4 bg-slate-50 rounded-xl outline-none" />
                  </div>
                  <button type="submit" disabled={isUploadingImages} className="w-full bg-[#198754] text-white py-4 rounded-xl font-bold mt-6">
                    {isUploadingImages ? 'Uploading Images & Saving...' : (venueForm.venue_id ? 'Update Venue Data' : 'Create Venue Hall')}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* MANAGE SERVICES */}
        {activeTab === 'services' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold">Current Services</h3>
                <button onClick={() => setServiceForm({ id: '', name: '', price: '', category: 'Support' })} className="flex items-center gap-1 text-xs font-bold text-[#198754] bg-green-50 px-3 py-2 rounded-lg"><Plus size={14}/> Add New</button>
              </div>
              {dbServices.map(s => (
                <div key={s.id} className={`flex justify-between items-center py-3 px-4 border rounded-xl mb-2 transition-colors ${serviceForm.id === s.id ? 'border-green-500 bg-green-50' : 'border-slate-100'}`}>
                  <div><p className="font-bold text-sm">{s.name}</p><p className="text-[10px] text-slate-400 uppercase">{s.category} - ${s.price}</p></div>
                  <button onClick={() => setServiceForm(s)} className={`text-xs font-bold px-4 py-2 rounded-lg ${serviceForm.id === s.id ? 'bg-[#198754] text-white' : 'bg-blue-50 text-blue-600'}`}>Edit</button>
                </div>
              ))}
            </div>
            <div>
              <form onSubmit={handleSaveService} className="bg-white p-8 rounded-3xl shadow-xl border sticky top-10">
                <h3 className="font-bold text-xl mb-6 text-[#198754]">{serviceForm.id ? `Editing: ${serviceForm.name}` : 'Add New Service'}</h3>
                <div className="space-y-4">
                  <div><label className="text-xs font-bold text-slate-500">Service Name</label><input required type="text" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none" /></div>
                  <div><label className="text-xs font-bold text-slate-500">Price ($)</label><input required type="number" value={serviceForm.price} onChange={e => setServiceForm({...serviceForm, price: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none" /></div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">Category</label>
                    <select value={serviceForm.category} onChange={e => setServiceForm({...serviceForm, category: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none">
                      <option value="Support">Support</option><option value="Technical">Technical</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 mt-6">
                  {serviceForm.id && <button type="button" onClick={() => setServiceForm({id:'', name:'', price:'', category:'Support'})} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold">Cancel</button>}
                  <button type="submit" className="flex-1 bg-[#198754] text-white py-4 rounded-xl font-bold">{serviceForm.id ? 'Update Service' : 'Save Service'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MANAGE STAFF TAB */}
        {activeTab === 'staff' && (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold">Team Members</h3>
                <button onClick={() => setStaffForm({ staff_id: '', name: '', role: 'Technical', email: '', phone: '', password: '' })} className="flex items-center gap-1 text-xs font-bold text-[#198754] bg-green-50 px-3 py-2 rounded-lg">
                  <Plus size={14}/> Add Staff
                </button>
              </div>
              <div className="space-y-3">
                {staffList.map(staff => (
                  <div key={staff.staff_id} className={`p-4 border rounded-xl hover:bg-slate-50 transition-colors ${staffForm.staff_id === staff.staff_id ? 'border-green-500 bg-green-50' : 'border-slate-100'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-sm">{staff.name}</h4>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${staff.role === 'Admin' ? 'bg-purple-100 text-purple-700' : staff.role === 'Technical' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {staff.role}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setStaffForm({...staff, password: ''})} className="px-3 py-1 bg-blue-50 text-blue-600 font-bold rounded-lg text-xs">Edit</button>
                        <button onClick={() => handleDeleteStaff(staff.staff_id)} className="px-3 py-1 bg-red-50 text-red-600 font-bold rounded-lg text-xs"><Trash2 size={14}/></button>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500">{staff.email} • {staff.phone}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <form onSubmit={handleSaveStaff} className="bg-white p-8 rounded-3xl shadow-xl border sticky top-10">
                <h3 className="font-bold text-xl mb-6 text-[#198754]">{staffForm.staff_id ? `Editing: ${staffForm.name}` : 'Add New Staff'}</h3>
                <div className="space-y-4">
                  <div><label className="text-xs font-bold text-slate-500">Full Name *</label><input required type="text" value={staffForm.name} onChange={e => setStaffForm({...staffForm, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none" /></div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">Department Role *</label>
                    <select required value={staffForm.role} onChange={e => setStaffForm({...staffForm, role: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none">
                      <option value="Technical">Technical IT</option>
                      <option value="Support">General Support</option>
                      <option value="Admin">Administrator</option>
                    </select>
                  </div>
                  <div><label className="text-xs font-bold text-slate-500">Email Login</label><input type="email" value={staffForm.email} onChange={e => setStaffForm({...staffForm, email: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none" /></div>
                  <div><label className="text-xs font-bold text-slate-500">Phone</label><input type="text" value={staffForm.phone} onChange={e => setStaffForm({...staffForm, phone: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none" /></div>
                  <div>
                    <label className="text-xs font-bold text-slate-500">Password {staffForm.staff_id && "(Leave blank to keep current)"}</label>
                    <input type="password" value={staffForm.password} onChange={e => setStaffForm({...staffForm, password: e.target.value})} className="w-full p-4 bg-slate-50 rounded-xl outline-none" placeholder="Enter secure password" />
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  {staffForm.staff_id && <button type="button" onClick={() => setStaffForm({staff_id:'', name:'', role:'Technical', email:'', phone:'', password: ''})} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-xl font-bold">Cancel</button>}
                  <button type="submit" className="flex-1 bg-[#198754] text-white py-4 rounded-xl font-bold">{staffForm.staff_id ? 'Update Staff Member' : 'Save Staff Member'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}