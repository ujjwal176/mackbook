// -------------------------------------------------------------
// 1. SUPABASE CLIENT INITIALIZATION
// -------------------------------------------------------------
window.SUPABASE_URL = window.SUPABASE_URL || 'https://mhfkffsngkolehburtmy.supabase.co';
window.SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oZmtmZnNuZ2tvbGVoYnVydG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMzI1ODQsImV4cCI6MjEwMzYwODU4NH0.n1yzBKZ-n3PIMR0hGEbWOGU_xiX5ZbqRCKlfBOWHcZ0';

var supabaseClient;
if (window.supabase) {
  supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
} else {
  console.warn('Supabase SDK not detected on window.');
}

// Global Variables
let selectedSpotId = null;
let selectedSpotData = { id: 1, campaignId: 1, price: 250 };
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5000/api';

// Helper Functions
function getToken() {
  return localStorage.getItem('token');
}

function setToken(token) {
  localStorage.setItem('token', token);
}

function toggleMenu() {
  const links = document.querySelector('.nav-links');
  if (links) links.classList.toggle('active');
}

// -------------------------------------------------------------
// 2. AUTHENTICATION HANDLERS
// -------------------------------------------------------------
async function handleAuth(event) {
  if (event) event.preventDefault();
  const emailInput = document.getElementById('loginEmail');
  const passwordInput = document.getElementById('loginPassword');
  const msgDiv = document.getElementById('authMessage');

  const email = emailInput ? emailInput.value.trim() : 'creator@example.com';
  const password = passwordInput ? passwordInput.value : '';

  if (msgDiv) {
    msgDiv.style.color = '#3b82f6';
    msgDiv.innerText = 'Authenticating...';
  }

  localStorage.setItem('user_email', email);

  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) {
        await supabaseClient.auth.signUp({ email, password });
      }
    } catch (e) {
      console.warn('Supabase auth fallback active:', e.message);
    }
  }

  if (msgDiv) {
    msgDiv.style.color = '#10b981';
    msgDiv.innerText = 'Success! Redirecting...';
  }

  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 500);
}

function directLogin(e) {
  if (e) e.preventDefault();

  const emailInput = document.getElementById('loginEmail');
  const msgDiv = document.getElementById('authMessage');
  const email = emailInput ? emailInput.value.trim() : 'creator@example.com';

  if (!email) {
    if (msgDiv) {
      msgDiv.style.color = '#ef4444';
      msgDiv.innerText = 'Please enter an email address.';
    }
    return;
  }

  if (msgDiv) {
    msgDiv.style.color = '#10b981';
    msgDiv.innerText = 'Success! Logging in...';
  }

  // Save session & token so createCampaign() passes
  localStorage.setItem('user_email', email);
  localStorage.setItem('token', 'demo-session-token');

  window.location.replace('dashboard.html');
}

