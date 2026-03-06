# Virtual Try-On Feature Guide

## Overview

The virtual try-on feature uses Google Gemini AI to analyze products and user photos, providing:
1. **AI Analysis**: Detailed recommendations on how products would look on users
2. **Visual Overlay**: Overlay product images on user photos
3. **Style Recommendations**: Personalized style suggestions based on user photos
4. **Context Analysis**: How products look in different real-world settings

## Setup

### 1. Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your `.env.local`:

```bash
GEMINI_API_KEY=your-api-key-here
```

### 2. Install Dependencies

```bash
npm install
```

Dependencies added:
- `@google/generative-ai` - Google Gemini SDK
- `sharp` - Image processing

## API Endpoints

### 1. Virtual Try-On Analysis

**POST** `/api/ai/virtual-tryon`

Analyze how a product would look on a user.

**Request:**
- `productId` (string, required) - Product ID
- `userPhoto` (File, required) - User's photo
- `mode` (string, optional) - `'analysis'` or `'overlay'` (default: `'analysis'`)
- `context` (string, optional) - `'home'`, `'outdoor'`, `'office'`, `'casual'`, `'formal'` (default: `'casual'`)

**Response:**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "recommendation": "Detailed recommendation...",
      "fitAnalysis": "Fit analysis...",
      "styleMatch": 85,
      "suggestions": ["suggestion1", "suggestion2"],
      "confidence": 90
    },
    "contextAnalysis": {
      "description": "...",
      "suitability": "...",
      "stylingTips": ["tip1", "tip2"],
      "colorAnalysis": "..."
    },
    "overlayImage": "https://...", // Only if mode='overlay'
    "product": {
      "_id": "...",
      "title": "...",
      "price": 1000
    }
  }
}
```

**Example Usage:**
```typescript
const formData = new FormData();
formData.append('productId', 'product-id-here');
formData.append('userPhoto', photoFile);
formData.append('mode', 'overlay'); // or 'analysis'
formData.append('context', 'casual');

const response = await fetch('/api/ai/virtual-tryon', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});
```

### 2. Style Recommendations

**POST** `/api/ai/style-recommendations`

Get personalized style recommendations based on user photo.

**Request:**
- `userPhoto` (File, required) - User's photo
- `style` (string, optional) - Preferred style
- `occasion` (string, optional) - Occasion (e.g., 'casual', 'formal')
- `budget` (string, optional) - Budget range
- `colors` (string, optional) - Comma-separated preferred colors

**Response:**
```json
{
  "success": true,
  "data": {
    "styleProfile": "Your style profile description...",
    "recommendations": [
      {
        "category": "tops",
        "description": "...",
        "reasoning": "..."
      }
    ],
    "matchingProducts": [...]
  }
}
```

## Frontend Integration

### Example React Component

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export function VirtualTryOn({ productId }: { productId: string }) {
  const [userPhoto, setUserPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { token } = useAuth();

  const handleTryOn = async () => {
    if (!userPhoto) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('productId', productId);
    formData.append('userPhoto', userPhoto);
    formData.append('mode', 'overlay');
    formData.append('context', 'casual');

    try {
      const response = await fetch('/api/ai/virtual-tryon', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        setResult(data.data);
      }
    } catch (error) {
      console.error('Try-on error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setUserPhoto(e.target.files?.[0] || null)}
      />
      <button onClick={handleTryOn} disabled={loading || !userPhoto}>
        {loading ? 'Processing...' : 'Try On'}
      </button>
      
      {result && (
        <div>
          {result.overlayImage && (
            <img src={result.overlayImage} alt="Virtual try-on" />
          )}
          <div>
            <h3>AI Analysis</h3>
            <p>{result.analysis.recommendation}</p>
            <p>Style Match: {result.analysis.styleMatch}%</p>
            <p>Confidence: {result.analysis.confidence}%</p>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Features

### 1. AI Analysis Mode
- Analyzes product and user photo
- Provides fit analysis
- Style compatibility score
- Personalized recommendations
- Context-based analysis

### 2. Overlay Mode
- Generates visual overlay of product on user
- Uses body landmark detection (simplified)
- Uploads result to R2 storage
- Returns overlay image URL

### 3. Style Recommendations
- Analyzes user's style profile
- Provides category recommendations
- Suggests matching products from database
- Considers preferences (style, occasion, budget, colors)

## Limitations & Future Improvements

### Current Limitations:
1. **Body Landmark Detection**: Uses simplified positioning. For production, integrate:
   - MediaPipe Pose Detection
   - TensorFlow.js PoseNet
   - Google Cloud Vision API

2. **Background Removal**: Placeholder implementation. Consider:
   - Remove.bg API
   - Cloudinary AI background removal
   - TensorFlow.js body segmentation

3. **Overlay Quality**: Basic image compositing. For better results:
   - Use AR libraries (Three.js, A-Frame)
   - Integrate specialized try-on services
   - Use ML models for realistic overlays

### Future Enhancements:
- Real-time video try-on
- 3D product models
- Multiple product combinations
- Size recommendations based on measurements
- AR integration for mobile apps

## Error Handling

The API returns specific error codes:
- `MISSING_API_KEY`: Gemini API key not configured
- `400`: Invalid input (missing files, wrong format)
- `404`: Product not found
- `500`: Processing error

Always check `success` field in response and handle errors gracefully.

## Cost Considerations

Google Gemini API pricing:
- Free tier: Limited requests
- Paid: Pay per request
- Image processing: Additional costs for large images

Optimize by:
- Resizing images before sending
- Caching results
- Using analysis mode instead of overlay when possible

## Security

- All endpoints require authentication
- User photos are processed and not stored permanently (unless overlay is generated)
- Overlay images stored in R2 with unique keys
- No user photos stored in database








