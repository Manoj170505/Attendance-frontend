# BioMax & eSSL Multi-Tenant Cloud Attendance Dashboard

Modern, real-time cloud attendance monitoring dashboard built with React, Vite, and Tailwind CSS. Connects to the BioMax / eSSL ADMS Cloud Engine with multi-tenancy, live biometric punch feeds, device manager, and hardware connection hub.

## 🚀 Features
- **Live Attendance Feed**: Real-time punch ingestion with 5-second polling stream and state badges.
- **Hardware Connection Hub**: Universal support for both Native Cloud ADMS devices (BioMax, ZKTeco SpeedFace) and Local Port 4370 devices (eSSL X 2008).
- **Multi-Tenant Roster**: Switch between company tenants and isolate device / employee access.
- **Interactive Biometric Simulator**: Test and simulate punches without physical hardware.
- **Device Management**: Register, monitor status, and inspect raw ADMS audit payloads.

## 🛠️ Tech Stack
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **API Client**: Axios

## 📦 Deployment
Deploy easily to **Vercel**, **Netlify**, or **Railway**:
Set the environment variable:
```env
VITE_API_URL=https://attendance-backend-production-48ca.up.railway.app
```
