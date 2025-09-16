// Application State Management
class SafeTravelApp {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.currentScreen = 'login-screen';
        this.theme = localStorage.getItem('theme') || 'light';
        this.locationWatcher = null;
        this.sosCountdownTimer = null;
        this.map = null;
        this.mockData = this.initializeMockData();
        
        this.init();
    }

    init() {
        this.applyTheme();
        this.setupEventListeners();
        this.initializeMap();
        this.startLocationTracking();
        this.simulateRealTimeUpdates();
    }

    initializeMockData() {
        return {
            tourists: [
                { id: 'TID-001234', name: 'John Doe', location: [19.0760, 72.8777], status: 'safe', lastSeen: new Date() },
                { id: 'TID-001122', name: 'Sarah Johnson', location: [18.9220, 72.8347], status: 'sos', lastSeen: new Date() },
                { id: 'TID-001089', name: 'Mark Wilson', location: [18.9067, 72.8147], status: 'safe', lastSeen: new Date() }
            ],
            incidents: [
                {
                    id: 'INC-001',
                    type: 'sos',
                    tourist: { id: 'TID-001122', name: 'Sarah Johnson' },
                    location: [18.9220, 72.8347],
                    time: new Date(Date.now() - 120000),
                    status: 'active',
                    description: 'Emergency SOS triggered'
                },
                {
                    id: 'INC-002',
                    type: 'efir',
                    tourist: { id: 'TID-001089', name: 'Mark Wilson' },
                    location: [18.9067, 72.8147],
                    time: new Date(Date.now() - 900000),
                    status: 'pending',
                    description: 'Theft reported - wallet stolen'
                },
                {
                    id: 'INC-003',
                    type: 'geofence',
                    tourist: { id: 'TID-001201', name: 'Lisa Chen' },
                    location: [19.0367, 72.8536],
                    time: new Date(Date.now() - 3600000),
                    status: 'warning',
                    description: 'Entered restricted area'
                }
            ],
            policeStations: [
                { name: 'Colaba Police Station', location: [18.9220, 72.8347] },
                { name: 'Marine Drive Police Station', location: [18.9441, 72.8236] },
                { name: 'Bandra Police Station', location: [19.0596, 72.8295] }
            ]
        };
    }

    setupEventListeners() {
        // Global event listeners
        document.addEventListener('click', (e) => {
            if (e.target.matches('.modal') && !e.target.matches('.modal-content, .modal-content *')) {
                this.closeAllModals();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // Service Worker Registration for PWA capabilities
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(console.error);
        }
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeButtons = document.querySelectorAll('.theme-toggle');
        themeButtons.forEach(btn => {
            btn.textContent = this.theme === 'light' ? '🌙' : '☀️';
        });
    }

    switchScreen(screenId) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenId;
        }
    }

    showToast(message, type = 'info', title = '') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <div class="toast-content">
                ${title ? `<div class="toast-title">${title}</div>` : ''}
                <div class="toast-message">${message}</div>
            </div>
        `;

        container.appendChild(toast);

        // Auto remove after 5 seconds
        setTimeout(() => {
            toast.style.animation = 'toastSlideIn 0.3s ease-out reverse';
            setTimeout(() => container.removeChild(toast), 300);
        }, 5000);
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    initializeMap() {
        // Initialize map when police dashboard is active
        setTimeout(() => {
            if (document.getElementById('incident-map') && !this.map) {
                this.map = L.map('incident-map').setView([19.0760, 72.8777], 11);
                
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© OpenStreetMap contributors'
                }).addTo(this.map);

                this.updateMapIncidents();
            }
        }, 100);
    }

    updateMapIncidents() {
        if (!this.map) return;

        // Add incidents to map
        this.mockData.incidents.forEach(incident => {
            const icon = this.getIncidentIcon(incident.type, incident.status);
            const marker = L.marker(incident.location, { icon }).addTo(this.map);
            
            marker.bindPopup(`
                <div class="map-popup">
                    <h4>${incident.type.toUpperCase()}</h4>
                    <p><strong>Tourist:</strong> ${incident.tourist.name}</p>
                    <p><strong>Time:</strong> ${this.formatTime(incident.time)}</p>
                    <p><strong>Status:</strong> ${incident.status}</p>
                    <button onclick="app.handleIncidentResponse('${incident.id}')" class="popup-btn">Respond</button>
                </div>
            `);
        });

        // Add police stations
        this.mockData.policeStations.forEach(station => {
            const policeIcon = L.icon({
                iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#2563eb">
                        <circle cx="12" cy="12" r="10"/>
                        <text x="12" y="16" text-anchor="middle" fill="white" font-size="12">👮</text>
                    </svg>
                `),
                iconSize: [30, 30],
                iconAnchor: [15, 15]
            });

            L.marker(station.location, { icon: policeIcon })
                .addTo(this.map)
                .bindPopup(`<div class="map-popup"><h4>${station.name}</h4></div>`);
        });
    }

    getIncidentIcon(type, status) {
        const colors = {
            sos: '#ef4444',
            efir: '#f59e0b',
            geofence: '#8b5cf6'
        };

        const icons = {
            sos: '🚨',
            efir: '📋',
            geofence: '⚠️'
        };

        return L.icon({
            iconUrl: 'data:image/svg+xml;base64,' + btoa(`
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${colors[type]}">
                    <circle cx="12" cy="12" r="10"/>
                    <text x="12" y="16" text-anchor="middle" fill="white" font-size="10">${icons[type]}</text>
                </svg>
            `),
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });
    }

    startLocationTracking() {
        if (navigator.geolocation) {
            this.locationWatcher = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    this.updateUserLocation(latitude, longitude);
                },
                (error) => {
                    console.warn('Location tracking error:', error);
                    this.showToast('Location access denied. Some features may be limited.', 'warning');
                },
                { enableHighAccuracy: true, maximumAge: 30000, timeout: 27000 }
            );
        }
    }

    updateUserLocation(lat, lng) {
        if (this.currentUser) {
            this.currentUser.location = [lat, lng];
            // Check for geofence violations
            this.checkGeofencing(lat, lng);
        }
    }

    checkGeofencing(lat, lng) {
        // Define restricted areas (example: Dharavi area)
        const restrictedAreas = [
            { center: [19.0368, 72.8536], radius: 2000, name: 'Dharavi - High Risk Area' }
        ];

        restrictedAreas.forEach(area => {
            const distance = this.calculateDistance(lat, lng, area.center[0], area.center[1]);
            if (distance < area.radius) {
                this.triggerGeofenceAlert(area.name);
            }
        });
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371e3; // Earth's radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lng2-lng1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    }

    triggerGeofenceAlert(areaName) {
        this.showToast(`Warning: You've entered ${areaName}. Please exercise extra caution.`, 'warning', 'Geofence Alert');
        
        // Add to incident log
        const incident = {
            id: `GF-${Date.now()}`,
            type: 'geofence',
            tourist: this.currentUser,
            location: this.currentUser.location,
            time: new Date(),
            status: 'warning',
            description: `Entered restricted area: ${areaName}`
        };
        
        this.mockData.incidents.unshift(incident);
    }

    simulateRealTimeUpdates() {
        // Simulate real-time updates for demo
        setInterval(() => {
            if (this.userRole === 'police') {
                this.updatePoliceStats();
            }
        }, 30000); // Update every 30 seconds
    }

    updatePoliceStats() {
        // Simulate random changes in statistics
        const statCards = document.querySelectorAll('.stat-value');
        statCards.forEach((card, index) => {
            if (Math.random() > 0.7) { // 30% chance to update
                const currentValue = parseInt(card.textContent);
                const change = Math.random() > 0.5 ? 1 : -1;
                const newValue = Math.max(0, currentValue + change);
                card.textContent = newValue;
                
                // Animate the change
                card.style.transform = 'scale(1.2)';
                card.style.color = change > 0 ? '#ef4444' : '#10b981';
                setTimeout(() => {
                    card.style.transform = 'scale(1)';
                    card.style.color = 'var(--text-primary)';
                }, 500);
            }
        });
    }

    formatTime(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
        if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        if (minutes > 0) return `${minutes} min ago`;
        return 'Just now';
    }

    handleIncidentResponse(incidentId) {
        const incident = this.mockData.incidents.find(i => i.id === incidentId);
        if (incident) {
            incident.status = 'responding';
            this.showToast(`Response unit dispatched to incident ${incidentId}`, 'success', 'Unit Dispatched');
            this.closeAllModals();
        }
    }

    generateBlockchainId() {
        // Simulate blockchain ID generation
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `BLK-2024-${random}`;
    }

    processAIQuery(query) {
        // Simulate AI responses
        const responses = {
            emergency: "In case of emergency:\n1. Press the SOS button immediately\n2. Stay calm and try to reach a safe location\n3. Contact local emergency services: 112\n4. Your location will be shared with nearby police",
            safety: "Tourist Safety Tips:\n• Always carry a copy of your passport\n• Share your itinerary with family\n• Use registered taxis and guides\n• Avoid isolated areas at night\n• Keep emergency contacts handy",
            translate: "I can help with basic translations. What would you like to translate?",
            location: "Your current location is being monitored for safety. If you need help finding nearby safe spots or police stations, I can assist.",
            default: "I'm here to help with safety information, emergency procedures, and general tourist assistance. You can ask me about:\n• Emergency procedures\n• Safety tips\n• Local information\n• Language help"
        };

        const lowercaseQuery = query.toLowerCase();
        if (lowercaseQuery.includes('emergency') || lowercaseQuery.includes('help')) {
            return responses.emergency;
        } else if (lowercaseQuery.includes('safety') || lowercaseQuery.includes('safe')) {
            return responses.safety;
        } else if (lowercaseQuery.includes('translate')) {
            return responses.translate;
        } else if (lowercaseQuery.includes('location') || lowercaseQuery.includes('where')) {
            return responses.location;
        } else {
            return responses.default;
        }
    }
}

