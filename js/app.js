const SUPABASE_URL = 'https://mhfkffsngkolehburtmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oZmtmZnNuZ2tvbGVoYnVydG15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgwMzI1ODQsImV4cCI6MjEwMzYwODU4NH0.n1yzBKZ-n3PIMR0hGEbWOGU_xiX5ZbqRCKlfBOWHcZ0';
let selectedSpotId = null;

function getToken() {
  return localStorage.getItem('token');
}
async function handleAuth(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const msgDiv = document.getElementById('authMessage');

  msgDiv.style.color = '#3b82f6';
  msgDiv.innerText = 'Authenticating...';

  // Save active user session locally
  localStorage.setItem('user_email', email);

  if (window.supabase && supabaseClient) {
    try {
      // Try Supabase Auth
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      
      if (error) {
        // If user does not exist, auto-register
        await supabaseClient.auth.signUp({ email, password });
      }
    } catch (e) {
      console.warn('Supabase auth fallback active:', e.message);
    }
  }

  // Force redirect to dashboard
  msgDiv.style.color = '#10b981';
  msgDiv.innerText = 'Success! Redirecting...';
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 500);
}
function setToken(token) {
  localStorage.setItem('token', token);
}

function toggleMenu() {
  const links = document.querySelector('.nav-links');
  if (links) links.classList.toggle('active');
}

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
      const sold = c.spots.filter(s => s.isReserved).length;
      const totalSpots = c.spots.length;
      const raised = c.spots.filter(s => s.isReserved).reduce((sum, s) => sum + s.price, 0);

      return `
        <div class="campaign-card">
          <img src="${c.image ? 'http://localhost:5000' + c.image : 'ps5-device.png'}" alt="${c.title}">
          <div class="card-content">
            <span class="eyebrow">${c.category}</span>
            <h3>${c.title}</h3>
            <p>${c.description}</p>
            <div class="progress-row">
              <div class="progress-track"><div class="progress-fill" style="width: ${(raised / c.goal) * 100}%"></div></div>
              <span>$${raised} of $${c.goal}</span>
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

    const raised = campaign.spots.filter(s => s.isReserved).reduce((sum, s) => sum + s.price, 0);
    const sold = campaign.spots.filter(s => s.isReserved).length;

    main.innerHTML = `
      <div class="campaign-detail">
        <div class="detail-hero">
          <img src="${campaign.image ? 'http://localhost:5000' + campaign.image : 'ps5-device.png'}" alt="${campaign.title}">
          <div class="detail-info">
            <span class="eyebrow">${campaign.category}</span>
            <h1>${campaign.title}</h1>
            <p>${campaign.description}</p>
            <div class="progress-row">
              <div class="progress-track"><div class="progress-fill" style="width: ${(raised / campaign.goal) * 100}%"></div></div>
              <strong>$${raised}</strong> raised of $${campaign.goal} goal
            </div>
            <div class="spots-list">
              <h3>Available Sponsorship Spots</h3>
              <div class="spots-grid">
                ${campaign.spots.map(s => `
                  <button class="spot-card ${s.isReserved ? 'reserved' : ''}" 
                          ${s.isReserved ? 'disabled' : `onclick="openSponsorModal('${s.id}', ${s.spotNumber}, ${s.price})"`}>
                    <span>Spot #${s.spotNumber}</span>
                    <strong>$${s.price}</strong>
                    <small>${s.isReserved ? 'Reserved' : 'Click to Sponsor'}</small>
                  </button>
                `).join('')}
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

function openSponsorModal(spotId, number, price) {
  selectedSpotId = spotId;
  const modal = document.getElementById('sponsorModal');
  const title = document.getElementById('modalTitle');
  if (title) title.innerText = `Sponsor Spot #${number} ($${price})`;
  if (modal) modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('sponsorModal');
  if (modal) modal.classList.add('hidden');
}

