// Data fetching and processing
const API_URL = 'https://users-data.diarcourse.workers.dev/';
let userData = [];
let filteredData = [];
let regionOptions = new Set();

// DOM elements
const usersContainer = document.getElementById('users-container');
const userCardTemplate = document.getElementById('user-card-template');
const loadingContainer = document.getElementById('loading-container');
const userCountElement = document.getElementById('user-count');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const filterAge = document.getElementById('filter-age');
const filterRegion = document.getElementById('filter-region');
const themeToggle = document.getElementById('theme-toggle');

// Chart instances
let ageChart, regionChart, screenChart;

// Check for saved theme preference
if (localStorage.getItem('theme') === 'dark') {
  document.body.classList.add('dark-theme');
  updateThemeToggleIcon(true);
}

// Initialize application
async function initApp() {
  try {
    await fetchData();
    setupEventListeners();
    renderCharts();
  } catch (error) {
    console.error('Error initializing app:', error);
    showError('Failed to load data. Please try again later.');
  }
}

// Fetch data from API
async function fetchData() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    userData = data.data || [];
    filteredData = [...userData];
    
    // Populate region filter options
    userData.forEach(user => {
      if (user.region) {
        regionOptions.add(user.region);
      }
    });
    
    populateRegionFilter();
    renderUserCards(userData);
    updateUserCount(userData.length);
    
    loadingContainer.style.display = 'none';
  } catch (error) {
    console.error('Error fetching data:', error);
    loadingContainer.innerHTML = `<p>Error loading data: ${error.message}</p>`;
  }
}

// Setup event listeners
function setupEventListeners() {
  // Search functionality
  searchButton.addEventListener('click', handleSearch);
  searchInput.addEventListener('keyup', e => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });
  
  // Filters
  filterAge.addEventListener('change', applyFilters);
  filterRegion.addEventListener('change', applyFilters);
  
  // Theme toggle
  themeToggle.addEventListener('click', toggleTheme);
  
  // Delegate event listener for details toggle buttons
  usersContainer.addEventListener('click', handleUserCardClicks);
}

// Handle clicks within user cards (for delegation)
function handleUserCardClicks(event) {
  const detailsToggle = event.target.closest('.details-toggle');
  if (detailsToggle) {
    const userCard = detailsToggle.closest('.user-card');
    const details = userCard.querySelector('.user-details');
    
    details.classList.toggle('hidden');
    detailsToggle.classList.toggle('active');
    
    if (details.classList.contains('hidden')) {
      detailsToggle.textContent = 'Show Details';
      detailsToggle.innerHTML = 'Show Details <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-down"><path d="m6 9 6 6 6-6"></path></svg>';
    } else {
      detailsToggle.textContent = 'Hide Details';
      detailsToggle.innerHTML = 'Hide Details <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chevron-down"><path d="m6 9 6 6 6-6"></path></svg>';
    }
  }
}

// Handle search
function handleSearch() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  
  if (searchTerm === '') {
    applyFilters(); // Reset to filter view if search is cleared
    return;
  }
  
  const results = userData.filter(user => {
    return (
      (user.nama && user.nama.toLowerCase().includes(searchTerm)) ||
      (user.email && user.email.toLowerCase().includes(searchTerm)) ||
      (user.whatsapp && user.whatsapp.toLowerCase().includes(searchTerm)) ||
      (user.ip && user.ip.toLowerCase().includes(searchTerm)) ||
      (user.cityA && user.cityA.toLowerCase().includes(searchTerm))
    );
  });
  
  filteredData = results;
  renderUserCards(results);
  updateUserCount(results.length);
}

// Apply age and region filters
function applyFilters() {
  const ageFilter = filterAge.value;
  const regionFilter = filterRegion.value;
  
  let results = userData;
  
  if (ageFilter) {
    results = results.filter(user => user.age === ageFilter);
  }
  
  if (regionFilter) {
    results = results.filter(user => user.region === regionFilter);
  }
  
  filteredData = results;
  renderUserCards(results);
  updateUserCount(results.length);
}

// Populate region filter dropdown
function populateRegionFilter() {
  const sortedRegions = Array.from(regionOptions).sort();
  
  sortedRegions.forEach(region => {
    const option = document.createElement('option');
    option.value = region;
    option.textContent = region;
    filterRegion.appendChild(option);
  });
}

// Render user cards
function renderUserCards(users) {
  usersContainer.innerHTML = '';
  
  if (users.length === 0) {
    usersContainer.innerHTML = '<p class="no-results">No users found matching your criteria.</p>';
    return;
  }
  
  users.forEach((user, index) => {
    const card = document.importNode(userCardTemplate.content, true);
    const userCard = card.querySelector('.user-card');
    
    // Set animation order for staggered animation
    userCard.style.setProperty('--animation-order', index);
    
    // Populate user data
    card.querySelector('.user-name').textContent = user.nama || 'Unknown';
    card.querySelector('.user-timestamp').textContent = `${user.DayOfWeek || ''} ${formatDate(user.stamp) || ''}`;
    card.querySelector('.user-whatsapp').textContent = user.whatsapp || 'N/A';
    card.querySelector('.user-email').textContent = user.email || 'N/A';
    card.querySelector('.user-age').textContent = user.age || 'N/A';
    card.querySelector('.user-ip').textContent = user.ip || 'N/A';
    card.querySelector('.user-isp').textContent = formatISP(user.isp) || 'N/A';
    card.querySelector('.user-screen').textContent = user.screen || 'N/A';
    
    // Location
    const location = `${user.cityA || ''}, ${user.cityB || ''}, ${user.region || ''} ${user.country || ''}`;
    card.querySelector('.user-location').textContent = location.replace(/^, /, '').replace(/, ,/g, ',') || 'N/A';
    
    // Details
    card.querySelector('.user-language').textContent = user.language || 'N/A';
    card.querySelector('.user-hostname').textContent = user.hostname || 'None';
    card.querySelector('.user-postal').textContent = user.postal || 'N/A';
    card.querySelector('.user-field').textContent = user.field || 'N/A';
    card.querySelector('.user-status').textContent = user.status || 'N/A';
    card.querySelector('.user-localtime').textContent = user.LocalTime || 'N/A';
    
    usersContainer.appendChild(card);
  });
}

