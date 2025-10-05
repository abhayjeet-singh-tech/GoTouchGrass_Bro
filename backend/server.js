/**
 * GoTouchGrass Bro - Backend Server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({
  origin: "*",
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Slow down. Even the grass needs a break.' }
});
app.use('/api/', limiter);

// GEMINI AI SERVICE
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

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

    if (!response.ok) throw new Error(`Gemini API error ${response.status}`);
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error('Gemini API Error:', error);
    throw error;
  }
}

// EMAIL SERVICE (SendGrid)
const sgMail = require('@sendgrid/mail');
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

async function sendShameEmail(userName, recipientEmail, recipientName, daysIndoor) {
  if (!process.env.SENDGRID_API_KEY) {
    console.log('SendGrid not configured. Email skipped.');
    return { skipped: true };
  }

  const roasts = [
    `${userName} still hasn't touched grass. They're one with the Wi-Fi now.`,
    `Day ${daysIndoor} of ${userName}'s indoor marathon. Their vitamin D has filed a missing person report.`,
    `${userName}'s shadow filed for unemployment. It hasn't worked in ${daysIndoor} days.`
  ];

  const roast = roasts[Math.floor(Math.random() * roasts.length)];

  const msg = {
    to: recipientEmail,
    from: process.env.SENDGRID_SENDER_EMAIL,
    subject: `GoTouchGrass Alert: ${userName} Update`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: #10b981;">GoTouchGrass Accountability Report</h2>
        <p style="font-size: 16px;">${roast}</p>
        <p style="color: #666; margin-top: 30px;">
          You're receiving this because ${userName} asked you to help keep them accountable.
        </p>
      </div>
    `
  };

  await sgMail.send(msg);
  return { success: true };
}

// ROUTES
app.get('/api/health', (req, res) => {
  res.json({ status: 'alive', message: 'Server is up!' });
});

app.post('/api/ai/roast', async (req, res) => {
  try {
    const { hoursIndoor, userName, action, imageData, todayDate } = req.body;
    
    // Handle image verification
    if (action === 'verify_image' && imageData) {
      console.log('Image verification request received');
      console.log('Today date:', todayDate);
      console.log('Image data length:', imageData.length);
      
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not configured');
      }

      const prompt = `You're a hilarious wellness coach analyzing a photo. Check if this image shows someone ACTUALLY outdoors.

Look for:
- Real outdoor elements (sky, trees, grass, parks, streets, building exteriors)
- Natural daylight/sunlight
- Does it look like a REAL photo taken TODAY (${todayDate})?
- Not a screenshot, not indoors, not fake

Be funny and sarcastic but honest. Return ONLY this JSON format (no extra text):
{
  "verified": true,
  "confidence": "high",
  "message": "Yo, you actually touched grass! Nice!",
  "reasons": ["Real outdoor lighting detected", "Grass visible in photo"],
  "aiAnalysis": "Your funny detailed roast here"
}`;

      console.log('Calling Gemini 2.5 Flash...');

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  { text: prompt },
                  {
                    inline_data: {
                      mime_type: "image/jpeg",
                      data: imageData.replace(/^data:image\/\w+;base64,/, '')
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 800
            }
          })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Gemini API error:', response.status, errorText);
        throw new Error(`Gemini API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('Gemini response received');
      
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('AI response text:', aiText);
      
      // Try to extract JSON from the response
      const cleanedText = aiText.replace(/```json|```/g, '').trim();
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
      let result;
      
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
          console.log('Parsed JSON successfully:', result);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          // Fallback to text analysis
          const isOutdoor = aiText.toLowerCase().includes('outdoor') || 
                           aiText.toLowerCase().includes('outside') ||
                           aiText.toLowerCase().includes('grass') ||
                           aiText.toLowerCase().includes('park');
          
          result = {
            verified: isOutdoor,
            confidence: 'medium',
            message: isOutdoor ? 'Looks like grass was touched!' : 'Hmm, this looks pretty indoor to me...',
            reasons: [aiText.substring(0, 150) + '...'],
            aiAnalysis: aiText
          };
        }
      } else {
        // No JSON found - analyze the text
        console.log('No JSON found in response, analyzing text');
        const isOutdoor = aiText.toLowerCase().includes('outdoor') || 
                         aiText.toLowerCase().includes('outside') ||
                         aiText.toLowerCase().includes('grass') ||
                         aiText.toLowerCase().includes('park');
        
        result = {
          verified: isOutdoor,
          confidence: 'medium',
          message: isOutdoor ? 'Looks legit, grass detected!' : 'This looks pretty sus, probably indoors',
          reasons: [aiText.substring(0, 150)],
          aiAnalysis: aiText
        };
      }
      
      console.log('Sending result:', result);
      return res.json(result);
    }
    
    // Original roast logic (when not verifying image)
    console.log('Generating roast for', userName, 'who has been inside', hoursIndoor, 'hours');
    const prompt = `You're a hilarious wellness assistant roasting someone named ${userName || 'this person'} who has been indoors for ${hoursIndoor} hours. Create ONE short, witty roast (2-3 sentences max) that's funny but encouraging. Add emojis. Keep it PG-13 and sarcastic.`;
    const roast = await callGemini(prompt);
    console.log('Roast generated:', roast);
    res.json({ roast: roast.trim() });
  } catch (error) {
    console.error('API Error in /api/ai/roast:', error);
    res.status(500).json({ 
      verified: false,
      confidence: 'low',
      message: 'Backend error - check server logs',
      reasons: ['Error: ' + error.message],
      aiAnalysis: 'Could not analyze image. Error: ' + error.message,
      fallback: "You've been inside so long, your Wi-Fi router is your best friend now."
    });
  }
});

app.post('/api/ai/activities', async (req, res) => {
  try {
    const { city, userName } = req.body;
    console.log('Getting activities for city:', city);
    
    const prompt = `You're a sarcastic wellness coach. Suggest 5 fun outdoor activities someone can do near ${city || 'their area'}. 

Add emojis to make it fun! Be casual and slightly sarcastic but helpful. Format as a simple numbered list like:
1. Activity with emoji
2. Activity with emoji
etc.

Keep it short and punchy!`;
    
    const activities = await callGemini(prompt);
    console.log('Activities generated');
    res.json({ activities: activities.trim() });
  } catch (error) {
    console.error('Activities error:', error);
    res.status(500).json({ 
      fallback: '1. Walk to your mailbox\n2. Stand in your yard for 5 minutes\n3. Touch some grass\n4. Stare at the sun (don\'t actually)\n5. Wave at a neighbor'
    });
  }
});

app.post('/api/verify/metadata', async (req, res) => {
  try {
    const { brightness, colorTemp, timestamp } = req.body;
    let score = 0;
    let reasons = [];

    if (brightness > 120) {
      score += 30;
      reasons.push('Brightness looks outdoor-appropriate');
    } else if (brightness < 80) {
      reasons.push('Too dark for outdoor photo');
    } else {
      score += 15;
      reasons.push('Brightness is borderline');
    }

    if (colorTemp > 5500) {
      score += 30;
      reasons.push('Color temperature suggests daylight');
    } else if (colorTemp < 3500) {
      reasons.push('Color suggests indoor lighting');
    } else {
      score += 15;
      reasons.push('Color temperature is ambiguous');
    }

    const hour = new Date(timestamp).getHours();
    if (hour >= 8 && hour <= 19) {
      score += 20;
      reasons.push('Taken during daylight hours');
    }

    const aiCheckPrompt = `Based on brightness ${brightness}/255, color temp ${colorTemp}K, time ${new Date(timestamp).toLocaleTimeString()}, is this outdoor? Answer "OUTDOOR" or "INDOOR" with brief reason.`;
    
    let aiAnalysis = '';
    try {
      aiAnalysis = await callGemini(aiCheckPrompt);
      if (aiAnalysis.toUpperCase().includes('OUTDOOR')) score += 20;
    } catch (error) {
      aiAnalysis = 'AI analysis unavailable';
    }

    const verified = score >= 60;

    res.json({
      verified,
      score,
      confidence: `${score}%`,
      reasons,
      aiAnalysis: aiAnalysis.trim(),
      message: verified ? 'Looks legit! You touched grass!' : 'This looks indoor. Try again!'
    });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed', verified: false });
  }
});

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
      results
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

// ERROR HANDLING
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Something broke' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// START SERVER
app.listen(PORT, () => {
  console.log(`\nGoTouchGrass Bro Backend`);
  console.log(`Running on: http://localhost:${PORT}`);
  console.log(`Gemini: ${process.env.GEMINI_API_KEY ? 'Connected' : 'NOT CONFIGURED'}`);
  console.log(`SendGrid: ${process.env.SENDGRID_API_KEY ? 'Connected' : 'Optional'}\n`);
});



