'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Mail, Settings, TrendingUp, Sun, Moon, Loader, Upload, MapPin, Palette } from 'lucide-react';

export default function GoTouchGrassPro() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userName, setUserName] = useState('');
  const [colorMode, setColorMode] = useState('green');
  const [settings, setSettings] = useState({
    contacts: [],
    reminderInterval: 180,
    emailEnabled: false
  });
  
  const [stats, setStats] = useState({
    lastOutdoor: null,
    totalVerifications: 0,
    streak: 0
  });
  
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [currentRoast, setCurrentRoast] = useState('Loading your personalized roast...');
  const [loadingRoast, setLoadingRoast] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [capturedImage, setCapturedImage] = useState(null);
  const [locationSuggestions, setLocationSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  const fileInputRef = useRef(null);

  // Set page title and favicon
  useEffect(() => {
    document.title = '🌱 GoTouchGrass Bro';
    
    // Create favicon
    const favicon = document.querySelector("link[rel*='icon']") || document.createElement('link');
    favicon.type = 'image/svg+xml';
    favicon.rel = 'icon';
    favicon.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🌱</text></svg>';
    document.head.appendChild(favicon);
  }, []);

  const colorModes = {
    green: 'bg-gradient-to-br from-green-50 via-emerald-100 to-green-200',
    yellow: 'bg-gradient-to-br from-yellow-50 via-amber-100 to-orange-200',
    orange: 'bg-gradient-to-br from-orange-100 via-red-100 to-red-200',
    red: 'bg-gradient-to-br from-red-200 via-red-300 to-red-400'
  };

  const checkBackend = async () => {
    try {
      const response = await fetch('https://go-touch-grass-bro.vercel.app/api/health', { signal: AbortSignal.timeout(3000) });
      if (response.ok) {
        setBackendStatus('connected');
        return true;
      } else {
        setBackendStatus('error');
        return false;
      }
    } catch (error) {
      setBackendStatus('disconnected');
      return false;
    }
  };

  useEffect(() => {
    const storedName = localStorage.getItem('userName') || '';
    const storedContacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    const storedInterval = parseInt(localStorage.getItem('reminderInterval') || '180');
    const storedEmailEnabled = localStorage.getItem('emailEnabled') === 'true';
    const storedColorMode = localStorage.getItem('colorMode') || 'green';
    
    setUserName(storedName);
    setColorMode(storedColorMode);
    setSettings({
      contacts: storedContacts,
      reminderInterval: storedInterval,
      emailEnabled: storedEmailEnabled
    });
    
    const storedLastOutdoor = localStorage.getItem('lastOutdoor');
    const storedTotalVerifications = parseInt(localStorage.getItem('totalVerifications') || '0');
    const storedStreak = parseInt(localStorage.getItem('streak') || '0');
    
    // Set initial values if nothing stored
    const initialLastOutdoor = storedLastOutdoor || new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const initialVerifications = storedTotalVerifications || 5;
    
    setStats({
      lastOutdoor: initialLastOutdoor,
      totalVerifications: initialVerifications,
      streak: storedStreak
    });
    
    // Save initial values if not already stored
    if (!storedLastOutdoor) {
      localStorage.setItem('lastOutdoor', initialLastOutdoor);
    }
    if (!localStorage.getItem('totalVerifications')) {
      localStorage.setItem('totalVerifications', initialVerifications.toString());
    }
    
    checkBackend().then(isConnected => {
      if (isConnected) {
        fetchRoast(0);
      } else {
        setCurrentRoast("Backend not running! Start it with: cd backend && npm start");
      }
    });

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const calculateHoursIndoor = () => {
    if (!stats.lastOutdoor) return 0;
    const diff = Date.now() - new Date(stats.lastOutdoor).getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  };

  const hoursIndoor = calculateHoursIndoor();

  const cycleColorMode = () => {
    const modes = ['green', 'yellow', 'orange', 'red'];
    const currentIndex = modes.indexOf(colorMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setColorMode(nextMode);
    localStorage.setItem('colorMode', nextMode);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target.result);
        verifyImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const verifyImage = async (imageDataUrl) => {
    setVerifying(true);
    setVerificationResult(null);

    try {
      const base64Image = imageDataUrl.split(',')[1];
      
      const todayDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });

      const response = await fetch('https://go-touch-grass-bro.vercel.app/api/ai/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          imageData: base64Image,
          todayDate: todayDate,
          userName: userName || 'Friend',
          action: 'verify_image'
        })
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();
      
      const result = {
        verified: data.verified || false,
        confidence: data.confidence || 'medium',
        message: data.message || 'Hmm, this looks suspicious...',
        reasons: data.reasons || ['Unable to fully analyze'],
        aiAnalysis: data.aiAnalysis || data.roast || 'Analysis unavailable'
      };
      
      setVerificationResult(result);

      if (result.verified) {
        const now = new Date().toISOString();
        const newStats = {
          lastOutdoor: now,
          totalVerifications: stats.totalVerifications + 1,
          streak: stats.streak + 1
        };
        
        setStats(newStats);
        localStorage.setItem('lastOutdoor', now);
        localStorage.setItem('totalVerifications', newStats.totalVerifications.toString());
        localStorage.setItem('streak', newStats.streak.toString());

        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Grass Touched!', {
            body: 'You actually went outside! Your vitamin D is proud.'
          });
        }
      } else {
        fetchRoast(hoursIndoor);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({
        verified: false,
        confidence: 'low',
        message: 'Verification failed - Backend unavailable',
        reasons: ['Make sure the backend is running'],
        aiAnalysis: error.message
      });
    } finally {
      setVerifying(false);
    }
  };

  const getLocationSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });

      const { latitude, longitude } = position.coords;

      // Use reverse geocoding to get city name
      let cityName = 'your area';
      try {
        const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const geoData = await geoResponse.json();
        cityName = geoData.address?.city || geoData.address?.town || geoData.address?.village || geoData.address?.county || 'your area';
      } catch (error) {
        console.log('Geocoding failed, using coordinates');
      }

      const response = await fetch('https://go-touch-grass-bro.vercel.app/api/ai/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: cityName,
          userName: userName || 'Friend'
        })
      });

      const data = await response.json();
      
      const activitiesText = data.activities || data.fallback || '';
      const activitiesArray = activitiesText
        .split('\n')
        .filter(line => line.trim())
        .map(line => line.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '').replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0);

      setLocationSuggestions({
        latitude,
        longitude,
        activities: activitiesArray
      });

    } catch (error) {
      console.error('Location error:', error);
      
      setLocationSuggestions({
        latitude: null,
        longitude: null,
        activities: [
          'Take a walk around your neighborhood',
          'Visit your local park',
          'Find a coffee shop with outdoor seating',
          'Go to a farmers market',
          'Take a bike ride around your area'
        ]
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchRoast = async (hours) => {
    setLoadingRoast(true);
    try {
      const response = await fetch('https://go-touch-grass-bro.vercel.app/api/ai/roast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          hoursIndoor: hours,
          userName: userName || 'Friend'
        })
      });

      if (!response.ok) {
        throw new Error(`Backend returned ${response.status}`);
      }

      const data = await response.json();
      setCurrentRoast(data.roast || data.fallback || "You've been inside so long, your houseplants are judging you.");
    } catch (error) {
      const fallbackRoasts = [
        "You've been inside so long, your houseplants are getting more sun than you.",
        "Your vitamin D called. It filed a missing person report.",
        "Even your Wi-Fi router is judging you at this point.",
        "Your shadow filed for unemployment.",
        "The sun forgot what you look like."
      ];
      
      setCurrentRoast(fallbackRoasts[Math.floor(Math.random() * fallbackRoasts.length)]);
      
      if (backendStatus === 'disconnected') {
        setCurrentRoast("Backend not running! Start it: cd backend && npm start");
      }
    } finally {
      setLoadingRoast(false);
    }
  };

  const sendShameEmails = async () => {
    if (settings.contacts.length === 0) {
      alert('Add contacts in Settings first!');
      return;
    }

    try {
      const response = await fetch('https://go-touch-grass-bro.vercel.app/api/email/send-shame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userName || 'Your friend',
          contacts: settings.contacts,
          daysIndoor: Math.floor(hoursIndoor / 24)
        })
      });

      const data = await response.json();
      alert(`Shame emails sent! ${data.message || ''}`);
    } catch (error) {
      alert('Failed to send emails. Make sure backend is running!');
    }
  };

  const saveSettings = () => {
    localStorage.setItem('userName', userName);
    localStorage.setItem('contacts', JSON.stringify(settings.contacts));
    localStorage.setItem('reminderInterval', settings.reminderInterval.toString());
    localStorage.setItem('emailEnabled', settings.emailEnabled.toString());
    alert('Settings saved successfully!');
  };

  const addContact = () => {
    const name = prompt('Contact name:');
    if (!name) return;
    
    const email = prompt('Contact email:');
    if (!email) return;
    
    if (name && email) {
      const newContacts = [...settings.contacts, { name, email }];
      setSettings({
        ...settings,
        contacts: newContacts
      });
    }
  };

  const removeContact = (index) => {
    const newContacts = settings.contacts.filter((_, idx) => idx !== index);
    setSettings({
      ...settings,
      contacts: newContacts
    });
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {backendStatus !== 'connected' && (
        <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 shadow-lg">
          <p className="text-red-900 font-semibold">Backend Status: {backendStatus}</p>
          <p className="text-red-700 text-sm mt-1">
            {backendStatus === 'disconnected' 
              ? 'Backend not running! Start it: cd backend && npm start' 
              : 'Backend error - check console logs'}
          </p>
          <button 
            onClick={checkBackend}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition"
          >
            Retry Connection
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Hours Indoor</p>
              <p className="text-4xl font-bold text-gray-900 mt-1">{hoursIndoor}h</p>
            </div>
            {hoursIndoor < 3 ? <Sun className="text-green-500" size={48} /> : <Moon className="text-gray-400" size={48} />}
          </div>
          <p className="text-xs text-gray-600 mt-3 font-medium">
            {hoursIndoor < 3 ? 'Doing great!' : hoursIndoor < 6 ? 'Time to go out' : 'Touch grass NOW'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Current Streak</p>
              <p className="text-4xl font-bold text-emerald-600 mt-1">{stats.streak}</p>
            </div>
            <TrendingUp className="text-emerald-500" size={48} />
          </div>
          <p className="text-xs text-gray-600 mt-3 font-medium">Days of touching grass</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Total Verifications</p>
              <p className="text-4xl font-bold text-blue-600 mt-1">{stats.totalVerifications}</p>
            </div>
            <CheckCircle className="text-blue-500" size={48} />
          </div>
          <p className="text-xs text-gray-600 mt-3 font-medium">Times you proved it</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Things To Do Near You</h3>
          <button 
            onClick={getLocationSuggestions}
            disabled={loadingSuggestions}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            {loadingSuggestions ? (
              <>
                <Loader className="animate-spin" size={18} />
                Loading...
              </>
            ) : (
              <>
                <MapPin size={18} />
                Get Suggestions
              </>
            )}
          </button>
        </div>

        {locationSuggestions && (
          <div>
            <ul className="space-y-3">
              {locationSuggestions.activities.map((activity, i) => (
                <li key={i} className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition">
                  <span className="font-bold text-blue-600 text-lg">{i + 1}.</span>
                  <span className="text-gray-800">{activity}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl shadow-lg p-6 border-2 border-orange-200 hover:shadow-xl transition-shadow">
        <h3 className="text-xl font-bold text-gray-900 mb-3">Today's Roast</h3>
        {loadingRoast ? (
          <div className="flex items-center gap-3 py-4">
            <Loader className="animate-spin text-orange-500" size={24} />
            <p className="text-gray-600 italic">Generating your personalized roast...</p>
          </div>
        ) : (
          <p className="text-gray-700 italic text-lg min-h-[60px] leading-relaxed">{currentRoast}</p>
        )}
        <button 
          onClick={() => fetchRoast(hoursIndoor)}
          disabled={loadingRoast}
          className="mt-4 px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
        >
          {loadingRoast ? 'Loading...' : 'Roast Me Harder'}
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Prove You Touched Grass</h3>
        
        {!capturedImage ? (
          <div className="text-center py-12">
            <Upload size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-6 text-lg">Upload a photo to verify you actually touched grass</p>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-8 py-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-semibold flex items-center gap-2 mx-auto shadow-lg hover:shadow-xl"
            >
              <Upload size={20} />
              Upload Photo
            </button>
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <img src={capturedImage} alt="Captured" className="w-full rounded-lg shadow-md" />
            </div>
            {!verifying && !verificationResult && (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition shadow-md"
              >
                Upload Different Photo
              </button>
            )}
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {verifying && (
          <div className="mt-4 flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-lg">
            <Loader className="animate-spin text-blue-500" size={24} />
            <p className="text-blue-700 font-medium">AI is analyzing your photo...</p>
          </div>
        )}

        {verificationResult && (
          <div className={`mt-4 p-6 rounded-lg shadow-md ${verificationResult.verified ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
            <div className="flex items-center gap-3 mb-3">
              {verificationResult.verified ? (
                <CheckCircle className="text-green-600" size={40} />
              ) : (
                <XCircle className="text-red-600" size={40} />
              )}
              <div>
                <h4 className="font-bold text-xl">{verificationResult.message}</h4>
                <p className="text-sm text-gray-600 mt-1">Confidence: {verificationResult.confidence}</p>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {verificationResult.reasons?.map((reason, i) => (
                <p key={i} className="text-sm text-gray-700 flex items-start gap-2">
                  <span className="text-lg">•</span>
                  <span>{reason}</span>
                </p>
              ))}
            </div>
            {verificationResult.aiAnalysis && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                <p className="text-sm font-semibold text-gray-700 mb-2">AI Analysis:</p>
                <p className="text-sm italic text-gray-600">{verificationResult.aiAnalysis}</p>
              </div>
            )}
            <button 
              onClick={() => {
                setCapturedImage(null);
                setVerificationResult(null);
              }}
              className="mt-4 w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition shadow-md"
            >
              Upload Another Photo
            </button>
          </div>
        )}
      </div>

      {hoursIndoor > 12 && settings.emailEnabled && settings.contacts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-red-900 mb-2">Emergency Intervention</h3>
          <p className="text-gray-700 mb-4">
            You've been inside {hoursIndoor} hours. Time to call for backup!
          </p>
          <button 
            onClick={sendShameEmails}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold flex items-center gap-2 shadow-md hover:shadow-lg"
          >
            <Mail size={20} />
            Send Shame Emails to {settings.contacts.length} Contact{settings.contacts.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
            <input 
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reminder Interval (minutes)
            </label>
            <input 
              type="number"
              value={settings.reminderInterval}
              onChange={(e) => setSettings({...settings, reminderInterval: parseInt(e.target.value) || 0})}
              min="1"
              max="1440"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <p className="text-xs text-gray-500 mt-1">How often to remind you to go outside</p>
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="checkbox"
              checked={settings.emailEnabled}
              onChange={(e) => setSettings({...settings, emailEnabled: e.target.checked})}
              className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
            />
            <label className="text-sm font-medium text-gray-700">
              Enable shame emails (requires SendGrid setup)
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Accountability Contacts</h3>
        <p className="text-sm text-gray-600 mb-4">
          These people will receive hilarious emails if you don't go outside.
        </p>
        
        <div className="space-y-3 mb-4">
          {settings.contacts.length === 0 ? (
            <p className="text-gray-500 italic text-center py-4">No contacts added yet</p>
          ) : (
            settings.contacts.map((contact, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-medium text-gray-900">{contact.name}</p>
                  <p className="text-sm text-gray-600">{contact.email}</p>
                </div>
                <button 
                  onClick={() => removeContact(i)}
                  className="text-red-500 hover:text-red-700 font-medium transition"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <button 
          onClick={addContact}
          className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition shadow-md"
        >
          + Add Contact
        </button>
      </div>

      <button 
        onClick={saveSettings}
        className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold shadow-lg hover:shadow-xl"
      >
        Save All Settings
      </button>

      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6 shadow-lg">
        <h4 className="font-bold text-yellow-900 mb-2">Privacy Notice</h4>
        <p className="text-sm text-gray-700">
          Images are sent to Google's Gemini API for outdoor verification. No data is stored on servers.
        </p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${colorModes[colorMode]} transition-all duration-700`}>
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-6xl font-bold text-gray-900">
              🌱 GoTouchGrass Bro
            </h1>
            <button
              onClick={cycleColorMode}
              className="p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
              title="Change color mode"
            >
              <Palette size={28} className="text-gray-700" />
            </button>
          </div>
          <p className="text-gray-600 text-xl">
            The ultimate roast-powered outdoor accountability coach
          </p>
          {stats.lastOutdoor && (
            <p className="text-sm text-gray-500 mt-2">
              Last outdoor: {new Date(stats.lastOutdoor).toLocaleString()}
            </p>
          )}
          {backendStatus === 'connected' && (
            <p className="text-xs text-green-600 mt-1">Backend Connected</p>
          )}
        </div>

        <div className="flex gap-2 mb-6 bg-white rounded-xl shadow-lg p-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'dashboard' 
                ? 'bg-emerald-500 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'settings' 
                ? 'bg-emerald-500 text-white shadow-md' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Settings className="inline mr-2" size={18} />
            Settings
          </button>
        </div>

        {activeTab === 'dashboard' ? renderDashboard() : renderSettings()}

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Powered by GoTouchGrass Pro - Roasting people into wellness since 2025</p>
          <p className="mt-1">Your Wi-Fi router misses you less when you go outside</p>
        </div>
      </div>
    </div>
  );
}
