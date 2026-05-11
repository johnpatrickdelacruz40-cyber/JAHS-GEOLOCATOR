import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { MapPin, Search, Navigation, Target, Copy, CheckCircle2, Map, MapPinned } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet markers in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to dynamically pan the map
function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 16);
  return null;
}

export default function App() {
  // State for Map and Display
  const [coords, setCoords] = useState({ lat: 14.8527, lng: 120.8160 }); 
  const [address, setAddress] = useState('Fetching address...');
  
  // State for Inputs and Modes
  const [searchMode, setSearchMode] = useState('coordinates'); // 'coordinates' or 'address'
  const [inputLat, setInputLat] = useState('14.8527');
  const [inputLng, setInputLng] = useState('120.8160');
  const [inputAddress, setInputAddress] = useState('');
  
  // State for UI feedback
  const [isLoading, setIsLoading] = useState(false);
  const [copiedData, setCopiedData] = useState('');

  // 1. REVERSE GEOCODING (Coordinates -> Address)
  const fetchAddressFromCoords = async (lat, lon) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();
      setAddress(data.display_name || 'Address not found for these coordinates.');
      setInputAddress(data.display_name || ''); // Auto-fill the address search bar too
    } catch (error) {
      setAddress('Database connection error. Unable to verify location.');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. FORWARD GEOCODING (Address -> Coordinates)
  const fetchCoordsFromAddress = async (searchQuery) => {
    setIsLoading(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        setCoords({ lat: newLat, lng: newLng });
        setInputLat(newLat.toFixed(6));
        setInputLng(newLng.toFixed(6));
        setAddress(data[0].display_name); // Update to the official formatted address
      } else {
        alert("Location not found. Try adding the city or province to your search.");
      }
    } catch (error) {
      alert("Error connecting to the mapping database.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Form Submissions based on active mode
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchMode === 'coordinates') {
      const newLat = parseFloat(inputLat);
      const newLng = parseFloat(inputLng);
      if (!isNaN(newLat) && !isNaN(newLng)) {
        setCoords({ lat: newLat, lng: newLng });
        fetchAddressFromCoords(newLat, newLng);
      } else {
        alert("Please enter valid numerical coordinates.");
      }
    } else {
      if (inputAddress.trim()) {
        fetchCoordsFromAddress(inputAddress);
      } else {
        alert("Please enter an address to search.");
      }
    }
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      setIsLoading(true);
      setSearchMode('coordinates'); // Switch back to coordinate mode to show GPS numbers
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setInputLat(latitude.toFixed(6));
          setInputLng(longitude.toFixed(6));
          setCoords({ lat: latitude, lng: longitude });
          fetchAddressFromCoords(latitude, longitude);
        },
        (error) => {
          alert("Unable to retrieve location. Check browser permissions.");
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

  // Initial load
  useEffect(() => { 
    fetchAddressFromCoords(coords.lat, coords.lng); 
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col selection:bg-blue-200">
      
      {/* Enterprise Header */}
      <header className="bg-slate-950 border-b border-slate-800 text-white px-6 py-4 flex items-center justify-between z-20 shadow-lg">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-1.5 rounded-lg border border-white/20 backdrop-blur-sm">
            <img src="/jahs-logo.png" alt="JAHS" className="h-8 w-8 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
            <MapPin className="text-blue-500 hidden h-8 w-8" />
          </div>
          <h1 className="font-black text-xl md:text-2xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            JAHS GEOLOCATOR
          </h1>
        </div>
      </header>

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        
        {/* Dual-Mode Control Panel */}
        <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 relative z-10">
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-6 border-b border-slate-100">
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Telemetry Search</h2>
              <p className="text-slate-500 text-sm mt-1">Pinpoint sites using coordinates or search by address.</p>
            </div>
            
            {/* Mode Toggle Buttons */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl w-full md:w-auto">
              <button 
                onClick={() => setSearchMode('coordinates')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${searchMode === 'coordinates' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <MapPinned size={16} /> Coordinates
              </button>
              <button 
                onClick={() => setSearchMode('address')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${searchMode === 'address' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Map size={16} /> Address
              </button>
            </div>
          </div>
          
          {/* Dynamic Form */}
          <form onSubmit={handleSearch} className="flex flex-wrap w-full gap-4 items-end">
            
            {searchMode === 'coordinates' ? (
              <>
                <div className="flex flex-col flex-1 min-w-[120px]">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Latitude</label>
                  <input type="text" value={inputLat} onChange={e => setInputLat(e.target.value)} placeholder="e.g. 14.8527" className="bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full font-mono font-bold shadow-inner transition-all hover:bg-slate-100" />
                </div>
                <div className="flex flex-col flex-1 min-w-[120px]">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Longitude</label>
                  <input type="text" value={inputLng} onChange={e => setInputLng(e.target.value)} placeholder="e.g. 120.8160" className="bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full font-mono font-bold shadow-inner transition-all hover:bg-slate-100" />
                </div>
              </>
            ) : (
              <div className="flex flex-col flex-1 w-full">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Site Location Address</label>
                <input type="text" value={inputAddress} onChange={e => setInputAddress(e.target.value)} placeholder="Enter street, city, or landmark..." className="bg-slate-50 border border-slate-200 text-slate-900 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full font-semibold shadow-inner transition-all hover:bg-slate-100" />
              </div>
            )}

            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <button type="submit" disabled={isLoading} className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/30 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70">
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Search size={18} /> Search</>}
              </button>
              
              {/* Only show GPS button in coordinate mode to prevent confusion */}
              {searchMode === 'coordinates' && (
                <button type="button" onClick={handleCurrentLocation} title="Use My Location" className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 flex items-center justify-center">
                  <Target size={18} />
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[550px]">
          {/* Map Area */}
          <div className="lg:col-span-2 bg-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative z-0 group">
            <MapContainer center={[coords.lat, coords.lng]} zoom={16} style={{ height: '100%', width: '100%' }}>
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <ChangeView center={[coords.lat, coords.lng]} />
              <Marker position={[coords.lat, coords.lng]}>
                <Popup className="font-bold text-center">
                  <span className="block text-blue-600 mb-1">JAHS DEPLOYMENT</span>
                  Lat: {coords.lat} <br/> Lng: {coords.lng}
                </Popup>
              </Marker>
            </MapContainer>
          </div>

          {/* Results Panel */}
          <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col relative z-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner border border-blue-100">
                <Navigation size={28} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Verified Telemetry</h3>
                <p className="text-slate-900 font-bold">JAHS</p>
              </div>
            </div>
            
            <div className="flex-1">
              {isLoading ? (
                <div className="space-y-3 mt-4">
                  <div className="h-4 bg-slate-100 rounded-md w-full animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded-md w-5/6 animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded-md w-4/6 animate-pulse"></div>
                </div>
              ) : (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 relative group transition-all">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                      Official Address
                    </span>
                    <button onClick={() => handleCopy(address, 'address')} className="p-1.5 bg-white rounded-md shadow-sm text-slate-400 hover:text-blue-600 transition-all border border-slate-100">
                      {copiedData === 'address' ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                  
                  {/* Read-only Address Block */}
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed break-words">
                    {address}
                  </p>
                </div>
              )}
            </div>
            
            <div className="mt-4 space-y-3">
              <div className="flex justify-between items-center bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 group relative">
                <span className="font-black text-slate-400 text-xs tracking-widest uppercase">Latitude</span>
                <span className="font-mono font-bold text-slate-900">{coords.lat}</span>
                <button onClick={() => handleCopy(coords.lat, 'lat')} className="absolute right-2 p-1.5 bg-white rounded-md shadow-sm text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
                  {copiedData === 'lat' ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="flex justify-between items-center bg-slate-50 px-5 py-4 rounded-2xl border border-slate-100 group relative">
                <span className="font-black text-slate-400 text-xs tracking-widest uppercase">Longitude</span>
                <span className="font-mono font-bold text-slate-900">{coords.lng}</span>
                <button onClick={() => handleCopy(coords.lng, 'lng')} className="absolute right-2 p-1.5 bg-white rounded-md shadow-sm text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
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