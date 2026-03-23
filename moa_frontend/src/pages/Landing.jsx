import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import { Users, Clock, ArrowRight, ChevronLeft, ChevronRight, CheckCircle2, Crown } from 'lucide-react';
import VenueGallery from './VenueGallery'; 

import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function Landing({ rooms }) {
  const navigate = useNavigate();
  const featuredRoom = rooms.length > 0 ? rooms[0] : null;

  const handleBookRoom = (roomId) => {
    navigate('/booking', { state: { selectedRoomId: roomId } });
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  // Helper to split "Best For" text into an array
  const parseBestFor = (text) => {
    if (!text) return [];
    return text.split(',').map(item => item.trim()).filter(item => item.length > 0);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      
      {/* UPDATED HEADER NAVIGATION */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-slate-100 sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-10 h-10 bg-[#006837] rounded-lg flex items-center justify-center text-white font-bold text-xl">M</div>
          <div><h1 className="text-lg font-bold text-[#006837]">MoA</h1><p className="text-[10px] tracking-widest text-slate-400">Reservation System</p></div>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-600">
          <button onClick={() => scrollToSection('venues-section')} className="hover:text-[#198754] transition-colors">Our Venues</button>
          <button onClick={() => scrollToSection('impact-section')} className="hover:text-[#198754] transition-colors">Strategic Vision</button>
          <button onClick={() => navigate('/admin')} className="hover:text-[#198754] transition-colors">Staff Login</button>
          
          <button onClick={() => navigate('/booking')} className="bg-[#198754] text-white px-6 py-2.5 rounded-full shadow-lg hover:bg-[#146c43] transition-colors">Book a Room</button>
        </div>
      </nav>

      {/* HERO SECTION WITH DYNAMIC GALLERY */}
      <section className="relative pt-20 pb-32 px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="relative z-10">
            {/* NEW: Small Official Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-100 text-[#198754] text-xs font-black uppercase tracking-widest mb-6 shadow-sm">
              <Crown size={14} /> Official MoA Facility
            </div>

            {/* UPDATED: Meaningful Headline */}
            <h2 className="text-5xl lg:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-6 tracking-tight">
              The Premier Hub for <span className="text-[#006837]">Agricultural</span> Excellence.
            </h2>

            {/* NEW: Explanatory Sub-headline */}
            <p className="text-lg text-slate-500 mb-10 max-w-lg leading-relaxed font-medium">
              Host your high-level summits, diplomatic meetings, and technical workshops in Ethiopia's state-of-the-art Ministry of Agriculture conference venues.
            </p>

            {/* UPDATED: Dual Buttons for better UX */}
            <div className="flex flex-wrap gap-4">
              <button onClick={() => navigate('/booking')} className="bg-[#198754] text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-[#146c43] flex items-center gap-2 shadow-xl shadow-green-900/20 transition-all">
                Book a Venue <ArrowRight size={20} />
              </button>
              <button onClick={() => scrollToSection('venues-section')} className="bg-white text-slate-700 border-2 border-slate-100 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-50 hover:text-[#198754] transition-all">
                Explore Spaces
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="relative bg-slate-100 rounded-[2.5rem] aspect-[4/5] overflow-hidden shadow-2xl border-8 border-white">
              
              {featuredRoom ? (
                <VenueGallery venueId={featuredRoom.venue_id} isEditing={false} />
              ) : (
                <img src="https://images.unsplash.com/photo-1431540015161-0bf868a2d407" className="w-full h-full object-cover" alt="Hero fallback" />
              )}
              
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none"></div>
              <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white pointer-events-none">
                <p className="text-sm font-medium opacity-80 mb-1">Featured Space</p>
                <h3 className="text-2xl font-bold">{featuredRoom?.name || 'Loading...'}</h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FIXED SLIDER SECTION WITH DYNAMIC GALLERIES */}
      <section id="venues-section" className="py-24 bg-slate-50 px-8 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div><h2 className="text-4xl font-black text-slate-900">Discover Our Premium Halls</h2></div>
            <div className="flex gap-3">
              <button className="swiper-prev p-3 rounded-full bg-white shadow hover:bg-[#198754] hover:text-white transition-colors"><ChevronLeft /></button>
              <button className="swiper-next p-3 rounded-full bg-white shadow hover:bg-[#198754] hover:text-white transition-colors"><ChevronRight /></button>
            </div>
          </div>
          
          {rooms.length > 0 && (
            <Swiper modules={[Navigation, Pagination, Autoplay]} spaceBetween={30} slidesPerView={1} navigation={{ prevEl: '.swiper-prev', nextEl: '.swiper-next' }} autoplay={{ delay: 5000 }} breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}>
              {rooms.map(room => {
                // Parse the Best For string here!
                const bestForTags = parseBestFor(room.best_for);

                return (
                  <SwiperSlide key={room.venue_id}>
                    <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-slate-100 group h-[550px]">
                      <div className="h-56 overflow-hidden relative bg-slate-200 shrink-0">
                        <VenueGallery venueId={room.venue_id} isEditing={false} />
                        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-2 rounded-xl shadow-sm z-10 border border-slate-100">
                          <p className="text-xs font-black text-[#198754]">${room.price_per_hour || 0}/hr</p>
                        </div>
                      </div>
                      
                      <div className="p-8 flex-1 flex flex-col">
                        <h3 className="text-2xl font-black mb-4 text-slate-800 tracking-tight">{room.name}</h3>
                        
                        <div className="flex gap-4 mb-6 text-slate-500 text-xs font-bold border-b border-slate-100 pb-6">
                          <span className="flex items-center gap-1.5"><Users size={16} className="text-[#198754]"/> {room.capacity} Pax</span>
                          <span className="flex items-center gap-1.5"><Clock size={16} className="text-[#198754]"/> 24/7 Access</span>
                        </div>

                        {/* THE "BEST FOR" VERTICAL LIST */}
                        <div className="mb-8 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                          {bestForTags.length > 0 ? (
                            <div className="space-y-2.5">
                              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-3">Ideal For</p>
                              {bestForTags.map((tag, i) => (
                                <div key={i} className="flex items-start gap-2.5">
                                  <CheckCircle2 size={14} className="text-[#198754] shrink-0 mt-0.5" />
                                  <span className="text-sm font-medium text-slate-600 leading-snug">{tag}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-400 italic mt-4">Versatile multi-purpose hall.</p>
                          )}
                        </div>

                        <button onClick={() => handleBookRoom(room.venue_id)} className="w-full py-4 bg-slate-50 border-2 border-slate-100 text-slate-700 rounded-2xl font-bold group-hover:bg-[#198754] group-hover:border-[#198754] group-hover:text-white transition-all duration-300 shadow-sm mt-auto">
                          Check Availability
                        </button>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          )}
        </div>
      </section>

      <section id="impact-section" className="py-24 bg-white px-8">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-[#006837] font-bold uppercase tracking-widest text-sm mb-4">Strategic Impact</p>
          <h2 className="text-4xl font-bold text-slate-900 mb-16 max-w-2xl mx-auto tracking-tight">Empowering Ethiopian Agriculture through Innovation</h2>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              { title: "Diplomatic Hub", desc: "Hosting high-level meetings between international partners and government officials.", icon: "🏛️" },
              { title: "Technical Labs", desc: "Modern facilities for agricultural workshops and capacity building programs.", icon: "🌱" },
              { title: "Director Access", desc: "Priority booking systems for Ministry leadership and UNOPS technical staff.", icon: "👑" }
            ].map((item, i) => (
              <div key={i} className="bg-slate-50 p-10 rounded-[2rem] border border-slate-100 hover:shadow-xl transition-shadow duration-300">
                <div className="text-4xl mb-6">{item.icon}</div>
                <h3 className="text-xl font-bold mb-4 text-slate-800">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-950 text-white py-20 px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-[#006837] rounded flex items-center justify-center text-white font-bold">M</div>
              <span className="text-xl font-bold">MoA Conference Center</span>
            </div>
            <p className="text-slate-500 max-w-sm">Providing world-class infrastructure for the Ministry of Agriculture of Ethiopia.</p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-slate-200">Connect</h4>
            <p className="text-slate-500 text-sm">Addis Ababa, Ethiopia<br />Compound Gate 4</p>
          </div>
        </div>
      </footer>
    </div>
  );
}