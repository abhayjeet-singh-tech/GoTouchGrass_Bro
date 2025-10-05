/**
 * GoTouchGrass Pro - Backend Server
 * Because someone needs to enforce outdoor accountability
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: '🐌 Slow down. Even the grass needs a break.' }
});
app.use('/api/', limiter);

// ============================================================================
// GEMINI AI SERVICE
// ============================================================================

async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            temperature: 0.9,
            maxOutputTokens: 300
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

// ============================================================================
// EMAIL SERVICE (SendGrid)
// ============================================================================

const sgMail = require('@sendgrid/mail');
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

async function sendShameEmail(userName, recipientEmail, recipientName, daysIndoor) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('⚠️ SendGrid not configured. Email skipped.');
    return { skipped: true };
  }

  const roasts = [
    `${userName} still hasn't touched grass. They're one with the Wi-Fi now.`,
    `Day ${daysIndoor} of ${userName}'s indoor marathon. Their vitamin D has filed a missing person report.`,
    `${userName}'s shadow filed for unemployment. It hasn't worked in ${daysIndoor} days.`,
    `We're starting to think ${userName} is evolving into furniture.`,
    `${userName} has been indoors so long, their houseplants are getting more sun.`
  ];

  const roast = roasts[Math.floor(Math.random() * roasts.length)];

  const msg = {
    to: recipientEmail,
    from: process.env.SENDGRID_SENDER_EMAIL,
    subject: `🌱 GoTouchGrass Alert: ${userName} Update`,
    text: roast,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: #10b981;">🌱 GoTouchGrass Accountability Report</h2>
        <p style="font-size: 16px; line-height: 1.6;">${roast}</p>
        <p style="color: #666; font-size: 14px; margin-top: 30px;">
          You're receiving this because ${userName} asked you to help keep them accountable.
          Reply with encouragement (or more roasts).
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #999; font-size: 12px;">
          Powered by GoTouchGrass Pro - Roasting people into wellness since 2025
        </p>
      </div>
    `
  };

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('SendGrid Error:', error);
    throw error;
  }
}

// ============================================================================
// ROUTES
// ============================================================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'alive',
    message: 'Server is up. Unlike your outdoor activity count.',
    timestamp: new Date().toISOString()
  });
});

// Generate custom roast
app.post('/api/ai/roast', async (req, res) => {
  try {
    const { hoursIndoor, userName } = req.body;
    
    const prompt = `You're a funny wellness assistant roasting someone named ${userName || 'this person'} who has been indoors for ${hoursIndoor} hours. 
    Create ONE short, witty roast (2-3 sentences max) that's funny but encouraging. 
    End with motivation to go outside. Keep it PG-13 and lighthearted.`;

    const roast = await callGemini(prompt);
    res.json({ roast: roast.trim() });
  } catch (error) {
    console.error('Roast generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate roast',
      fallback: "You've been inside so long, your Wi-Fi router is your best friend now."
    });
  }
});

// Get outdoor activity suggestions
app.post('/api/ai/activities', async (req, res) => {
  try {
    const { city } = req.body;
    
    const prompt = `Suggest 3 fun outdoor activities someone could do near ${city || 'their city'}. 
    Keep it casual and slightly sarcastic. Format as a numbered list. 
    Each suggestion should be 1-2 sentences.`;

    const activities = await callGemini(prompt);
    res.json({ activities: activities.trim() });
  } catch (error) {
    console.error('Activity generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate activities',
      fallback: '1. Walk to your mailbox\n2. Stand in your yard\n3. Touch literally any grass'
    });
  }
});

// Analyze image metadata for outdoor verification
app.post('/api/verify/metadata', async (req, res) => {
  try {
    const { brightness, colorTemp, timestamp } = req.body;

    // Simple heuristics for outdoor detection
    let score = 0;
    let reasons = [];

    // Brightness check (outdoor photos typically brighter)
    if (brightness > 120) {
      score += 30;
      reasons.push('✅ Brightness looks outdoor-appropriate');
    } else if (brightness < 80) {
      reasons.push('❌ Too dark for outdoor photo');
    } else {
      score += 15;
      reasons.push('⚠️ Brightness is borderline');
    }

    // Color temperature (outdoor = cooler/bluer)
    if (colorTemp > 5500) {
      score += 30;
      reasons.push('✅ Color temperature suggests natural daylight');
    } else if (colorTemp < 3500) {
      reasons.push('❌ Color temperature suggests indoor lighting');
    } else {
      score += 15;
      reasons.push('⚠️ Color temperature is ambiguous');
    }

    // Time check (daytime = more likely outdoor)
    const hour = new Date(timestamp).getHours();
    if (hour >= 8 && hour <= 19) {
      score += 20;
      reasons.push('✅ Taken during daylight hours');
    } else {
      reasons.push('⚠️ Taken outside typical outdoor hours');
    }

    // AI detection prompt
    const aiCheckPrompt = `Based on these photo characteristics, is this likely an outdoor photo?
    - Brightness: ${brightness}/255
    - Color Temperature: ${colorTemp}K
    - Time: ${new Date(timestamp).toLocaleTimeString()}
    
    Answer with just: "OUTDOOR" or "INDOOR" followed by one sentence explanation.`;

    let aiAnalysis = '';
    try {
      aiAnalysis = await callGemini(aiCheckPrompt);
      const isOutdoor = aiAnalysis.toUpperCase().includes('OUTDOOR');
      if (isOutdoor) score += 20;
    } catch (error) {
      console.error('AI analysis failed:', error);
      aiAnalysis = 'AI analysis unavailable';
    }

    const verified = score >= 60;

    res.json({
      verified,
      score,
      confidence: `${score}%`,
      reasons,
      aiAnalysis: aiAnalysis.trim(),
      message: verified 
        ? '🌞 Looks legit! You actually touched grass!'
        : '🤔 Hmm... this looks suspiciously indoor. Try again outside!'
    });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ 
      error: 'Verification failed',
      verified: false,
      message: 'Something went wrong. Try again!'
    });
  }
});

// Send accountability email
app.post('/api/email/send-shame', async (req, res) => {
  try {
    const { userName, contacts, daysIndoor } = req.body;

    if (!contacts || contacts.length === 0) {
      return res.status(400).json({ error: 'No contacts provided' });
    }

    const results = [];
    for (const contact of contacts) {
      try {
        const result = await sendShameEmail(userName, contact.email, contact.name, daysIndoor);
        results.push({ email: contact.email, ...result });
      } catch (error) {
        results.push({ email: contact.email, error: error.message });
      }
    }

    res.json({ 
      success: true,
      message: `Processed ${contacts.length} contact(s)`,
      roastLevel: '🔥'.repeat(Math.min(daysIndoor, 5)),
      results
    });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ 
      error: 'Failed to send emails',
      details: error.message 
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('💥 Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Something broke. Maybe go outside?',
  });
});

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found. Like your motivation to go outside.',
    availableRoutes: [
      'GET /api/health',
      'POST /api/ai/roast',
      'POST /api/ai/activities',
      'POST /api/verify/metadata',
      'POST /api/email/send-shame'
    ]
  });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
  console.log(`\n🌱 GoTouchGrass Pro Backend`);
  console.log(`📍 Running on: http://localhost:${PORT}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🔑 Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`📧 SendGrid: ${process.env.SENDGRID_API_KEY ? '✅ Configured' : '⚠️ Optional (not configured)'}`);
  console.log(`🎯 Ready to roast indoor enthusiasts!\n`);
});

module.exports = app;