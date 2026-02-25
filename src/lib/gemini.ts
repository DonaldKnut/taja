import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || '';

if (!GEMINI_API_KEY) {
  console.warn('⚠️ GOOGLE_GEMINI_API_KEY not set. Virtual try-on features will be limited.');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Convert image file to base64 for Gemini API
 */
export function fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result as string;
      const base64 = base64Data.split(',')[1] || base64Data;
      resolve({
        inlineData: {
          data: base64,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert buffer to base64 for Gemini API
 */
export function bufferToGenerativePart(buffer: Buffer, mimeType: string): { inlineData: { data: string; mimeType: string } } {
  const base64 = buffer.toString('base64');
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

/**
 * Analyze product and user photo for virtual try-on recommendations
 */
export async function analyzeVirtualTryOn(
  productImage: Buffer | string,
  userPhoto: Buffer | string,
  productDetails: {
    title: string;
    category: string;
    color?: string;
    size?: string;
    type: 'clothing' | 'accessories' | 'shoes' | 'other';
  }
): Promise<{
  recommendation: string;
  fitAnalysis: string;
  styleMatch: number; // 0-100
  suggestions: string[];
  confidence: number; // 0-100
}> {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // Prepare images
  let productPart: any;
  let userPart: any;

  if (typeof productImage === 'string') {
    // URL - fetch and convert
    const response = await fetch(productImage);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    productPart = bufferToGenerativePart(buffer, response.headers.get('content-type') || 'image/jpeg');
  } else {
    productPart = bufferToGenerativePart(productImage, 'image/jpeg');
  }

  if (typeof userPhoto === 'string') {
    const response = await fetch(userPhoto);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    userPart = bufferToGenerativePart(buffer, response.headers.get('content-type') || 'image/jpeg');
  } else {
    userPart = bufferToGenerativePart(userPhoto, 'image/jpeg');
  }

  const prompt = `You are a fashion and styling expert. Analyze these two images:
1. A product image: ${productDetails.title} (${productDetails.category})
2. A user photo

Provide a detailed analysis in JSON format with the following structure:
{
  "recommendation": "A detailed recommendation about how this product would look on the user, including fit, style, and overall appearance",
  "fitAnalysis": "Analysis of how well this product would fit the user's body type, size, and proportions",
  "styleMatch": <number 0-100 representing how well the product matches the user's style>,
  "suggestions": ["suggestion1", "suggestion2", "suggestion3"] - styling tips or alternatives,
  "confidence": <number 0-100 representing confidence in the analysis>
}

Be specific, helpful, and honest. Consider:
- Body proportions and fit
- Color compatibility with skin tone
- Style compatibility
- Size recommendations
- Styling suggestions

Return ONLY valid JSON, no markdown formatting.`;

  try {
    const result = await model.generateContent([prompt, productPart, userPart]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON from response (might have markdown code blocks)
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const analysis = JSON.parse(jsonText);

    return {
      recommendation: analysis.recommendation || 'Unable to provide recommendation',
      fitAnalysis: analysis.fitAnalysis || 'Unable to analyze fit',
      styleMatch: analysis.styleMatch || 50,
      suggestions: analysis.suggestions || [],
      confidence: analysis.confidence || 50,
    };
  } catch (error: any) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to analyze virtual try-on: ${error.message}`);
  }
}

/**
 * Get product recommendations based on user photo and preferences
 */
export async function getStyleRecommendations(
  userPhoto: Buffer | string,
  preferences: {
    style?: string;
    occasion?: string;
    budget?: string;
    colors?: string[];
  }
): Promise<{
  recommendations: Array<{
    category: string;
    description: string;
    reasoning: string;
  }>;
  styleProfile: string;
}> {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  let userPart: any;
  if (typeof userPhoto === 'string') {
    const response = await fetch(userPhoto);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    userPart = bufferToGenerativePart(buffer, response.headers.get('content-type') || 'image/jpeg');
  } else {
    userPart = bufferToGenerativePart(userPhoto, 'image/jpeg');
  }

  const prompt = `Analyze this user photo and provide style recommendations based on:
- User's body type and proportions
- Skin tone
- Current style
- Preferences: ${JSON.stringify(preferences)}

Return JSON in this format:
{
  "styleProfile": "Description of the user's style profile",
  "recommendations": [
    {
      "category": "clothing category",
      "description": "What would work well",
      "reasoning": "Why this recommendation"
    }
  ]
}

Return ONLY valid JSON, no markdown.`;

  try {
    const result = await model.generateContent([prompt, userPart]);
    const response = await result.response;
    const text = response.text();

    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    return JSON.parse(jsonText);
  } catch (error: any) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to get style recommendations: ${error.message}`);
  }
}

/**
 * Analyze product in real-world context
 */
export async function analyzeProductInContext(
  productImage: Buffer | string,
  context: 'home' | 'outdoor' | 'office' | 'casual' | 'formal'
): Promise<{
  description: string;
  suitability: string;
  stylingTips: string[];
  colorAnalysis: string;
}> {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  let productPart: any;
  if (typeof productImage === 'string') {
    const response = await fetch(productImage);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    productPart = bufferToGenerativePart(buffer, response.headers.get('content-type') || 'image/jpeg');
  } else {
    productPart = bufferToGenerativePart(productImage, 'image/jpeg');
  }

  const prompt = `Analyze this product image and describe how it would look in a ${context} setting.

Return JSON:
{
  "description": "How the product looks and feels",
  "suitability": "How suitable it is for ${context} context",
  "stylingTips": ["tip1", "tip2", "tip3"],
  "colorAnalysis": "Analysis of colors and how they work in ${context}"
}

Return ONLY valid JSON, no markdown.`;

  try {
    const result = await model.generateContent([prompt, productPart]);
    const response = await result.response;
    const text = response.text();

    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    return JSON.parse(jsonText);
  } catch (error: any) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to analyze product context: ${error.message}`);
  }
}

/**
 * Generate product description using AI
 */
export async function generateProductDescription(
  title: string,
  existingDescription?: string,
  category?: string
): Promise<string> {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert e-commerce copywriter specializing in the Nigerian market. Write a compelling, engaging product description for the following product.

Product Title: ${title}
${category ? `Category: ${category}` : ''}
${existingDescription ? `Existing description (can be used as reference): ${existingDescription}` : ''}

Requirements:
- Write 150-250 words
- Use Nigerian market tone and context
- Highlight key benefits and features
- Include a bullet list of 3-5 main features
- Make it persuasive and engaging
- Use conversational but professional language
- Focus on value and quality
- Include why customers should buy this product

Write only the product description, no additional commentary.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (error: any) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to generate product description: ${error.message}`);
  }
}

/**
 * Suggest product tags using AI
 */
export async function suggestProductTags(
  title: string,
  description?: string,
  category?: string,
  count: number = 10
): Promise<string[]> {
  if (!genAI) {
    throw new Error('Gemini API key not configured');
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are an expert e-commerce SEO specialist. Suggest ${count} relevant tags/keywords for the following product.

Product Title: ${title}
${category ? `Category: ${category}` : ''}
${description ? `Description: ${description}` : ''}

Requirements:
- Provide exactly ${count} tags
- Tags should be relevant to the product
- Include category, material, style, use case, and feature tags
- Use Nigerian market context
- Make tags searchable and SEO-friendly
- Separate tags with commas
- No numbering or bullet points, just comma-separated tags

Return only the tags separated by commas, nothing else. Example format: tag1, tag2, tag3, tag4, tag5`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text().trim();
    
    // Parse tags from comma-separated string
    const tags = text
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .slice(0, count);
    
    return tags;
  } catch (error: any) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to suggest product tags: ${error.message}`);
  }
}


