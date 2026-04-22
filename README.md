# GuardianNode 

GuardianNode is a professional, security-focused transaction monitoring and fraud interception dashboard. It provides real-time oversight of financial activities, integrating biometric-like verification (SIM Swap detection) and a physical "Voice Gate" for high-stakes authorization.

##  Key Features

- **Real-Time Dashboard**: A dark-themed interface for monitoring live transactions.
- **Fraud Interception**: Automatic detection of risky transactions based on SIM swap status and high-value thresholds.
- **Voice Gate Authorization**: Trigger physical phone calls to administrators for critical approvals using Africa's Talking Voice API.
- **Immutable Audit Logs**: Every approved or blocked transaction is hashed and recorded on the Stellar Testnet for transparent auditing.
- **API Health Monitoring**: Real-time status tracking of integrated security services.

## Tech Stack

- **Frontend**: React, Vite, Tailwind CSS, Recharts, Lucide React.
- **Backend**: Node.js, Express.
- **Integrations**: 
    - **Africa's Talking**: Voice API for admin calls and Insights API for SIM swap checks.
    - **Stellar**: Horizon Testnet for decentralized transaction logging.

## Project Structure

```text
GuardianNode/
├── client/           # React frontend application
│   ├── src/
│   │   ├── components/ # Dashboard and UI widgets
│   │   └── App.jsx
│   └── package.json
├── server/           # Express backend proxy
│   ├── services/     # Integration logic (AT, Stellar)
│   ├── index.js      # Main server entry point
│   └── .env          # Environment configuration (ignored)
└── README.md
```

## Setup & Installation

### Prerequisites
- Node.js (v18+)
- Africa's Talking API Key and Virtual Number
- Stellar Testnet Account (Secret & Public keys)

### 1. Server Setup
```bash
cd server
npm install
cp .env.example .env  # Then fill in your real credentials
npm run dev
```

### 2. Client Setup
```bash
cd client
npm install
npm run dev
```

## Environment Variables

The server requires a `.env` file with the following variables:

| Variable | Description |
| :--- | :--- |
| `PORT` | The port the backend server runs on (default: 3001) |
| `AT_USERNAME` | Your Africa's Talking username (e.g., sandbox) |
| `AT_API_KEY` | Your AT API Key |
| `AT_VIRTUAL_NUMBER`| Your AT Virtual Phone Number |
| `STELLAR_SECRET_KEY`| Your Stellar Testnet Secret Key |
| `STELLAR_PUBLIC_KEY`| Your Stellar Testnet Public Key |

## Security Note

This repository uses `.gitignore` to ensure that sensitive files like `.env` are never committed to version control. Always use the provided `.env.example` as a template for local development.

---
Built for secure financial ecosystems by Kavengi Lilian Kathini.
