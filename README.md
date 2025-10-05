# 🌱 GoTouchGrass Pro

**The ultimate roast-powered outdoor accountability coach**

A full-stack web application that uses facial recognition, image analysis, and AI to verify if you actually went outside. If you haven't touched grass in a while, it roasts you with hilarious messages and optionally emails your accountability partners.

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![Next.js](https://img.shields.io/badge/Next.js-14-black)

## ✨ Features

- 📸 **Camera Verification**: Take selfies to prove you went outside
- 🧠 **Smart Detection**: Analyzes brightness, color temperature, and time
- 🤖 **AI-Powered Roasts**: Custom funny messages via Google Gemini
- 📧 **Accountability Emails**: Automatic shame emails to friends/family
- 🔔 **Browser Notifications**: Real-time reminders and celebrations
- 🎨 **Color-Coded Shame**: Background changes based on indoor time
- 🔒 **Privacy-First**: All image analysis happens in your browser

## 🎯 Tech Stack

### Frontend
- **Next.js 14** - React framework
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Browser APIs** - Camera, LocalStorage, Notifications

### Backend
- **Node.js + Express** - Server
- **Google Gemini API** - AI text generation
- **SendGrid** - Email service
- **Helmet** - Security
- **CORS** - Cross-origin requests

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Gemini API key (free from Google)
- SendGrid API key (optional, for emails)

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/gotouchgrass-pro.git
cd gotouchgrass-pro
```

#### 2. Setup Backend

```bash
cd backend
npm install
```

Create `.env` file:

```env
PORT=3001
FRONTEND_URL=http://localhost:3000
GEMINI_API_KEY=your_gemini_api_key_here
SENDGRID_API_KEY=your_sendgrid_key_here  # Optional
SENDGRID_SENDER_EMAIL=your_email@example.com  # Optional
```

**Get API Keys:**
- **Gemini**: https://aistudio.google.com/apikey (Required)
- **SendGrid**: https://sendgrid.com (Optional, for emails)

Start backend:

```bash
npm start
```

#### 3. Setup Frontend

```bash
cd ../frontend
npm install
npm run dev
```

#### 4. Open Application

Go to: **http://localhost:3000**

## 📖 How It Works

### Image Verification Process

1. **User takes selfie** with device camera
2. **Browser analyzes** image metadata:
   - Average brightness (outdoor = brighter)
   - Color temperature (outdoor = cooler/bluer)
   - Timestamp (daytime = more credible)
3. **Metadata sent to backend** (not the photo!)
4. **AI verification** via Gemini API
5. **Result returned** with confidence score

### Privacy & Security

✅ **Photos never leave your device**  
✅ **No user accounts or authentication**  
✅ **All personal data stored locally**  
✅ **Open source and auditable**  

## 🎮 Usage

### First-Time Setup

1. Go to **Settings** tab
2. Enter your name
3. Set reminder interval (default: 3 hours)
4. Add accountability contacts (optional)
5. Enable email notifications (optional)
6. Save settings

### Daily Use

1. App tracks how long you've been indoors
2. Background color changes (green → yellow → gray)
3. Get funny AI-generated roasts
4. Click "Prove You Touched Grass"
5. Take outdoor selfie
6. Get verification result
7. Build your streak!

### Accountability Emails

If you're inside 12+ hours and have:
- Email enabled
- Contacts added
- SendGrid configured

Your friends will automatically receive hilarious accountability emails like:

> "Abhayjeet still hasn't touched grass. He's one with the Wi-Fi now."

## 🛠️ Configuration

### Backend Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Backend port (default: 3001) |
| `FRONTEND_URL` | No | Frontend URL for CORS |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `SENDGRID_API_KEY` | No | SendGrid API key |
| `SENDGRID_SENDER_EMAIL` | No | Verified sender email |

### Frontend Settings

All configurable via UI Settings tab:
- **Name**: Your display name
- **Reminder Interval**: Minutes between reminders
- **Email Enabled**: Toggle accountability emails
- **Contacts**: List of accountability partners

## 🌐 Deployment

### Option 1: Vercel (Frontend) + Render (Backend)

**Frontend to Vercel:**

```bash
cd frontend
npm install -g vercel
vercel
```

**Backend to Render:**

1. Push code to GitHub
2. Go to https://render.com
3. New Web Service → Connect repo
4. Build: `cd backend && npm install`
5. Start: `node backend/server.js`
6. Add environment variables in dashboard
7. Deploy!

**Update API URL in frontend:**

```javascript
// frontend/app/page.js
const API_URL = 'https://your-backend.onrender.com';
```

### Option 2: Railway

1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Add backend + frontend services
4. Configure environment variables
5. Deploy!

## 📁 Project Structure

```
gotouchgrass-pro/
├── backend/
│   ├── server.js           # Main backend server
│   ├── package.json        # Backend dependencies
│   └── .env                # Environment variables (gitignored)
│
├── frontend/
│   ├── app/
│   │   ├── page.js         # Main React component
│   │   ├── layout.js       # Root layout
│   │   └── globals.css     # Global styles
│   ├── package.json        # Frontend dependencies
│   └── .gitignore
│
└── README.md
```

## 🎨 Customization

### Change Roast Tone

Edit `backend/server.js`:

```javascript
const prompt = `You're a [GENTLE/BRUTAL/SARCASTIC] wellness assistant...`;
```

### Adjust Verification Threshold

```javascript
// backend/server.js - line ~180
const verified = score >= 60;  // Change to 40 (easier) or 80 (stricter)
```

### Modify Background Colors

```javascript
// frontend/app/page.js
const getBackgroundColor = () => {
  if (hoursIndoor < 3) return 'bg-gradient-to-br from-green-50 to-emerald-100';
  // Customize these!
}
```

## 🐛 Troubleshooting

### Camera not working
- Check browser permissions (click lock icon in URL bar)
- Use HTTPS in production
- Try Chrome/Edge (best compatibility)

### API 404 errors
- Verify Gemini API key is correct
- Try different model: `gemini-1.5-flash`
- Check API is enabled at Google Cloud Console

### CORS errors
- Update `FRONTEND_URL` in backend `.env`
- Verify frontend and backend URLs match

### LocalStorage not persisting
- Not in incognito/private mode?
- Try clearing browser cache
- Check browser console for errors

## 🤝 Contributing

Contributions welcome! Ideas:

- Mobile app version (React Native)
- Weather API integration
- GPS location verification
- Social features (challenge friends)
- Wearable device support
- Voice-activated roasts

## 📄 License

MIT License - feel free to use, modify, and distribute!

## 🙏 Acknowledgments

- **Google Gemini** for AI roasts
- **SendGrid** for email delivery
- **Next.js** team for amazing framework
- Everyone who needs reminding to touch grass 🌱

## 📧 Contact

Have questions or suggestions? Open an issue!

---

**Remember: The best code is code that gets you outside!** 🌞

Now stop reading this README and GO TOUCH GRASS! 😄
