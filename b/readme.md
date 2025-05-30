# Modern Blog with Storage Buckets

A modern website built with Alpine.js and Tailwind CSS that leverages browser Storage Buckets API for client-side caching and seamless offline experience. The site synchronizes with jsonbin.io for permanent data storage.

## Features

- **Client-side caching** with browser Storage Buckets API
- **Automatic content synchronization** with version hashing
- **Blog functionality** with posts stored in jsonbin.io
- **Responsive design** that works across all devices
- **Offline capability** for previously loaded content

## Getting Started

1. Clone this repository
2. Open index.html in a modern browser that supports Storage Buckets API
3. The site will automatically cache resources and load content

## Configuration

The site uses the following jsonbin.io configuration:

```
X-Master-Key: $2a$10$kxZTFqM7lWIWuqby/NOPo.3AWCvRp94VtcrCkVanjlQkN3vcS0L2S
Bin ID: 683922298561e97a501d56f6
Collection: 68369f6b8561e97a501c6f9d
```

## Development

To add more blog posts, update the content in jsonbin.io. The site will automatically detect changes and update the content when users visit.

## Sample Data

A sample-data.json file is included for reference on how to structure your data in jsonbin.io.