'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, XCircle, Mail, Settings, TrendingUp, Sun, Moon, Loader, Upload, MapPin } from 'lucide-react';

export default function GoTouchGrassPro() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userName, setUserName] = useState('');
  const [settings, setSettings] = useState({
    contacts: [],
    reminderInterval: 180,
    emailEnabled: false,
    geminiApiKey: ''
  });
  
  const [stats, setStats] = useState({
    lastOutdoor: null,
    totalVerifications: 0,
    streak: 0
  });
  
  const [cameraActive, setCameraActive] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [currentRoast, setCurrentRoast] = useState('Loading your personalized roast...');
  const [loadingRoast, setLoadingRoast] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking');
  const [capturedImage, setCapturedImage] = useState(null);
  const [locationSuggestions, setLocationSuggestions] = useState(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Check backend health
  const checkBackend = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health', { signal: AbortSignal.timeout(3000) });
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

  // Load data on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedName = localStorage.getItem('userName') || '';
      const storedContacts = JSON.parse(localStorage.getItem('contacts') || '[]');
      const storedInterval = parseInt(localStorage.getItem('reminderInterval') || '180');
      const storedEmailEnabled = localStorage.getItem('emailEnabled') === 'true';
      const storedGeminiKey = localStorage.getItem('geminiApiKey') || '';
      
      setUserName(storedName);
      setSettings({
        contacts: storedContacts,
        reminderInterval: storedInterval,
        emailEnabled: storedEmailEnabled,
        geminiApiKey: storedGeminiKey
      });
      
      const storedLastOutdoor = localStorage.getItem('lastOutdoor') || null;
      const storedTotalVerifications = parseInt(localStorage.getItem('totalVerifications') || '0');
      const storedStreak = parseInt(localStorage.getItem('streak') || '0');
      
      setStats({
        lastOutdoor: storedLastOutdoor,
        totalVerifications: storedTotalVerifications,
        streak: storedStreak
      });
      
      // Check backend and load initial roast
      checkBackend().then(isConnected => {
        if (isConnected) {
          fetchRoast(0);
        } else {
          setCurrentRoast("Backend not running! Start it with: cd backend && npm start");
        }
      });
    }

    // Request notification permission
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const calculateHoursIndoor = () => {
    if (!stats.lastOutdoor) return 0;
    const diff = Date.now() - new Date(stats.lastOutdoor).getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  };

  const hoursIndoor = calculateHoursIndoor();

  const getBackgroundColor = () => {
    if (hoursIndoor < 3) return 'bg-gradient-to-br from-green-50 to-emerald-100';
    if (hoursIndoor < 6) return 'bg-gradient-to-br from-yellow-50 to-amber-100';
    return 'bg-gradient-to-br from-gray-100 to-slate-200';
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to load metadata
        await new Promise((resolve) => {
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play();
            resolve();
          };
        });
        
        setCameraActive(true);
        setCapturedImage(null);
      }
    } catch (error) {
      console.error('Camera error:', error);
      alert('Camera access denied or unavailable! Use the upload option instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCameraActive(false);
    }
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

  const captureAndVerify = async () => {
    if (!videoRef.current || !canvasRef.current) {
      alert('Camera not ready! Try again in a moment.');
      return;
    }
    
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to image for preview
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(imageDataUrl);
    stopCamera();
    
    // Verify the image
    await verifyImage(imageDataUrl);
  };

  const verifyImage = async (imageDataUrl) => {
    setVerifying(true);
    setVerificationResult(null);

    try {
      // Check if Gemini API key is set
      if (!settings.geminiApiKey) {
        alert('Please add your Gemini API key in Settings to use AI verification!');
        setVerifying(false);
        return;
      }

      // Use Gemini API for verification
      const base64Image = imageDataUrl.split(',')[1];
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${settings.geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                text: "Analyze this image and determine if the person is outdoors. Look for: natural lighting (sunlight), outdoor elements (sky, trees, grass, buildings exterior, streets, parks), outdoor activities. Return a JSON response with: {\"verified\": true/false, \"confidence\": \"high/medium/low\", \"message\": \"brief message\", \"reasons\": [\"reason1\", \"reason2\"]}"
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Image
                }
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      const aiText = data.candidates[0]?.content?.parts[0]?.text || '';
      
      // Extract JSON from response
      const jsonMatch = aiText.match(/\{[\s\S]*\}/);
      let result;
      
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback parsing
        const isOutdoor = aiText.toLowerCase().includes('outdoor') || 
                         aiText.toLowerCase().includes('outside') ||
                         aiText.toLowerCase().includes('verified');
        result = {
          verified: isOutdoor,
          confidence: 'medium',
          message: isOutdoor ? 'Looks like you\'re outside!' : 'This looks like indoors...',
          reasons: [aiText.substring(0, 200)]
        };
      }
      
      result.aiAnalysis = aiText;
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

        // Show browser notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('🎉 Grass Touched!', {
            body: 'You actually went outside! Your vitamin D is proud.',
            icon: '🌱'
          });
        }
      } else {
        // Failed verification - get a roast
        fetchRoast(hoursIndoor);
      }
    } catch (error) {
      console.error('Verification error:', error);
      alert(`Verification failed: ${error.message}\n\nMake sure your Gemini API key is valid!`);
    } finally {
      setVerifying(false);
    }
  };

  const getLocationSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      // Get user location
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;

      // Use Gemini to generate suggestions
      if (!settings.geminiApiKey) {
        alert('Please add your Gemini API key in Settings!');
        setLoadingSuggestions(false);
        return;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${settings.geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Generate 5 fun outdoor activities for someone at coordinates ${latitude}, ${longitude}. Consider the location and suggest specific things like: nearby parks, outdoor cafes, walking trails, scenic spots, outdoor sports. Format as a JSON array of strings like: ["Activity 1", "Activity 2", ...]`
            }]
          }]
        })
      });

      const data = await response.json();
      const aiText = data.candidates[0]?.content?.parts[0]?.text || '';
      
      // Extract JSON array
      const jsonMatch = aiText.match(/\[[\s\S]*\]/);
      let suggestions;
      
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = [
          'Take a walk in your nearest park',
          'Find a local coffee shop with outdoor seating',
          'Explore a nearby trail or nature area',
          'Visit a local landmark or scenic viewpoint',
          'Do some outdoor exercise or stretching'
        ];
      }

      setLocationSuggestions({
        latitude,
        longitude,
        activities: suggestions
      });

    } catch (error) {
      console.error('Location error:', error);
      
      // Provide generic suggestions if location fails
      setLocationSuggestions({
        latitude: null,
        longitude: null,
        activities: [
          'Take a walk around your neighborhood',
          'Visit your local park',
          'Find a nearby coffee shop with outdoor seating',
          'Go to a farmers market or outdoor shopping area',
          'Take a bike ride or jog around your area'
        ]
      });
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchRoast = async (hours) => {
    setLoadingRoast(true);
    try {
      console.log('Fetching roast for', hours, 'hours...');
      
      const response = await fetch('http://localhost:3001/api/ai/roast', {
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
      console.log('Roast received:', data);
      
      setCurrentRoast(data.roast || data.fallback || "You've been inside so long, your houseplants are judging you.");
    } catch (error) {
      console.error('Roast fetch error:', error);
      
      // Fallback roasts if backend fails
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
      const response = await fetch('http://localhost:3001/api/email/send-shame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName: userName || 'Your friend',
          contacts: settings.contacts,
          daysIndoor: Math.floor(hoursIndoor / 24)
        })
      });

      const data = await response.json();
      alert(`📧 Shame emails sent! ${data.roastLevel || ''}`);
    } catch (error) {
      alert('Failed to send emails. Make sure backend is running!');
    }
  };

  const saveSettings = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userName', userName);
      localStorage.setItem('contacts', JSON.stringify(settings.contacts));
      localStorage.setItem('reminderInterval', settings.reminderInterval.toString());
      localStorage.setItem('emailEnabled', settings.emailEnabled.toString());
      localStorage.setItem('geminiApiKey', settings.geminiApiKey);
      alert('⚙️ Settings saved successfully!');
    }
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
      {/* Backend Status Banner */}
      {backendStatus !== 'connected' && (
        <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4">
          <p className="text-red-900 font-semibold">⚠️ Backend Status: {backendStatus}</p>
          <p className="text-red-700 text-sm mt-1">
            {backendStatus === 'disconnected' 
              ? 'Backend not running! Start it: cd backend && npm start (Optional - AI verification works without it)' 
              : 'Backend error - check console logs'}
          </p>
          <button 
            onClick={checkBackend}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Hours Indoor</p>
              <p className="text-3xl font-bold text-gray-900">{hoursIndoor}h</p>
            </div>
            {hoursIndoor < 3 ? <Sun className="text-green-500" size={40} /> : <Moon className="text-gray-400" size={40} />}
          </div>
          <p className="text-xs text-gray-600 mt-2 font-medium">
            {hoursIndoor < 3 ? '✅ Doing great!' : hoursIndoor < 6 ? '⚠️ Time to go out' : '🚨 Touch grass NOW'}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Current Streak</p>
              <p className="text-3xl font-bold text-emerald-600">{stats.streak}</p>
            </div>
            <TrendingUp className="text-emerald-500" size={40} />
          </div>
          <p className="text-xs text-gray-600 mt-2 font-medium">Days of touching grass</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-700">Total Verifications</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalVerifications}</p>
            </div>
            <CheckCircle className="text-blue-500" size={40} />
          </div>
          <p className="text-xs text-gray-600 mt-2 font-medium">Times you proved it</p>
        </div>
      </div>

      {/* Location Suggestions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">📍 Things To Do Near You</h3>
          <button 
            onClick={getLocationSuggestions}
            disabled={loadingSuggestions}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
            <ul className="space-y-2">
              {locationSuggestions.activities.map((activity, i) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <span className="font-bold text-blue-600">{i + 1}.</span>
                  <span className="text-gray-800">{activity}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Roast Box */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg shadow-lg p-6 border-2 border-orange-200">
        <h3 className="text-lg font-bold text-gray-900 mb-3">🔥 Today's Roast</h3>
        {loadingRoast ? (
          <div className="flex items-center gap-3 py-4">
            <Loader className="animate-spin text-orange-500" size={24} />
            <p className="text-gray-600 italic">Generating your personalized roast...</p>
          </div>
        ) : (
          <p className="text-gray-700 italic text-lg min-h-[60px]">{currentRoast}</p>
        )}
        <button 
          onClick={() => fetchRoast(hoursIndoor)}
          disabled={loadingRoast}
          className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loadingRoast ? 'Loading...' : 'Roast Me Harder'}
        </button>
      </div>

      {/* Camera Section */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📸 Prove You Touched Grass</h3>
        
        {!cameraActive && !capturedImage ? (
          <div className="text-center py-12">
            <Camera size={64} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-6">Take a selfie outside to verify you actually touched grass</p>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={startCamera}
                className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition font-semibold flex items-center gap-2"
              >
                <Camera size={20} />
                Start Camera
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold flex items-center gap-2"
              >
                <Upload size={20} />
                Upload Photo
              </button>
            </div>
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : cameraActive ? (
          <div>
            <div className="relative rounded-lg overflow-hidden bg-black mb-4">
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline
                muted
                className="w-full h-auto"
                style={{ maxHeight: '500px', objectFit: 'cover' }}
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-3">
              <button 
                onClick={captureAndVerify}
                disabled={verifying}
                className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {verifying ? (
                  <>
                    <Loader className="animate-spin" size={20} />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Camera size={20} />
                    Capture & Verify
                  </>
                )}
              </button>
              <button 
                onClick={stopCamera}
                disabled={verifying}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : capturedImage ? (
          <div>
            <div className="mb-4">
              <img src={capturedImage} alt="Captured" className="w-full rounded-lg" />
            </div>
            {!verifying && !verificationResult && (
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    setCapturedImage(null);
                    startCamera();
                  }}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Retake Photo
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                >
                  Upload Different
                </button>
              </div>
            )}
            <input 
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        ) : null}

        {verifying && (
          <div className="mt-4 flex items-center justify-center gap-3 p-4 bg-blue-50 rounded-lg">
            <Loader className="animate-spin text-blue-500" size={24} />
            <p className="text-blue-700 font-medium">AI is analyzing your photo...</p>
          </div>
        )}

        {/* Verification Result */}
        {verificationResult && (
          <div className={`mt-4 p-4 rounded-lg ${verificationResult.verified ? 'bg-green-50 border-2 border-green-300' : 'bg-red-50 border-2 border-red-300'}`}>
            <div className="flex items-center gap-3 mb-2">
              {verificationResult.verified ? (
                <CheckCircle className="text-green-600" size={32} />
              ) : (
                <XCircle className="text-red-600" size={32} />
              )}
              <div>
                <h4 className="font-bold text-lg">{verificationResult.message}</h4>
                <p className="text-sm text-gray-600">Confidence: {verificationResult.confidence}</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {verificationResult.reasons?.map((reason, i) => (
                <p key={i} className="text-sm text-gray-700">{reason}</p>
              ))}
            </div>
            {verificationResult.aiAnalysis && (
              <p className="mt-3 text-sm italic text-gray-600 border-t pt-3">
                <strong>AI Analysis:</strong> {verificationResult.aiAnalysis.substring(0, 300)}...
              </p>
            )}
            <button 
              onClick={() => {
                setCapturedImage(null);
                setVerificationResult(null);
              }}
              className="mt-4 w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              Take Another Photo
            </button>
          </div>
        )}
      </div>

      {/* Emergency Email Section */}
      {hoursIndoor > 12 && settings.emailEnabled && settings.contacts.length > 0 && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <h3 className="text-lg font-bold text-red-900 mb-2">🚨 Emergency Intervention</h3>
          <p className="text-gray-700 mb-4">
            You've been inside {hoursIndoor} hours. Time to call for backup!
          </p>
          <button 
            onClick={sendShameEmails}
            className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold"
          >
            <Mail className="inline mr-2" size={20} />
            Send Shame Emails to {settings.contacts.length} Contact{settings.contacts.length !== 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">⚙️ Personal Settings</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
            <input 
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gemini API Key (Required for AI verification)
            </label>
            <input 
              type="password"
              value={settings.geminiApiKey}
              onChange={(e) => setSettings({...settings, geminiApiKey: e.target.value})}
              placeholder="Enter your Gemini API key"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Get your free API key at: <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-blue-600 underline">Google AI Studio</a>
            </p>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">👥 Accountability Contacts</h3>
        <p className="text-sm text-gray-600 mb-4">
          These people will receive hilarious emails if you don't go outside.
        </p>
        
        <div className="space-y-3 mb-4">
          {settings.contacts.length === 0 ? (
            <p className="text-gray-500 italic text-center py-4">No contacts added yet</p>
          ) : (
            settings.contacts.map((contact, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{contact.name}</p>
                  <p className="text-sm text-gray-600">{contact.email}</p>
                </div>
                <button 
                  onClick={() => removeContact(i)}
                  className="text-red-500 hover:text-red-700 font-medium"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <button 
          onClick={addContact}
          className="w-full px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"
        >
          + Add Contact
        </button>
      </div>

      <button 
        onClick={saveSettings}
        className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold"
      >
        💾 Save All Settings
      </button>

      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
        <h4 className="font-bold text-yellow-900 mb-2">🔒 Privacy Notice</h4>
        <p className="text-sm text-gray-700">
          Images are sent to Google's Gemini API for outdoor verification. No data is stored on servers. 
          Your API key is stored locally in your browser only.
        </p>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen ${getBackgroundColor()} transition-colors duration-1000`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-2">
            🌱 GoTouchGrass Pro
          </h1>
          <p className="text-gray-600 text-lg">
            The ultimate roast-powered outdoor accountability coach
          </p>
          {stats.lastOutdoor && (
            <p className="text-sm text-gray-500 mt-2">
              Last outdoor: {new Date(stats.lastOutdoor).toLocaleString()}
            </p>
          )}
          {backendStatus === 'connected' && (
            <p className="text-xs text-green-600 mt-1">✅ Backend Connected</p>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-lg shadow p-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'dashboard' 
                ? 'bg-emerald-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition ${
              activeTab === 'settings' 
                ? 'bg-emerald-500 text-white' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Settings className="inline mr-2" size={18} />
            Settings
          </button>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' ? renderDashboard() : renderSettings()}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500 text-sm">
          <p>Powered by GoTouchGrass Pro - Roasting people into wellness since 2025</p>
          <p className="mt-1">Your Wi-Fi router misses you less when you go outside 🌍</p>
        </div>
      </div>
    </div>
  );
}