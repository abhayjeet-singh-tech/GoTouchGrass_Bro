# 🌱 GoTouchGrass Pro  
### *AI-powered Roast & Outdoor Accountability System*  

> “A full-stack reality check that literally makes you touch grass.”  

<p align="center">
  <img src="https://img.shields.io/badge/AI-Gemini%202.5%20Flash-34A853?logo=google" />
  <img src="https://img.shields.io/badge/Frontend-Next.js%20%2B%20Tailwind-blue?logo=nextdotjs" />
  <img src="https://img.shields.io/badge/Backend-Node.js%20%2B%20Express-green?logo=nodedotjs" />
  <img src="https://img.shields.io/badge/License-MIT-yellow" />
</p>

---

## 🚀 Overview  

**GoTouchGrass Pro** is a funny yet functional app that uses **Google Gemini 2.5 Flash** to verify whether you’ve actually *touched grass* 🌿.  

Upload a photo → Gemini analyzes it → you either get praised for going outdoors or roasted for staying inside.  

It also sends **reminders, pings, and notifications** if you go too long without verifying your outdoor adventures — because accountability is key.  

---

## ✨ Features  

- **🌱 Outdoor Verification** – Upload a photo; Gemini AI checks if it’s truly outdoors.  
- **🔥 AI Roast Engine** – Get roasted if your image screams “basement dweller.”  
- **📍 Smart Location Suggestions** – Gemini suggests fun outdoor activities nearby.  
- **📧 Pings & Notifications** – Reminds (or publicly shames) you when you don’t touch grass.  
- **🎨 Dynamic Gradient Themes** – Change between 4 soothing color modes (green → red).  
- **🔔 Browser Notifications** – Subtle nudges to step away from your desk.  
- **📊 User Streak Tracker** – Keep tabs on how often you’ve been outdoors.  

---

## 🧩 Tech Stack  

| Layer | Technologies Used |
|-------|-------------------|
| **Frontend** | Next.js, React, TailwindCSS, Lucide Icons |
| **Backend** | Node.js + Express |
| **AI** | Google **Gemini 2.5 Flash** |
| **Database** | Auto-configured SQLite / local JSON |
| **Email / Notifs** | SendGrid (optional) + Browser Notifications |
| **Geo / Suggestions** | OpenStreetMap + Gemini reasoning |

---

## 🧠 How It Works  

1. Upload a photo of yourself (preferably outside).  
2. The backend sends it to **Gemini 2.5 Flash** for content verification.  
3. Gemini analyzes lighting, background, and environmental context.  
4. If you’re outdoors → you’re praised for touching grass.  
5. If not → Gemini roasts you harder than a Reddit comment section.  
6. If you stay indoors too long → GoTouchGrass pings you (and possibly your friends).  

---

## 🖼️ Screenshots  

<p align="center">
  <img width="1399" height="320" alt="image" src="https://github.com/user-attachments/assets/ad9e5036-9db2-4057-9287-c83400fb5db0" />
  <br/><em>🔥Dashboard</em>
</p>

<p align="center">
  <img width="1303" height="442" alt="image" src="https://github.com/user-attachments/assets/10f6a8dd-7e99-4e9d-b506-c54b6d27c7da" />
  <img width="1324" height="423" alt="image" src="https://github.com/user-attachments/assets/3a3dd5a3-b3a1-40c0-b151-0bb2467d1dad" />
  <br/><em> Switch between dynamic nature-inspired color themes.</em>
</p>

<p align="center">
  <img width="1029" height="898" alt="image" src="https://github.com/user-attachments/assets/1cce9e67-8051-4c32-ade7-73579d4c5539" />
  <br/><em>🔔 Manage your reminders, contacts, and notifications.</em>
</p>

<p align="center">
  <img width="1399" height="284" alt="image" src="https://github.com/user-attachments/assets/d4524eef-b55e-4a0c-9fb8-a24c3c2e1f46" />
  <br/><em>🔥 AI roast results – brutally honest outdoor diagnostics.</em>
</p>

<p align="center">
  <img width="526" height="110" alt="image" src="https://github.com/user-attachments/assets/19501f43-5279-4329-b3e6-037dcbbc4921" /> 
  <img width="526" height="110" alt="image" src="https://github.com/user-attachments/assets/fbe208db-a5ae-4a27-ad70-dcc7da234d31" />
  <img width="526" height="110" alt="image" src="https://github.com/user-attachments/assets/622e5034-be16-42e2-aa80-ce079093ffd4" />
  <img width="526" height="110" alt="image" src="https://github.com/user-attachments/assets/74dd43ee-837a-4691-87bb-7f87fdbaccf4" />
  <br/><em>🎨 Switch between dynamic nature-inspired color themes.</em>
</p>

<p align="center">
  <img width="347" height="106" alt="image" src="https://github.com/user-attachments/assets/704f239b-27b1-4411-983b-491de105667b" />
  <br/><em>🔔 Smart reminders and pings to get you moving outdoors.</em>
</p>

---

## ⚙️ Setup  

### 🧾 Prerequisites  
- Node.js 18+  
- Gemini API key (add to `.env` file)  
- Optional: SendGrid key for email notifications  

### 🛠 Installation  

```bash
# Clone the repo
git clone https://github.com/yourusername/go-touch-grass-pro.git
cd go-touch-grass-pro

# Install dependencies
npm install

# Start backend
cd backend
npm start

# Start frontend
cd ../frontend
npm run dev
# 🌱 GoTouchGrass Pro

The ultimate roast-powered outdoor accountability coach. Prove you went outside, get hilarious AI roasts if you didn’t, and track your grass-touching streaks.

---

## 🛠 Installation

### Clone the repo
```bash
git clone https://github.com/yourusername/go-touch-grass-pro.git
cd go-touch-grass-pro
```

### Install dependencies
```bash
npm install
```

### Start backend
```bash
cd backend
npm start
```

### Start frontend
```bash
cd ../frontend
npm run dev
```

Then visit 👉 [http://localhost:3000](http://localhost:3000)

---

## 📸 Example Output

**✅ Verified:**  
> “Yo, you actually touched grass! Nice job! Real sunlight, real vibes, no RGB needed.”

**❌ Not Verified:**  
> “This lighting screams 4K monitor, not sunshine. Go touch some actual photons.”

---

## 🔔 Notifications

- Local browser reminders when you’re overdue for a grass session.  
- Optional email pings using SendGrid (“Subject: Still indoors? 😬”).  
- Weekly summaries of your outdoor streaks.

---

## 🧪 Future Additions

- 🪩 Friend leaderboards  
- 🌎 “Grass Map” of verified outdoor spots  
- 🧭 Challenge mode (“Find a tree and prove it”)  
- 🗣 Voice notifications: “Bro, go outside.”

---


