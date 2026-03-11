/**
 * AI Image Recognition for Product Categorization
 * 
 * Uses Google Gemini Vision API to:
 * 1. Analyze product images
 * 2. Auto-suggest categories
 * 3. Extract attributes (color, material, style)
 * 4. Generate SEO-friendly tags
 * 5. Detect inappropriate content
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

/**
 * Convert image buffer to Gemini format
 */
function bufferToGenerativePart(buffer: Buffer, mimeType: string = 'image/jpeg') {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  };
}

/**
 * Analyze product image and suggest category
 */
export async function analyzeProductImage(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<{
  category: string;
  subcategory: string;
  confidence: number;
  attributes: {
    colors: string[];
    materials: string[];
    style: string;
    occasion: string;
    gender: string;
    ageGroup: string;
  };
  description: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  suggestedPriceRange: string;
}> {
  if (!genAI) {
    throw new Error('Gemini API not configured');
  }

  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
  const imagePart = bufferToGenerativePart(imageBuffer, mimeType);

  const prompt = `Analyze this product image and provide detailed information for e-commerce categorization.

Return a JSON object with this exact structure:
{
  "category": "Main category (e.g., Electronics, Fashion, Home & Garden, Beauty, Sports)",
  "subcategory": "Specific subcategory (e.g., Smartphones, Dresses, Kitchen Appliances)",
  "confidence": 85,
  "attributes": {
    "colors": ["primary color", "secondary color"],
    "materials": ["material1", "material2"],
    "style": "Style description (e.g., Casual, Formal, Modern, Traditional)",
    "occasion": "Best occasion (e.g., Everyday, Wedding, Office, Party)",
    "gender": "Target gender (Men, Women, Unisex, Kids)",
    "ageGroup": "Age group (e.g., Adult, Teen, Child, Baby)"
  },
  "description": "A compelling 2-3 sentence product description",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8"],
  "seoTitle": "SEO-optimized title (50-60 characters)",
  "seoDescription": "SEO meta description (150-160 characters)",
  "suggestedPriceRange": "Suggested price range in Nigerian Naira (e.g., ₦25,000 - ₦30,000)"
}

Guidelines:
- Be specific and accurate
- Use Nigerian market context
- Colors should be common color names
- Materials should be recognizable fabrics/materials
- Tags should be searchable keywords
- Confidence should be 0-100 based on clarity of image
- SEO title should include main keyword
- SEO description should be compelling for clicks

Return ONLY valid JSON, no markdown formatting.`;

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    // Parse JSON response
    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    const analysis = JSON.parse(jsonText);

    return {
      category: analysis.category || 'Uncategorized',
      subcategory: analysis.subcategory || 'General',
      confidence: analysis.confidence || 50,
      attributes: {
        colors: analysis.attributes?.colors || [],
        materials: analysis.attributes?.materials || [],
        style: analysis.attributes?.style || 'General',
        occasion: analysis.attributes?.occasion || 'Everyday',
        gender: analysis.attributes?.gender || 'Unisex',
        ageGroup: analysis.attributes?.ageGroup || 'Adult',
      },
      description: analysis.description || '',
      tags: analysis.tags || [],
      seoTitle: analysis.seoTitle || '',
      seoDescription: analysis.seoDescription || '',
      suggestedPriceRange: analysis.suggestedPriceRange || '',
    };
  } catch (error: any) {
    console.error('Image analysis error:', error);
    throw new Error(`Failed to analyze image: ${error.message}`);
  }
}

/**
 * Batch analyze multiple product images
 */