// Format date from ISO string
function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  } catch (e) {
    return dateString;
  }
}

// Format ISP string to be more readable
function formatISP(isp) {
  if (!isp) return '';
  
  // Remove AS number prefix
  return isp.replace(/^AS\d+\s/, '');
}

// Update user count display
function updateUserCount(count) {
  userCountElement.textContent = `(${count} users)`;
}

// Show error message
function showError(message) {
  loadingContainer.innerHTML = `<p class="error-message">${message}</p>`;
}

// Toggle dark/light theme
function toggleTheme() {
  const isDarkMode = document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  updateThemeToggleIcon(isDarkMode);
  
  // Update charts with new theme colors
  if (ageChart && regionChart && screenChart) {
    updateChartsTheme();
  }
}

// Update theme toggle icon
function updateThemeToggleIcon(isDarkMode) {
  themeToggle.innerHTML = isDarkMode 
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path></svg>';
}

// Render data visualization charts
function renderCharts() {
  renderAgeDistributionChart();
  renderRegionDistributionChart();
  renderScreenSizeChart();
}

// Update charts when theme changes
function updateChartsTheme() {
  const textColor = getComputedStyle(document.body).getPropertyValue('--text-primary');
  
  [ageChart, regionChart, screenChart].forEach(chart => {
    if (chart) {
      chart.updateOptions({
        theme: {
          mode: document.body.classList.contains('dark-theme') ? 'dark' : 'light'
        },
        xaxis: {
          labels: { style: { colors: textColor } }
        },
        yaxis: {
          labels: { style: { colors: textColor } }
        }
      });
    }
  });
}

// Render age distribution chart
function renderAgeDistributionChart() {
  // Count users by age group
  const ageGroups = {};
  userData.forEach(user => {
    const age = user.age || 'Unknown';
    ageGroups[age] = (ageGroups[age] || 0) + 1;
  });
  
  // Prepare data for chart
  const series = [{
    name: 'Users',
    data: Object.values(ageGroups)
  }];
  
  const options = {
    chart: {
      type: 'bar',
      height: 200,
      toolbar: { show: false },
      fontFamily: 'Inter, sans-serif',
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: '55%',
      }
    },
    dataLabels: { enabled: false },
    colors: ['#0A84FF'],
    xaxis: {
      categories: Object.keys(ageGroups),
      labels: { rotate: 0 }
    },
    theme: {
      mode: document.body.classList.contains('dark-theme') ? 'dark' : 'light'
    }
  };
  
  ageChart = new ApexCharts(document.getElementById('age-chart'), options);
  ageChart.render();
}

// Render region distribution chart
function renderRegionDistributionChart() {
  // Count users by region
  const regions = {};
  userData.forEach(user => {
    const region = user.region || 'Unknown';
    regions[region] = (regions[region] || 0) + 1;
  });
  
  // Sort by count and take top 5
  const sortedRegions = Object.entries(regions)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  // Prepare data for chart
  const series = sortedRegions.map(entry => entry[1]);
  const labels = sortedRegions.map(entry => entry[0]);
  
  const options = {
    chart: {
      type: 'donut',
      height: 200,
      fontFamily: 'Inter, sans-serif',
    },
    labels,
    series,
    colors: ['#0A84FF', '#34C759', '#FF9500', '#FF3B30', '#5856D6'],
    legend: { position: 'bottom', fontSize: '12px' },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { height: 200 },
        legend: { position: 'bottom' }
      }
    }],
    theme: {
      mode: document.body.classList.contains('dark-theme') ? 'dark' : 'light'
    }
  };
  
  regionChart = new ApexCharts(document.getElementById('region-chart'), options);
  regionChart.render();
}

// Render screen size chart
function renderScreenSizeChart() {
  // Categorize screen sizes
  const screenSizes = {
    'Small (< 800px)': 0,
    'Medium (800-1000px)': 0,
    'Large (> 1000px)': 0
  };
  
  userData.forEach(user => {
    if (!user.screen) return;
    
    // Extract width from "width x height" format
    const widthMatch = user.screen.match(/^(\d+)/);
    if (widthMatch) {
      const width = parseInt(widthMatch[1]);
      
      if (width < 800) {
        screenSizes['Small (< 800px)']++;
      } else if (width >= 800 && width <= 1000) {
        screenSizes['Medium (800-1000px)']++;
      } else {
        screenSizes['Large (> 1000px)']++;
      }
    }
  });
  
  // Prepare data for chart
  const series = Object.values(screenSizes);
  const labels = Object.keys(screenSizes);
  
  const options = {
    chart: {
      type: 'pie',
      height: 200,
      fontFamily: 'Inter, sans-serif',
    },
    labels,
    series,
    colors: ['#FF9500', '#34C759', '#0A84FF'],
    legend: { position: 'bottom', fontSize: '12px' },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: { height: 200 },
        legend: { position: 'bottom' }
      }
    }],
    theme: {
      mode: document.body.classList.contains('dark-theme') ? 'dark' : 'light'
    }
  };
  
  screenChart = new ApexCharts(document.getElementById('screen-chart'), options);
  screenChart.render();
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);