// -------------------------------------------------------------
// 3. CAMPAIGNS DISPLAY & MODALS
// -------------------------------------------------------------
async function renderCampaigns() {
  const search = document.getElementById('searchCampaigns')?.value || '';
  const category = document.getElementById('categoryFilter')?.value || 'all';

  try {
    const res = await fetch(`${API_BASE_URL}/campaigns?search=${encodeURIComponent(search)}&category=${encodeURIComponent(category)}`);
    const campaigns = await res.json();
    const grid = document.getElementById('campaignGrid');
    if (!grid) return;

    if (campaigns.length === 0) {
      grid.innerHTML = '<p class="muted">No campaigns found.</p>';
      return;
    }

    grid.innerHTML = campaigns.map(c => {
      const spotsArray = Array.isArray(c.spots) ? c.spots : [];
      const sold = spotsArray.filter(s => s.isReserved || s.status === 'reserved').length;
      const totalSpots = spotsArray.length;
      const raised = spotsArray.filter(s => s.isReserved || s.status === 'reserved').reduce((sum, s) => sum + (s.price || 0), 0);

      return `
        <div class="campaign-card">
          <img src="${c.image ? c.image : 'ps5-device.png'}" alt="${c.title}">
          <div class="card-content">
            <span class="eyebrow">${c.category || 'General'}</span>
            <h3>${c.title}</h3>
            <p>${c.description}</p>
            <div class="progress-row">
              <div class="progress-track"><div class="progress-fill" style="width: ${c.goal ? (raised / c.goal) * 100 : 0}%"></div></div>
              <span>$${raised} of $${c.goal || 0}</span>
            </div>
            <div class="card-footer">
              <small>${sold}/${totalSpots} spots sold</small>
              <a class="btn btn-secondary" href="campaign.html?id=${c.id}">View Campaign</a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } catch (err) {
    console.error('Failed to load campaigns:', err);
  }
}

async function renderCampaignDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const main = document.getElementById('campaignPage');
  if (!main || !id) return;

  try {
    const res = await fetch(`${API_BASE_URL}/campaigns/${id}`);
    const campaign = await res.json();
    const spotsArray = Array.isArray(campaign.spots) ? campaign.spots : [];

    const raised = spotsArray.filter(s => s.isReserved || s.status === 'reserved').reduce((sum, s) => sum + (s.price || 0), 0);

    main.innerHTML = `
      <div class="campaign-detail">
        <div class="detail-hero">
          <img src="${campaign.image ? campaign.image : 'ps5-device.png'}" alt="${campaign.title}">
          <div class="detail-info">
            <span class="eyebrow">${campaign.category || 'General'}</span>
            <h1>${campaign.title}</h1>
            <p>${campaign.description}</p>
            <div class="progress-row">
              <div class="progress-track"><div class="progress-fill" style="width: ${campaign.goal ? (raised / campaign.goal) * 100 : 0}%"></div></div>
              <strong>$${raised}</strong> raised of $${campaign.goal} goal
            </div>
            <div class="spots-list">
              <h3>Available Sponsorship Spots</h3>
              <div class="spots-grid">
                ${spotsArray.map(s => {
                  const isReserved = s.isReserved || s.status === 'reserved';
                  return `
                    <button class="spot-card ${isReserved ? 'reserved' : ''}" 
                            ${isReserved ? 'disabled' : `onclick="openSponsorModal('${s.id}', ${s.spotNumber || s.id}, ${s.price}, ${campaign.id})"`}>
                      <span>Spot #${s.spotNumber || s.id}</span>
                      <strong>$${s.price}</strong>
                      <small>${isReserved ? 'Reserved' : 'Click to Sponsor'}</small>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (err) {
    main.innerHTML = '<p>Error loading campaign details.</p>';
  }
}

function openSponsorModal(spotId, number, price, campaignId = 1) {
  selectedSpotId = spotId;
  selectedSpotData = { id: spotId, campaignId: campaignId, price: price };
  
  const modal = document.getElementById('sponsorModal');
  const title = document.getElementById('modalTitle');
  if (title) title.innerText = `Sponsor Spot #${number} ($${price})`;
  if (modal) modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('sponsorModal');
  if (modal) modal.classList.add('hidden');
}

// -------------------------------------------------------------
// 4. STRIPE PAYMENT HANDLING (EDGE FUNCTION)
// -------------------------------------------------------------
async function reserveSpot(event) {
  event.preventDefault();

  const brandName = document.getElementById('brandName')?.value || 'Anonymous Brand';
  const brandEmail = document.getElementById('brandEmail')?.value || '';
  const brandWebsite = document.getElementById('brandWebsite')?.value || '';

  const spotPrice = selectedSpotData.price || 250;
  const campaignId = selectedSpotData.campaignId || 1;
  const spotId = selectedSpotData.id || 1;

  const submitBtn = event.target.querySelector('button[type="submit"]');
  if (submitBtn) submitBtn.disabled = true;

  try {
    const response = await fetch(
      'https://mhfkffsngkolehburtmy.supabase.co/functions/v1/create-checkout-session',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaignId,
          spotId: spotId,
          spotPrice: spotPrice,
          brandName: brandName,
          brandEmail: brandEmail,
          brandWebsite: brandWebsite
        }),
      }
    );

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Failed to initiate checkout: ' + (data.error || 'Unknown error'));
      if (submitBtn) submitBtn.disabled = false;
    }
  } catch (error) {
    console.error('Payment Error:', error);
    alert('Network error initiating payment. Please try again.');
    if (submitBtn) submitBtn.disabled = false;
  }
}

// -------------------------------------------------------------
// 5. CAMPAIGN CREATION & DASHBOARD
// -------------------------------------------------------------
async function createCampaign(event) {
  event.preventDefault();
  const token = getToken();
  if (!token) {
    alert('Please login first to create a campaign');
    window.location.href = 'login.html';
    return;
  }

  const formData = new FormData();
  formData.append('title', document.getElementById('campaignTitle').value);
  formData.append('description', document.getElementById('campaignDescription').value);
  formData.append('category', document.getElementById('campaignCategory').value);
  formData.append('goal', document.getElementById('campaignGoal').value);
  formData.append('spotCount', document.getElementById('spotCount').value);
  formData.append('spotPrice', document.getElementById('spotPrice').value);

  const fileInput = document.getElementById('campaignImage');
  if (fileInput && fileInput.files[0]) {
    formData.append('image', fileInput.files[0]);
  }

  try {
    const res = await fetch(`${API_BASE_URL}/campaigns`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    if (res.ok) {
      alert('Campaign created successfully!');
      window.location.href = 'campaigns.html';
    } else {
      const data = await res.json();
      alert(data.message || 'Failed to create campaign');
    }
  } catch (err) {
    alert('Failed to publish campaign');
  }
}

async function renderDashboard() {
  if (!supabaseClient) {
    console.warn('Supabase SDK not initialized.');
    return;
  }

  const { data: campaigns, error } = await supabaseClient
    .from('campaigns')
    .select('id, title, description, goal, image_url, spots');

  if (error) {
    console.error('Error fetching campaigns:', error.message);
    return;
  }

  let totalRaised = 0;
  let soldCount = 0;
  let availableCount = 0;
  let recentActivity = [];

  if (campaigns) {
    campaigns.forEach(campaign => {
      const spotsArray = Array.isArray(campaign.spots) ? campaign.spots : [];

      spotsArray.forEach(spot => {
        if (spot.status === 'reserved' || spot.isReserved) {
          const price = Number(spot.price || 0);
          totalRaised += price;
          soldCount++;

          recentActivity.push({
            brandName: spot.brand_name || spot.brandName || 'Anonymous Sponsor',
            spotId: spot.id,
            price: price,
            campaignTitle: campaign.title
          });
        } else {
          availableCount++;
        }
      });
    });
  }

  const platformFee = totalRaised * 0.07;

  const dashRaised = document.getElementById('dashRaised');
  const dashSold = document.getElementById('dashSold');
  const dashLeft = document.getElementById('dashLeft');
  const dashFee = document.getElementById('dashFee');

  if (dashRaised) dashRaised.innerText = `$${totalRaised.toLocaleString()}`;
  if (dashSold) dashSold.innerText = soldCount;
  if (dashLeft) dashLeft.innerText = availableCount;
  if (dashFee) dashFee.innerText = `$${platformFee.toFixed(2)}`;

  const campaignListContainer = document.getElementById('dashboardCampaigns');
  if (campaignListContainer) {
    if (campaigns && campaigns.length > 0) {
      campaignListContainer.innerHTML = campaigns.map(c => `
        <div style="padding: 12px; background: #18181b; border-radius: 8px; margin-top: 10px; border: 1px solid #27272a;">
          <h3 style="margin: 0 0 5px 0;">${c.title}</h3>
          <p style="color: #a1a1aa; font-size: 0.9rem; margin: 0;">Goal: $${Number(c.goal || 0).toLocaleString()}</p>
        </div>
      `).join('');
    } else {
      campaignListContainer.innerHTML = '<p style="color: #a1a1aa;">No active campaigns found.</p>';
    }
  }

  const activityContainer = document.getElementById('activityList');
  if (activityContainer) {
    if (recentActivity.length > 0) {
      activityContainer.innerHTML = recentActivity.map(item => `
        <div style="padding: 10px 0; border-bottom: 1px solid #27272a;">
          <strong>${item.brandName}</strong> reserved Spot #${item.spotId} ($${item.price}) for <em>${item.campaignTitle}</em>
        </div>
      `).join('');
    } else {
      activityContainer.innerHTML = '<p style="color: #a1a1aa;">No recent sponsor activity.</p>';
    }
  }
}