// Global App Instance
const app = new SafeTravelApp();

// Authentication Functions
function switchTab(role) {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

function showLogin() {
    app.switchScreen('login-screen');
}

function showRegister() {
    app.switchScreen('register-screen');
}

function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const activeTab = document.querySelector('.tab-btn.active').textContent.toLowerCase();

    if (!email || !password) {
        app.showToast('Please fill in all fields', 'error');
        return;
    }

    const loginBtn = document.querySelector('.login-btn');
    loginBtn.classList.add('loading');

    setTimeout(() => {
        // Simulate successful login
        app.currentUser = {
            id: app.generateBlockchainId(),
            email: email,
            name: 'John Doe', // Mock name
            role: activeTab,
            location: [19.0760, 72.8777] // Mumbai coordinates
        };
        app.userRole = activeTab;

        if (activeTab === 'tourist') {
            app.switchScreen('tourist-dashboard');
        } else {
            app.switchScreen('police-dashboard');
            app.initializeMap();
        }

        app.showToast(`Welcome, ${app.currentUser.name}!`, 'success');
        loginBtn.classList.remove('loading');
    }, 2000);
}

function registerTourist() {
    const form = document.querySelector('.register-form');
    const formData = new FormData(form);
    
    const registerBtn = document.querySelector('.register-submit-btn');
    registerBtn.classList.add('loading');

    setTimeout(() => {
        // Generate blockchain ID
        const blockchainId = app.generateBlockchainId();
        
        app.currentUser = {
            id: blockchainId,
            name: 'John Doe', // Would get from form
            email: 'john@example.com', // Would get from form
            role: 'tourist',
            location: [19.0760, 72.8777]
        };
        app.userRole = 'tourist';

        app.switchScreen('tourist-dashboard');
        app.showToast('Registration successful! Your blockchain ID has been generated.', 'success', 'Welcome!');
        registerBtn.classList.remove('loading');
    }, 2500);
}

