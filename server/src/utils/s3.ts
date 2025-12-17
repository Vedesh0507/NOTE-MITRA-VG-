import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET || '';

export interface UploadResult {
  fileUrl: string;
  fileKey: string;
  fileSize: number;
}

/**
 * Generate presigned URL for direct upload to S3
 */
export const generatePresignedUploadUrl = async (
  fileName: string,
  fileType: string,
  fileSize: number
): Promise<{ uploadUrl: string; fileKey: string; fileUrl: string }> => {
  // Validate file type
  if (fileType !== 'application/pdf') {
    throw new Error('Only PDF files are allowed');
  }

  // Validate file size (max 100MB)
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '104857600');
  if (fileSize > maxSize) {
    throw new Error('File size exceeds maximum limit');
  }

  // Generate unique file key
  const fileKey = `notes/${uuidv4()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
    ContentLength: fileSize
  });

  // Generate presigned URL (valid for 15 minutes)
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 900 });

  // Construct the public URL
  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

  return { uploadUrl, fileKey, fileUrl };
};

/**
 * Generate presigned URL for downloading from S3
 */
export const generatePresignedDownloadUrl = async (
  fileKey: string,
  expiresIn: number = 3600 // 1 hour
): Promise<string> => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey
  });

  return getSignedUrl(s3Client, command, { expiresIn });
};

/**
 * Delete file from S3
 */
export const deleteFileFromS3 = async (fileKey: string): Promise<void> => {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey
  });

  await s3Client.send(command);
};

/**
 * Upload buffer directly to S3 (alternative method)
 */
export const uploadBufferToS3 = async (
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<UploadResult> => {
  const fileKey = `notes/${uuidv4()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    Body: buffer,
    ContentType: mimeType
  });

  await s3Client.send(command);

  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`;

  return {
    fileUrl,
    fileKey,
    fileSize: buffer.length
  };
};

/**
 * Extract file key from S3 URL
 */
export const extractFileKeyFromUrl = (url: string): string => {
  const urlParts = url.split('.amazonaws.com/');
  return urlParts[1] || '';
};

/**
 * Validate PDF file
 */
export const validatePdfFile = (file: Express.Multer.File): void => {
  // Check MIME type
  if (file.mimetype !== 'application/pdf') {
    throw new Error('Only PDF files are allowed');
  }

  // Check file size
  const maxSize = parseInt(process.env.MAX_FILE_SIZE || '104857600');
  if (file.size > maxSize) {
    throw new Error('File size exceeds maximum limit (100MB)');
  }

  // Check file extension
  const fileName = file.originalname.toLowerCase();
  if (!fileName.endsWith('.pdf')) {
    throw new Error('Invalid file extension. Only .pdf files are allowed');
  }
};
