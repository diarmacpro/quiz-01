// Storage Buckets and Cache Management
async function initStorageBucket() {
  if (!('storageBuckets' in navigator)) {
    console.error('Storage Buckets API not supported');
    return null;
  }

  try {
    const bucketName = 'modern-blog-data';
    return await navigator.storageBuckets.open(bucketName);
  } catch (error) {
    console.error('Error opening storage bucket:', error);
    return null;
  }
}

async function cacheCDNResources(bucket, cacheName, resources) {
  if (!bucket) return;
  
  const cache = await bucket.caches.open(cacheName);
  
  for (const resource of resources) {
    // Check if already cached
    const cachedResponse = await cache.match(resource.url);
    
    if (!cachedResponse) {
      try {
        const response = await fetch(resource.url);
        if (response.ok) {
          await cache.put(resource.url, response.clone());
          console.log(`Cached: ${resource.url}`);
          
          // If it's CSS or JS, load it into the page
          if (resource.type === 'css') {
            const link = document.createElement('link');
            link.href = resource.url;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
          } else if (resource.type === 'js') {
            const script = document.createElement('script');
            script.src = resource.url;
            document.body.appendChild(script);
          }
        } else {
          console.error(`Failed to fetch: ${resource.url} - status ${response.status}`);
        }
      } catch (err) {
        console.error(`Fetch error for ${resource.url}:`, err);
      }
    } else {
      console.log(`Already cached: ${resource.url}`);
      
      // Load from cache if it's CSS or JS
      if (resource.type === 'css' || resource.type === 'js') {
        await loadResourceFromCache(bucket, cacheName, resource.url, resource.type);
      }
    }
  }
}

async function loadResourceFromCache(bucket, cacheName, url, type) {
  if (!bucket) return;
  
  const cache = await bucket.caches.open(cacheName);
  const response = await cache.match(url);
  
  if (!response) {
    console.error(`Resource not found in cache: ${url}`);
    return;
  }
  
  try {
    if (type === 'css') {
      const cssText = await response.text();
      const style = document.createElement('style');
      style.textContent = cssText;
      document.head.appendChild(style);
      console.log(`Loaded CSS from cache: ${url}`);
    } else if (type === 'js') {
      const jsText = await response.text();
      const script = document.createElement('script');
      script.textContent = jsText;
      script.async = true;
      document.body.appendChild(script);
      console.log(`Loaded JS from cache: ${url}`);
    }
  } catch (error) {
    console.error(`Error loading resource from cache: ${url}`, error);
  }
}

// Version checking and content management
async function storeVersion(bucket, version) {
  if (!bucket) return;
  
  try {
    const versionStore = await bucket.indexedDB.open('version-store');
    const tx = versionStore.transaction('version', 'readwrite');
    const store = tx.objectStore('version');
    await store.put(version, window.VERSION_KEY);
    console.log(`Stored version: ${version}`);
  } catch (error) {
    console.error('Error storing version:', error);
    
    // Try to initialize the store if it doesn't exist
    try {
      const versionStore = await bucket.indexedDB.open('version-store', 1, (db, oldVersion, newVersion) => {
        if (!db.objectStoreNames.contains('version')) {
          db.createObjectStore('version');
        }
      });
      const tx = versionStore.transaction('version', 'readwrite');
      const store = tx.objectStore('version');
      await store.put(version, window.VERSION_KEY);
    } catch (retryError) {
      console.error('Failed to initialize version store:', retryError);
    }
  }
}

async function getStoredVersion(bucket) {
  if (!bucket) return null;
  
  try {
    const versionStore = await bucket.indexedDB.open('version-store');
    const tx = versionStore.transaction('version', 'readonly');
    const store = tx.objectStore('version');
    return await store.get(window.VERSION_KEY);
  } catch (error) {
    console.error('Error getting version:', error);
    return null;
  }
}