export async function batchAnalyzeImages(
  images: Array<{ buffer: Buffer; mimeType: string; filename: string }>
): Promise<Array<{
  filename: string;
  result: Awaited<ReturnType<typeof analyzeProductImage>> | null;
  error?: string;
}>> {
  const results = [];

  for (const image of images) {
    try {
      const result = await analyzeProductImage(image.buffer, image.mimeType);
      results.push({
        filename: image.filename,
        result,
      });
    } catch (error: any) {
      results.push({
        filename: image.filename,
        result: null,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Detect inappropriate content in image
 */
export async function detectInappropriateContent(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<{
  isAppropriate: boolean;
  confidence: number;
  flags: string[];
}> {
  if (!genAI) {
    // Skip check if API not configured
    return { isAppropriate: true, confidence: 100, flags: [] };
  }

  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
  const imagePart = bufferToGenerativePart(imageBuffer, mimeType);

  const prompt = `Analyze this image for inappropriate content for an e-commerce platform.

Check for:
- Nudity or sexual content
- Violence or gore
- Hate symbols
- Drugs or drug paraphernalia
- Counterfeit goods
- Misleading/fake products

Return JSON:
{
  "isAppropriate": true/false,
  "confidence": 0-100,
  "flags": ["list of any issues found, or empty if appropriate"]
}

Be conservative - when in doubt, flag it.
Return ONLY valid JSON.`;

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text();

    let jsonText = text.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    return JSON.parse(jsonText);
  } catch (error) {
    // If check fails, assume appropriate but log
    console.error('Content check failed:', error);
    return { isAppropriate: true, confidence: 0, flags: ['check_failed'] };
  }
}

/**
 * Extract dominant colors from image
 */
export async function extractImageColors(
  imageBuffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<string[]> {
  if (!genAI) {
    return [];
  }

  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
  const imagePart = bufferToGenerativePart(imageBuffer, mimeType);

  const prompt = `List the 3-5 dominant colors in this product image.

Return as a simple JSON array of color names:
["Color1", "Color2", "Color3"]

Use standard color names that customers would recognize.
Return ONLY the JSON array.`;

  try {
    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    const text = response.text().trim();

    let jsonText = text;
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Color extraction failed:', error);
    return [];
  }
}

/**
 * Compare product images for similarity
 */
export async function compareProductImages(
  image1Buffer: Buffer,
  image2Buffer: Buffer,
  mimeType: string = 'image/jpeg'
): Promise<{
  similarity: number; // 0-100
  isSameProduct: boolean;
  differences: string[];
}> {
  if (!genAI) {
    return { similarity: 0, isSameProduct: false, differences: [] };
  }

  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
  const image1Part = bufferToGenerativePart(image1Buffer, mimeType);
  const image2Part = bufferToGenerativePart(image2Buffer, mimeType);

  const prompt = `Compare these two product images and determine if they show the same product.

Return JSON:
{
  "similarity": 0-100,
  "isSameProduct": true/false,
  "differences": ["list any visible differences"]
}

Consider: product type, color, design, size, angle, lighting.
Return ONLY valid JSON.`;

  try {
    const result = await model.generateContent([prompt, image1Part, image2Part]);
    const response = await result.response;
    const text = response.text().trim();

    let jsonText = text;
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    return JSON.parse(jsonText);
  } catch (error) {
    console.error('Image comparison failed:', error);
    return { similarity: 0, isSameProduct: false, differences: [] };
  }
}

/**
 * Map AI category to system category
 */
export function mapToSystemCategory(
  aiCategory: string,
  aiSubcategory: string,
  systemCategories: Array<{ name: string; slug: string }>
): { categoryId: string | null; confidence: number } {
  const normalizedAiCategory = aiCategory.toLowerCase().trim();
  const normalizedAiSubcategory = aiSubcategory.toLowerCase().trim();

  // Try exact match first
  const exactMatch = systemCategories.find(
    cat => cat.name.toLowerCase() === normalizedAiCategory ||
      cat.name.toLowerCase() === normalizedAiSubcategory
  );

  if (exactMatch) {
    return { categoryId: exactMatch.slug, confidence: 100 };
  }

  // Try partial match
  const partialMatch = systemCategories.find(cat => {
    const catName = cat.name.toLowerCase();
    return normalizedAiCategory.includes(catName) ||
      catName.includes(normalizedAiCategory) ||
      normalizedAiSubcategory.includes(catName) ||
      catName.includes(normalizedAiSubcategory);
  });

  if (partialMatch) {
    return { categoryId: partialMatch.slug, confidence: 70 };
  }

  return { categoryId: null, confidence: 0 };
}