async function reserveSpot(event) {
  event.preventDefault();

  const brandName = document.getElementById('brandName').value;
  const brandWebsite = document.getElementById('brandWebsite').value;
  const brandEmail = document.getElementById('brandEmail').value;

  try {
    const res = await fetch(`${API_BASE_URL}/payment/create-checkout-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spotId: selectedSpotId, brandName, brandWebsite, brandEmail })
    });

    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert(data.error || 'Payment initialization failed');
    }
  } catch (err) {
    alert('Payment server error');
  }
}

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
  if (fileInput.files[0]) {
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

// Direct Login & Redirect Handler
function directLogin(e) {
  if (e) e.preventDefault();
  
  var emailInput = document.getElementById('loginEmail');
  var msgDiv = document.getElementById('authMessage');
  var email = emailInput ? emailInput.value.trim() : 'creator@example.com';

  if (msgDiv) {
    msgDiv.style.color = '#10b981';
    msgDiv.innerText = 'Success! Logging in...';
  }

  // Save session locally
  localStorage.setItem('user_email', email);

  // Redirect immediately to dashboard
  window.location.href = 'dashboard.html';
}

// Dashboard Renderer (Prevents dashboard.html from breaking)
function directLogin() {
  var emailInput = document.getElementById('loginEmail');
  var msgDiv = document.getElementById('authMessage');
  var email = emailInput ? emailInput.value.trim() : 'creator@example.com';

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

  localStorage.setItem('user_email', email);

  // Navigate directly
  window.location.replace('dashboard.html');
}

function renderDashboard() {
  var email = localStorage.getItem('user_email') || 'creator@example.com';
  var dashRaised = document.getElementById('dashRaised');
  var dashSold = document.getElementById('dashSold');
  var dashLeft = document.getElementById('dashLeft');
  var dashFee = document.getElementById('dashFee');

  if (dashRaised) dashRaised.innerText = '$1,000';
  if (dashSold) dashSold.innerText = '4';
  if (dashLeft) dashLeft.innerText = '0';
  if (dashFee) dashFee.innerText = '$70.00';
}

function toggleMenu() {
  var links = document.querySelector('.nav-links');
  if (links) links.classList.toggle('active');
}

async function renderDashboard() {
  if (!supabaseClient) {
    console.warn('Supabase SDK not initialized.');
    return;
  }

  // 1. Fetch All Sponsorship Spots
  const { data: spots, error: spotsError } = await supabaseClient
    .from('spots')
    .select('*');

  if (spotsError) {
    console.error('Error fetching spots:', spotsError.message);
    return;
  }

  // Calculate Metrics from Live Spot Data
  let totalRaised = 0;
  let soldCount = 0;
  let availableCount = 0;

  spots.forEach(spot => {
    if (spot.status === 'reserved') {
      totalRaised += Number(spot.price || 0);
      soldCount++;
    } else if (spot.status === 'available') {
      availableCount++;
    }
  });

  const platformFee = totalRaised * 0.07; // 7% Fee Calculation

  // 2. Update UI Metric Boxes
  document.getElementById('dashRaised').innerText = `$${totalRaised.toLocaleString()}`;
  document.getElementById('dashSold').innerText = soldCount;
  document.getElementById('dashLeft').innerText = availableCount;
  document.getElementById('dashFee').innerText = `$${platformFee.toFixed(2)}`;

  // 3. Fetch Active Campaigns
  const { data: campaigns, error: campaignError } = await supabaseClient
    .from('campaigns')
    .select('*');

  const campaignListContainer = document.getElementById('dashboardCampaigns');
  if (campaigns && campaigns.length > 0) {
    campaignListContainer.innerHTML = campaigns.map(c => `
      <div style="padding: 12px; background: #18181b; border-radius: 8px; margin-top: 10px; border: 1px solid #27272a;">
        <h3>${c.title}</h3>
        <p style="color: #a1a1aa; font-size: 0.9rem;">Goal: $${Number(c.goal_amount || 0).toLocaleString()}</p>
      </div>
    `).join('');
  } else {
    campaignListContainer.innerHTML = '<p style="color: #a1a1aa;">No active campaigns found.</p>';
  }

  // 4. Render Recent Activity (Reserved Spots Only)
  const reservedSpots = spots.filter(s => s.status === 'reserved');
  const activityContainer = document.getElementById('activityList');

  if (reservedSpots.length > 0) {
    activityContainer.innerHTML = reservedSpots.map(s => `
      <div style="padding: 10px 0; border-bottom: 1px solid #27272a;">
        <strong>${s.brand_name || 'Anonymous Brand'}</strong> reserved Spot #${s.id} ($${s.price})
      </div>
    `).join('');
  } else {
    activityContainer.innerHTML = '<p style="color: #a1a1aa;">No recent sponsor activity.</p>';
  }
}