function logout() {
    app.currentUser = null;
    app.userRole = null;
    if (app.locationWatcher) {
        navigator.geolocation.clearWatch(app.locationWatcher);
    }
    app.switchScreen('login-screen');
    app.showToast('You have been logged out', 'info');
}

// Tourist Dashboard Functions
function triggerSOS() {
    document.getElementById('sos-modal').classList.add('active');
    startSOSCountdown();
}

function startSOSCountdown() {
    let countdown = 5;
    const countdownEl = document.getElementById('sos-countdown');
    const timerTextEl = document.getElementById('timer-text');
    
    app.sosCountdownTimer = setInterval(() => {
        countdown--;
        countdownEl.textContent = countdown;
        timerTextEl.textContent = countdown;
        
        if (countdown <= 0) {
            confirmSOS();
        }
    }, 1000);
}

function cancelSOS() {
    clearInterval(app.sosCountdownTimer);
    app.closeAllModals();
    app.showToast('SOS cancelled', 'info');
}

function confirmSOS() {
    clearInterval(app.sosCountdownTimer);
    app.closeAllModals();
    
    // Create SOS incident
    const incident = {
        id: `SOS-${Date.now()}`,
        type: 'sos',
        tourist: app.currentUser,
        location: app.currentUser.location || [19.0760, 72.8777],
        time: new Date(),
        status: 'active',
        description: 'Emergency SOS triggered by tourist'
    };
    
    app.mockData.incidents.unshift(incident);
    
    app.showToast('SOS Alert sent! Emergency services have been notified.', 'success', 'Emergency Alert Sent');
    
    // Simulate emergency response
    setTimeout(() => {
        app.showToast('Police unit dispatched to your location. ETA: 8-12 minutes.', 'info', 'Response Unit Dispatched');
    }, 3000);
}

