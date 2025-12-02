# Auro - Premium Gold Investment Platform

A high-fidelity simulated gold investment platform featuring real-time market simulation, gold mining packages, and a secure transaction management system.

## Features

- **Real-time Market Simulation**: Live gold price updates with trend tracking (Buy/Sell spreads).
- **Transactions**: Buy and Sell gold with simulated payment gateway integration (Screenshot upload & Admin verification).
- **Gold Mining**: Lock gold holdings to earn daily passive income (BDT).
- **Referral System**: Earn 50 BDT for signups + 5% commission on referred users' purchases.
- **Admin Dashboard**:
  - Manage daily gold prices.
  - Approve/Reject Buy & Sell transactions.
  - Configure Mining Packages (Cost & Daily Profit).
  - Update Referral Commission Rates.
  - Manage Payment Method instructions.
- **Security**: Role-based access control (User/Admin).

## Tech Stack

- **Frontend**: React 19, Tailwind CSS
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: React Context API
- **Simulation**: LocalStorage-based Mock Backend

## Prerequisites

- Node.js (v18 or higher recommended)

## Setup & Running

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Environment Setup:**
    Create a `.env.local` file in the root directory and add your Google Gemini API key (optional, for Market Insights feature):
    ```env
    API_KEY=your_gemini_api_key_here
    ```

3.  **Run the application:**
    ```bash
    npm run dev
    ```

4.  **Default Admin Credentials:**
    - **Email**: `admin@auro.com`
    - **Password**: `admin123`

## License

Private / Proprietary
