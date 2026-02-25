import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const r2Config = {
  accountId: process.env.R2_ACCOUNT_ID || '',
  accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  bucketName: process.env.R2_BUCKET_NAME || '',
  publicBaseUrl: process.env.R2_PUBLIC_BASE_URL || '', // e.g., https://cdn.example.com or https://<accountid>.r2.cloudflarestorage.com/<bucket>
};

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${r2Config.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: r2Config.accessKeyId,
    secretAccessKey: r2Config.secretAccessKey,
  },
});

export async function uploadBufferToR2(options: {
  buffer: Buffer;
  originalName: string;
  contentType?: string;
  folder?: string;
}): Promise<{ url: string; key: string }> {
  const ext = options.originalName.split('.').pop() || 'bin';
  const keyBase = `${options.folder ? options.folder.replace(/\/$/, '') + '/' : ''}${uuidv4()}`;
  const key = `${keyBase}.${ext}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: r2Config.bucketName,
      Key: key,
      Body: options.buffer,
      ContentType: options.contentType,
      ACL: undefined,
    })
  );

  const url = r2Config.publicBaseUrl
    ? `${r2Config.publicBaseUrl.replace(/\/$/, '')}/${key}`
    : `https://${r2Config.accountId}.r2.cloudflarestorage.com/${r2Config.bucketName}/${key}`;

  return { url, key };
}

export async function deleteFromR2(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({ Bucket: r2Config.bucketName, Key: key }));
}

export default r2Config;








