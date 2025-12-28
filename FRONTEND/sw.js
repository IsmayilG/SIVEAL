const CACHE_NAME = 'siveal-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/article.html',
    '/admin.html',
    '/login.html',
    '/profile.html',
    '/style.css',
    '/script.js',
    '/article.js',
    '/admin.js',
    '/profile.js',
    '/about.html',
    '/advertise.html',
    '/privacy.html',
    '/terms.html',
    '/contact.html',
    // Images (critical ones)
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=800',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800',
    'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800',
    // External resources
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css'
];

// Install event - cache resources
self.addEventListener('install', event => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching app shell');
                return cache.addAll(urlsToCache.map(url => {
                    // Handle both absolute and relative URLs
                    const urlObj = new URL(url, self.location);
                    return new Request(urlObj.href, { mode: 'no-cors' });
                })).catch(err => {
                    console.log('[SW] Cache addAll failed:', err);
                    // Don't fail the entire install if some URLs fail
                    return Promise.resolve();
                });
            })
    );
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Ensure the new service worker takes control immediately
    self.clients.claim();
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
    // Skip cross-origin requests and non-GET requests
    if (!event.request.url.startsWith(self.location.origin) || event.request.method !== 'GET') {
        return;
    }

    // Skip API requests for real-time data
    if (event.request.url.includes('/api/news') || 
        event.request.url.includes('/api/newsletter') ||
        event.request.url.includes('/api/auth') ||
        event.request.url.includes('/api/comments')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version or fetch from network
                if (response) {
                    console.log('[SW] Serving from cache:', event.request.url);
                    return response;
                }

                return fetch(event.request)
                    .then(response => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response for caching
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    })
                    .catch(() => {
                        // Return offline page for navigation requests
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }
                        
                        // Return offline fallback for other requests
                        return new Response(
                            '<div style="padding: 20px; text-align: center; font-family: Inter, sans-serif;"><h2>Offline</h2><p>You are currently offline. Please check your internet connection.</p></div>',
                            { 
                                status: 503,
                                statusText: 'Service Unavailable',
                                headers: { 'Content-Type': 'text/html' }
                            }
                        );
                    });
            })
    );
});

// Handle background sync for offline actions
self.addEventListener('sync', event => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'newsletter-subscribe') {
        event.waitUntil(handleNewsletterSync());
    }
});

// Handle newsletter subscription when back online
async function handleNewsletterSync() {
    try {
        const pendingSubscriptions = await getStoredSubscriptions();
        
        for (const subscription of pendingSubscriptions) {
            try {
                const response = await fetch('/api/newsletter/subscribe', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(subscription)
                });

                if (response.ok) {
                    await removeStoredSubscription(subscription.id);
                    console.log('[SW] Synced newsletter subscription');
                }
            } catch (error) {
                console.log('[SW] Failed to sync subscription:', error);
            }
        }
    } catch (error) {
        console.log('[SW] Error in newsletter sync:', error);
    }
}

// Store subscription for later sync
async function storeSubscription(subscription) {
    const subscriptions = await getStoredSubscriptions();
    subscriptions.push({
        id: Date.now(),
        ...subscription,
        timestamp: new Date().toISOString()
    });
    
    // Store in IndexedDB or localStorage fallback
    if ('indexedDB' in self) {
        // Use IndexedDB for better storage
        console.log('[SW] Using IndexedDB for subscription storage');
    } else {
        // Fallback to localStorage
        localStorage.setItem('pendingSubscriptions', JSON.stringify(subscriptions));
    }
}

// Get stored subscriptions
async function getStoredSubscriptions() {
    if ('indexedDB' in self) {
        // Use IndexedDB
        console.log('[SW] Reading from IndexedDB');
        return [];
    } else {
        // Fallback to localStorage
        try {
            const stored = localStorage.getItem('pendingSubscriptions');
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.log('[SW] Error reading stored subscriptions:', error);
            return [];
        }
    }
}

// Remove stored subscription
async function removeStoredSubscription(id) {
    const subscriptions = await getStoredSubscriptions();
    const filtered = subscriptions.filter(sub => sub.id !== id);
    
    if ('indexedDB' in self) {
        // Use IndexedDB
        console.log('[SW] Removing from IndexedDB');
    } else {
        // Fallback to localStorage
        localStorage.setItem('pendingSubscriptions', JSON.stringify(filtered));
    }
}

// Handle push notifications
self.addEventListener('push', event => {
    console.log('[SW] Push received:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'New content available on SIVEAL!',
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Read Now',
                icon: '/icon-explore.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icon-close.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('SIVEAL', options)
    );
});

// Handle notification click
self.addEventListener('notificationclick', event => {
    console.log('[SW] Notification click received:', event);
    
    event.notification.close();

    if (event.action === 'explore') {
        // Open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    } else if (event.action === 'close') {
        // Just close the notification
        return;
    } else {
        // Default action - open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle message from main thread
self.addEventListener('message', event => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
    
    if (event.data && event.data.type === 'STORE_OFFLINE_ACTION') {
        // Store action for later sync
        storeSubscription(event.data.payload);
    }
});

// Periodic background sync (experimental feature)
self.addEventListener('periodicsync', event => {
    console.log('[SW] Periodic sync:', event.tag);
    
    if (event.tag === 'content-sync') {
        event.waitUntil(syncContent());
    }
});

// Sync content in the background
async function syncContent() {
    try {
        // Check for new articles
        const response = await fetch('/api/news');
        if (response.ok) {
            const articles = await response.json();
            
            // Cache the latest articles
            const cache = await caches.open(CACHE_NAME);
            await cache.put('/api/news', new Response(JSON.stringify(articles), {
                headers: { 'Content-Type': 'application/json' }
            }));
            
            console.log('[SW] Synced content successfully');
        }
    } catch (error) {
        console.log('[SW] Content sync failed:', error);
    }
}

console.log('[SW] Service Worker loaded');
