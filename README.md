# SponsorMySetup — beginner MVP

This is a frontend prototype of the SponsorMySetup marketplace.

## Pages

- `index.html` — landing page + featured campaign
- `campaigns.html` — browse/search campaigns
- `campaign.html` — campaign details + sponsor spots
- `create.html` — creator campaign creation
- `dashboard.html` — creator dashboard
- `sponsors.html` — page explaining the brand side
- `login.html` — demo login

## What is working?

This version uses the browser's `localStorage`, so it can demonstrate the product without a backend.

Working:
- Search/filter campaigns
- Create a campaign
- Create custom sponsorship spots
- Upload an image and preview it
- Open a campaign
- Select an available sponsor spot
- Enter brand information
- Reserve a spot in demo mode
- Dashboard numbers update
- Sponsor activity appears on dashboard
- Demo login redirects to dashboard

## What is NOT connected yet?

This is NOT a production marketplace.

There is no:
- real user authentication
- real database
- real payment
- Stripe integration
- payout to creators
- email system
- admin panel
- secure file storage
- auction/bidding system

## How to run

Easiest:
1. Open this folder in VS Code.
2. Install/use the Live Server extension.
3. Right-click `index.html`.
4. Choose "Open with Live Server".

You can also deploy the static frontend to Vercel/Netlify/GitHub Pages.

## Next development stage

After you understand this frontend, the next version should replace localStorage with:

Frontend: React / Next.js
Backend + database: Supabase
Payments: Stripe
Image storage: Supabase Storage
Hosting: Vercel

Important: before accepting real money, you need to handle payment-provider requirements, marketplace/payout rules, taxes, refunds, terms, privacy, and fraud/security properly.
