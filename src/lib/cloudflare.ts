// Cloudflare configuration
const cloudflareConfig = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
  apiToken: process.env.CLOUDFLARE_API_TOKEN || '',
  imagesDeliveryUrl: process.env.CLOUDFLARE_IMAGES_DELIVERY_URL || '',
  streamDeliveryUrl: process.env.CLOUDFLARE_STREAM_DELIVERY_URL || '',
};

// Helper function to upload image to Cloudflare Images API
export const uploadImageToCloudflare = async (file: Buffer, filename: string) => {
  try {
    // Use FormData for Node.js (requires form-data package or native FormData in Node 18+)
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', file, {
      filename,
      contentType: 'image/jpeg',
    });

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudflareConfig.apiToken}`,
          ...formData.getHeaders(),
        },
        body: formData as any,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return {
      success: true,
      url: data.result?.variants?.[0] || `${cloudflareConfig.imagesDeliveryUrl}/${data.result?.id}`,
      id: data.result?.id,
      variants: data.result?.variants,
    };
  } catch (error) {
    console.error('Cloudflare Images upload error:', error);
    throw new Error('Failed to upload image to Cloudflare');
  }
};

// Helper function to upload video to Cloudflare Stream API
export const uploadVideoToCloudflare = async (file: Buffer, filename: string) => {
  try {
    const FormData = (await import('form-data')).default;
    const formData = new FormData();
    formData.append('file', file, {
      filename,
      contentType: 'video/mp4',
    });

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/stream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cloudflareConfig.apiToken}`,
          ...formData.getHeaders(),
        },
        body: formData as any,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare Stream API error: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return {
      success: true,
      url: data.result?.playback?.hls || `${cloudflareConfig.streamDeliveryUrl}/${data.result?.uid}`,
      uid: data.result?.uid,
      thumbnail: data.result?.thumbnail,
      duration: data.result?.duration,
    };
  } catch (error) {
    console.error('Cloudflare Stream upload error:', error);
    throw new Error('Failed to upload video to Cloudflare');
  }
};

// Helper function to delete image from Cloudflare
export const deleteImageFromCloudflare = async (imageId: string) => {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/images/v1/${imageId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${cloudflareConfig.apiToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Cloudflare Images delete error:', error);
    throw new Error('Failed to delete image from Cloudflare');
  }
};

// Helper function to delete video from Cloudflare Stream
export const deleteVideoFromCloudflare = async (videoUid: string) => {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${cloudflareConfig.accountId}/stream/${videoUid}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${cloudflareConfig.apiToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Cloudflare Stream API error: ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Cloudflare Stream delete error:', error);
    throw new Error('Failed to delete video from Cloudflare');
  }
};

export default cloudflareConfig;

