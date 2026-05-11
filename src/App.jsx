import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Search, Navigation, Target, Copy, CheckCircle2, Map, ShieldCheck, Activity } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for Leaflet marker icons in Vite/React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 16, { animate: true, duration: 1.5 });
  return null;
}

export default function App() {
  const [searchMode, setSearchMode] = useState('coords'); 
  const [coords, setCoords] = useState({ lat: 14.8527, lng: 120.8160 }); 
  
  const [inputLat, setInputLat] = useState('14.8527');
  const [inputLng, setInputLng] = useState('120.8160');
  const [inputAddress, setInputAddress] = useState('');
  
  const [verifiedAddress, setVerifiedAddress] = useState('Fetching address...');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedData, setCopiedData] = useState('');

  const fetchAddressFromCoords = async (lat, lon) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();
      setVerifiedAddress(data.display_name || 'Address not found in satellite database.');
      setInputAddress(data.display_name || '');
    } catch (error) {
      setVerifiedAddress('Secure connection error. Telemetry unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCoordsFromAddress = async (searchQuery) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        
        setCoords({ lat: newLat, lng: newLng });
        setInputLat(newLat.toFixed(6));
        setInputLng(newLng.toFixed(6));
        setVerifiedAddress(data[0].display_name);
      } else {
        setVerifiedAddress('Location not found. Try adding City and Province.');
      }
    } catch (error) {
      setVerifiedAddress('Secure connection error. Telemetry unavailable.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCoordinateSearch = (e) => {
    e.preventDefault();
    const newLat = parseFloat(inputLat);
    const newLng = parseFloat(inputLng);
    if (!isNaN(newLat) && !isNaN(newLng)) {
      setCoords({ lat: newLat, lng: newLng });
      fetchAddressFromCoords(newLat, newLng);
    } else {
      alert("Please enter valid numerical coordinates.");
    }
  };

  const handleAddressSearch = (e) => {
    e.preventDefault();
    if (inputAddress.trim().length > 3) {
      fetchCoordsFromAddress(inputAddress);
    } else {
      alert("Please enter a more specific address.");
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setInputLat(latitude.toFixed(6));
          setInputLng(longitude.toFixed(6));
          setCoords({ lat: latitude, lng: longitude });
          setSearchMode('coords'); 
          fetchAddressFromCoords(latitude, longitude);
        },
        (error) => {
          alert("Unable to retrieve location. Please check browser permissions.");
          setIsLoading(false);
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const handleCopy = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopiedData(type);
    setTimeout(() => setCopiedData(''), 2000);
  };

  useEffect(() => { 
    fetchAddressFromCoords(coords.lat, coords.lng); 
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white font-sans text-slate-800 flex flex-col selection:bg-blue-300">
      
      {/* Frosted Glass Header */}
      <header className="sticky top-0 z-[500] bg-slate-950/85 backdrop-blur-xl border-b border-white/10 text-white px-4 md:px-6 py-4 flex items-center justify-between shadow-2xl shadow-blue-900/20">
        <div className="flex items-center gap-3 md:gap-4 group cursor-pointer">
          <div className="bg-white/10 p-1.5 rounded-xl border border-white/20 backdrop-blur-md transition-all duration-500 group-hover:rotate-12 group-hover:bg-blue-500/20">
            <img src="/jahs-logo.png" alt="JAHS" className="h-6 w-6 md:h-8 md:w-8 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
            <MapPin className="text-blue-400 hidden h-6 w-6 md:h-8 md:w-8" />
          </div>
          <h1 className="font-black text-lg md:text-2xl tracking-tight bg-gradient-to-r from-white via-blue-100 to-slate-400 bg-clip-text text-transparent group-hover:from-blue-200 transition-all duration-500">
            JAHS GEOLOCATOR
          </h1>
        </div>
        <button onClick={handleCurrentLocation} className="md:hidden bg-gradient-to-tr from-blue-600 to-blue-500 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/30 active:scale-90 transition-all relative overflow-hidden group">
          <Target size={20} className="relative z-10 group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6 lg:gap-8">
        
        {/* Glassmorphism Control Panel */}
        <div className="bg-white/70 backdrop-blur-2xl p-5 md:p-7 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white relative z-10 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(59,130,246,0.12)] hover:bg-white/90 group">
          
          {/* Animated Mode Toggle */}
          <div className="flex bg-slate-100/80 p-1.5 rounded-2xl mb-7 relative overflow-hidden">
            <button 
              onClick={() => setSearchMode('coords')} 
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black transition-all duration-500 z-10 ${searchMode === 'coords' ? 'bg-white shadow-[0_4px_20px_rgb(0,0,0,0.08)] text-blue-600 scale-100 translate-y-0' : 'text-slate-500 hover:text-slate-800 scale-95 hover:bg-white/50'}`}
            >
              <MapPin size={18} className={searchMode === 'coords' ? 'animate-bounce' : ''} /> 
              <span className="hidden sm:inline">Search by</span> Coordinates
            </button>
            <button 
              onClick={() => setSearchMode('address')} 
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-black transition-all duration-500 z-10 ${searchMode === 'address' ? 'bg-white shadow-[0_4px_20px_rgb(0,0,0,0.08)] text-blue-600 scale-100 translate-y-0' : 'text-slate-500 hover:text-slate-800 scale-95 hover:bg-white/50'}`}
            >
              <Map size={18} className={searchMode === 'address' ? 'animate-pulse' : ''} /> 
              <span className="hidden sm:inline">Search by</span> Address
            </button>
          </div>

          {/* Form Area with Deep Hover States */}
          <div className="min-h-[85px]">
            {searchMode === 'coords' ? (
              <form onSubmit={handleCoordinateSearch} className="flex flex-col md:flex-row gap-4 items-end animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col w-full md:w-1/3 group/input">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2 transition-colors group-focus-within/input:text-blue-500">Latitude</label>
                  <input type="text" value={inputLat} onChange={e => setInputLat(e.target.value)} className="bg-slate-50/50 border-2 border-slate-100 text-slate-900 px-5 py-4 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full font-mono font-bold transition-all duration-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5" />
                </div>
                <div className="flex flex-col w-full md:w-1/3 group/input">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2 transition-colors group-focus-within/input:text-blue-500">Longitude</label>
                  <input type="text" value={inputLng} onChange={e => setInputLng(e.target.value)} className="bg-slate-50/50 border-2 border-slate-100 text-slate-900 px-5 py-4 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full font-mono font-bold transition-all duration-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5" />
                </div>
                <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
                  <button type="submit" className="flex-1 md:flex-none bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-2xl font-black transition-all duration-300 shadow-[0_8px_20px_rgb(59,130,246,0.3)] hover:shadow-[0_12px_25px_rgb(59,130,246,0.4)] active:scale-95 flex items-center justify-center gap-2 hover:-translate-y-1">
                    <Search size={18} className="animate-pulse" /> Locate
                  </button>
                  <button type="button" onClick={handleCurrentLocation} title="Use My Location" className="hidden md:flex bg-slate-900 hover:bg-slate-800 text-white px-5 py-4 rounded-2xl font-bold transition-all duration-300 shadow-lg hover:shadow-slate-500/20 active:scale-95 items-center justify-center hover:-translate-y-1 group/btn">
                    <Target size={20} className="group-hover/btn:rotate-90 transition-transform duration-500 text-blue-400" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleAddressSearch} className="flex flex-col md:flex-row gap-4 items-end animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-col w-full md:flex-1 group/input">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2 transition-colors group-focus-within/input:text-blue-500">Full Site Address</label>
                  <input type="text" value={inputAddress} onChange={e => setInputAddress(e.target.value)} placeholder="e.g. Malolos, Bulacan, Philippines" className="bg-slate-50/50 border-2 border-slate-100 text-slate-900 px-5 py-4 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none w-full font-semibold transition-all duration-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5 placeholder:text-slate-300" />
                </div>
                <button type="submit" className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-8 py-4 rounded-2xl font-black transition-all duration-300 shadow-[0_8px_20px_rgb(59,130,246,0.3)] hover:shadow-[0_12px_25px_rgb(59,130,246,0.4)] active:scale-95 flex items-center justify-center gap-2 hover:-translate-y-1">
                  <Navigation size={18} className="animate-pulse" /> Verify Route
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Desktop Grid / Mobile Stack */}
        <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[600px] pb-10">
          
          {/* Animated Map Area with Mobile Fix (shrink-0 flex-none) */}
          <div className="w-full lg:w-2/3 h-[55dvh] min-h-[400px] lg:h-full lg:min-h-0 shrink-0 flex-none bg-slate-200 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white overflow-hidden relative z-0 group block transition-all duration-700 hover:shadow-[0_12px_40px_rgb(0,0,0,0.12)]">
            <MapContainer center={[coords.lat, coords.lng]} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
              <TileLayer attribution='© OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <ChangeView center={[coords.lat, coords.lng]} />
              <Marker position={[coords.lat, coords.lng]}>
                <Popup className="font-bold text-center !rounded-2xl">
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-1 tracking-widest uppercase text-[10px] font-black">JAHS Site</span>
                  <span className="font-mono">Lat: {coords.lat}</span> <br/> <span className="font-mono">Lng: {coords.lng}</span>
                </Popup>
              </Marker>
            </MapContainer>
            
            {/* Cinematic Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-md z-[400] flex items-center justify-center animate-in fade-in duration-300">
                <div className="bg-white/90 backdrop-blur-xl text-slate-900 px-7 py-4 rounded-2xl font-black flex items-center gap-4 shadow-2xl animate-bounce border border-white">
                  <Activity className="text-blue-600 animate-pulse" size={24} /> Syncing Satellite...
                </div>
              </div>
            )}
          </div>

          {/* Glowing Results Panel */}
          <div className="w-full lg:w-1/3 bg-white/70 backdrop-blur-2xl p-6 md:p-8 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white flex flex-col relative z-10 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(59,130,246,0.12)] hover:bg-white/90">
            <div className="flex items-center gap-5 mb-8">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner border border-white relative overflow-hidden group">
                <div className="absolute inset-0 bg-blue-400/20 blur-xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700"></div>
                <ShieldCheck size={28} className="relative z-10" />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Live Telemetry
                </h3>
                <p className="text-slate-900 font-black text-xl bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent">Site Master Data</p>
              </div>
            </div>
            
            {/* Read-Only Address Block */}
            <div className="flex-1">
              <div className="bg-slate-50/50 backdrop-blur-sm p-6 rounded-[1.5rem] border-2 border-slate-100 relative group transition-all duration-500 hover:border-blue-200 hover:bg-white hover:shadow-xl hover:-translate-y-1">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-1.5 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100/50">
                    Verified Location
                  </span>
                  <button onClick={() => handleCopy(verifiedAddress, 'address')} className="p-2.5 bg-white rounded-xl shadow-sm text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-75 md:opacity-0 md:group-hover:opacity-100 border border-slate-100 z-20">
                    {copiedData === 'address' ? <CheckCircle2 size={16} className="text-green-500" /> : <Copy size={16} />}
                  </button>
                </div>
                
                {isLoading ? (
                  <div className="space-y-3 animate-pulse">
                    <div className="h-4 bg-slate-200 rounded-md w-full"></div>
                    <div className="h-4 bg-slate-200 rounded-md w-4/5"></div>
                  </div>
                ) : (
                  <p className="text-sm font-bold text-slate-700 leading-relaxed min-h-[60px]">
                    {verifiedAddress}
                  </p>
                )}
              </div>
            </div>
            
            {/* Coordinates Data */}
            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-center bg-slate-50/50 px-5 py-4.5 rounded-2xl border-2 border-slate-100 group relative transition-all duration-300 hover:border-blue-200 hover:bg-white hover:shadow-md hover:-translate-x-1">
                <span className="font-black text-slate-400 text-[10px] tracking-widest uppercase">Latitude</span>
                <span className="font-mono font-black text-slate-900 text-sm md:text-base">{coords.lat}</span>
                <button onClick={() => handleCopy(coords.lat, 'lat')} className="absolute right-2 p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-75 md:opacity-0 md:group-hover:opacity-100 border border-slate-100">
                  {copiedData === 'lat' ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 px-5 py-4.5 rounded-2xl border-2 border-slate-100 group relative transition-all duration-300 hover:border-blue-200 hover:bg-white hover:shadow-md hover:-translate-x-1">
                <span className="font-black text-slate-400 text-[10px] tracking-widest uppercase">Longitude</span>
                <span className="font-mono font-black text-slate-900 text-sm md:text-base">{coords.lng}</span>
                <button onClick={() => handleCopy(coords.lng, 'lng')} className="absolute right-2 p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all active:scale-75 md:opacity-0 md:group-hover:opacity-100 border border-slate-100">
                  {copiedData === 'lng' ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}