function showEFIR() {
    document.getElementById('efir-modal').classList.add('active');
}

function selectCategory(category) {
    app.closeAllModals();
    
    // Simulate E-FIR filing
    const categoryNames = {
        missing: 'Missing Person',
        theft: 'Theft/Robbery',
        harassment: 'Harassment',
        fraud: 'Fraud/Scam',
        medical: 'Medical Emergency',
        accident: 'Accident'
    };

    const incident = {
        id: `FIR-${Date.now()}`,
        type: 'efir',
        category: category,
        tourist: app.currentUser,
        location: app.currentUser.location || [19.0760, 72.8777],
        time: new Date(),
        status: 'pending',
        description: `E-FIR filed for ${categoryNames[category]}`
    };
    
    app.mockData.incidents.unshift(incident);
    
    app.showToast(`E-FIR filed successfully for ${categoryNames[category]}. Reference ID: ${incident.id}`, 'success', 'E-FIR Submitted');
}

function shareLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((position) => {
            const { latitude, longitude } = position.coords;
            const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
            
            if (navigator.share) {
                navigator.share({
                    title: 'My Current Location - SafeTravel',
                    text: 'Here is my current location for safety tracking.',
                    url: locationUrl
                });
            } else {
                // Fallback - copy to clipboard
                navigator.clipboard.writeText(locationUrl).then(() => {
                    app.showToast('Location link copied to clipboard!', 'success');
                });
            }
        });
    }
}

function showContacts() {
    const contacts = `
        Emergency Contacts:
        🚨 Emergency Services: 112
        👮 Tourist Helpline: 1363
        🏥 Medical Emergency: 108
        🚓 Police: 100
        🔥 Fire Services: 101
        
        Your Emergency Contact:
        📞 +91-9876543210
    `;
    
    alert(contacts); // In real app, this would be a proper modal
}

function showSafetyTips() {
    const tips = `
        Tourist Safety Tips:
        
        ✅ Keep copies of important documents
        ✅ Share your itinerary with family
        ✅ Use registered taxis and guides
        ✅ Avoid isolated areas after dark
        ✅ Keep emergency contacts handy
        ✅ Stay in well-lit, populated areas
        ✅ Don't display expensive items
        ✅ Trust your instincts
        ✅ Keep the SafeTravel app active
        ✅ Regular check-ins with family
    `;
    
    alert(tips); // In real app, this would be a proper modal
}

function showProfile() {
    const profile = `
        Tourist Profile:
        
        Name: ${app.currentUser?.name || 'John Doe'}
        ID: ${app.currentUser?.id || 'BLK-2024-001234'}
        Status: Safe ✅
        Location: Mumbai, Maharashtra
        
        Trip Duration: Dec 1-15, 2024
        Emergency Contact: +91-9876543210
    `;
    
    alert(profile); // In real app, this would be a proper modal
}

// Chatbot Functions
function showChatbot() {
    document.getElementById('chatbot-modal').classList.add('active');
}

function handleChatEnter(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Add user message to chat
    addChatMessage(message, 'user');
    input.value = '';
    
    // Simulate AI response
    setTimeout(() => {
        const response = app.processAIQuery(message);
        addChatMessage(response, 'bot');
    }, 1000);
}

function addChatMessage(message, sender) {
    const chatMessages = document.getElementById('chat-messages');
    const messageEl = document.createElement('div');
    messageEl.className = `chat-message ${sender}`;
    
    const avatar = sender === 'bot' ? '🤖' : '👤';
    messageEl.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
            <p>${message.replace(/\n/g, '<br>')}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function startVoiceInput() {
    if ('speechRecognition' in window || 'webkitSpeechRecognition' in window) {
        const recognition = new (window.speechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => {
            app.showToast('Listening... Speak now', 'info');
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            document.getElementById('chat-input').value = transcript;
            sendChatMessage();
        };

        recognition.onerror = () => {
            app.showToast('Voice recognition failed. Please try again.', 'error');
        };

        recognition.start();
    } else {
        app.showToast('Voice recognition not supported in this browser', 'error');
    }
}

// Police Dashboard Functions
function filterIncidents(type) {
    const buttons = document.querySelectorAll('.map-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filter logic would go here for real implementation
    app.showToast(`Filtering incidents by: ${type}`, 'info');
}

// Theme Functions
function toggleTheme() {
    app.theme = app.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', app.theme);
    app.applyTheme();
}

// Modal Functions
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('SafeTravel India - Smart Tourist Safety System Initialized');
});

// Export for global access
window.app = app;