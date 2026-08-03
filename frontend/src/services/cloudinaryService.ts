import axios from 'axios';

const CLOUDINARY_API_KEY = import.meta.env.VITE_CLOUDINARY_API_KEY || '829565713471837';
const CLOUDINARY_API_SECRET = import.meta.env.VITE_CLOUDINARY_API_SECRET || 'oHpiWWc8qqRFZUkj-kBtXhsVcJ8';
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'djuq2enmy';

async function generateSignature(params: Record<string, string>, apiSecret: string): Promise<string> {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  const stringToSign = sortedParams + apiSecret;

  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export const cloudinaryService = {
  uploadImage: async (file: File, folder: string = 'bus_booking_system'): Promise<string> => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params = {
      folder,
      timestamp,
    };

    const signature = await generateSignature(params, CLOUDINARY_API_SECRET);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('folder', folder);
    formData.append('signature', signature);

    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const res = await axios.post<{ secure_url: string }>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return res.data.secure_url;
  }
};