async function fetchRemoteVersion() {
  try {
    const response = await fetch(`${window.JSONBIN_API_URL}/meta`, {
      headers: {
        'X-Master-Key': window.JSONBIN_MASTER_KEY
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    
    const data = await response.json();
    return data.metadata?.version || data.metadata?.hash || null;
  } catch (error) {
    console.error('Error fetching remote version:', error);
    return null;
  }
}

async function storeContentData(bucket, key, data) {
  if (!bucket) return;
  
  try {
    const contentStore = await bucket.indexedDB.open('content-store');
    const tx = contentStore.transaction('content', 'readwrite');
    const store = tx.objectStore('content');
    await store.put(data, key);
    console.log(`Stored content: ${key}`);
  } catch (error) {
    console.error(`Error storing content (${key}):`, error);
    
    // Try to initialize the store if it doesn't exist
    try {
      const contentStore = await bucket.indexedDB.open('content-store', 1, (db, oldVersion, newVersion) => {
        if (!db.objectStoreNames.contains('content')) {
          db.createObjectStore('content');
        }
      });
      const tx = contentStore.transaction('content', 'readwrite');
      const store = tx.objectStore('content');
      await store.put(data, key);
    } catch (retryError) {
      console.error(`Failed to initialize content store for ${key}:`, retryError);
    }
  }
}

async function getStoredContent(bucket, key) {
  if (!bucket) return null;
  
  try {
    const contentStore = await bucket.indexedDB.open('content-store');
    const tx = contentStore.transaction('content', 'readonly');
    const store = tx.objectStore('content');
    return await store.get(key);
  } catch (error) {
    console.error(`Error getting content (${key}):`, error);
    return null;
  }
}

async function fetchContentFromJsonBin() {
  try {
    const response = await fetch(window.JSONBIN_API_URL, {
      headers: {
        'X-Master-Key': window.JSONBIN_MASTER_KEY
      }
    });
    
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    
    const data = await response.json();
    return data.record || null;
  } catch (error) {
    console.error('Error fetching content from JSONBin:', error);
    return null;
  }
}

// Alpine.js App Definition
function app() {
  return {
    // State
    bucket: null,
    loading: true,
    loadingMessage: 'Initializing...',
    activeView: 'home',
    blogPosts: [],
    currentPostId: null,
    currentPost: null,
    
    // Lifecycle methods
    async initApp() {
      this.loadingMessage = 'Opening storage bucket...';
      this.bucket = await initStorageBucket();
      
      // Initialize content store
      if (this.bucket) {
        try {
          await this.bucket.indexedDB.open('content-store', 1, (db, oldVersion, newVersion) => {
            if (!db.objectStoreNames.contains('content')) {
              db.createObjectStore('content');
            }
          });
          
          await this.bucket.indexedDB.open('version-store', 1, (db, oldVersion, newVersion) => {
            if (!db.objectStoreNames.contains('version')) {
              db.createObjectStore('version');
            }
          });
        } catch (error) {
          console.error('Error initializing stores:', error);
        }
      }
      
      // Cache CDN resources
      this.loadingMessage = 'Caching CDN resources...';
      const cdnResources = [
        { url: 'https://cdn.jsdelivr.net/npm/alpinejs@3.13.0/dist/cdn.min.js', type: 'js' },
        { url: 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css', type: 'css' }
      ];
      
      await cacheCDNResources(this.bucket, 'cdn-cache', cdnResources);
      
      // Load content data
      this.loadingMessage = 'Loading content...';
      await this.checkForUpdates();
      
      this.loading = false;
    },
    
    // Actions
    async checkForUpdates(forceRefresh = false) {
      if (!this.bucket) return;
      
      const storedVersion = await getStoredVersion(this.bucket);
      const remoteVersion = await fetchRemoteVersion();
      
      console.log('Version check:', { stored: storedVersion, remote: remoteVersion });
      
      if (forceRefresh || !storedVersion || storedVersion !== remoteVersion) {
        console.log('New version detected, updating content...');
        this.loadingMessage = 'Updating content...';
        this.loading = true;
        
        // Fetch fresh content from JSONBin
        const content = await fetchContentFromJsonBin();
        
        if (content) {
          // Store the new content
          await storeContentData(this.bucket, 'blog-posts', content.posts || []);
          await storeContentData(this.bucket, 'site-info', content.siteInfo || {});
          
          // Update version
          if (remoteVersion) {
            await storeVersion(this.bucket, remoteVersion);
          }
          
          // Update local data
          this.blogPosts = content.posts || [];
        }
        
        this.loading = false;
        
        if (forceRefresh) {
          alert('Content has been updated to the latest version.');
        }
      } else {
        // Load from cache
        const cachedPosts = await getStoredContent(this.bucket, 'blog-posts');
        if (cachedPosts) {
          this.blogPosts = cachedPosts;
        } else {
          // If no cached posts, try to fetch fresh
          const content = await fetchContentFromJsonBin();
          if (content) {
            this.blogPosts = content.posts || [];
            await storeContentData(this.bucket, 'blog-posts', this.blogPosts);
          }
        }
      }
    },
    
    setActiveView(view) {
      this.activeView = view;
      if (view !== 'post') {
        this.currentPost = null;
        this.currentPostId = null;
      }
      // Scroll to top when changing views
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    async viewPost(postId) {
      this.currentPostId = postId;
      this.currentPost = this.blogPosts.find(post => post.id === postId);
      this.setActiveView('post');
    },
    
    // Utilities
    formatDate(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    },
    
    truncate(text, length) {
      if (!text) return '';
      return text.length > length ? text.substring(0, length) + '...' : text;
    }
  };
}