import { put, del, list, head } from '@vercel/blob';

/**
 * Vercel Blob - Serverless Storage
 * Used for: Message attachments, logs, backups, large files
 */

export class VercelBlobService {
  /**
   * Upload a file to Vercel Blob
   */
  static async upload(
    filename: string,
    data: Blob | Buffer | string,
    options?: {
      contentType?: string;
      access?: 'public' | 'private';
      addRandomSuffix?: boolean;
    }
  ) {
    try {
      const blob = await put(filename, data, {
        access: options?.access || 'public',
        contentType: options?.contentType,
        addRandomSuffix: options?.addRandomSuffix ?? true,
      });

      return blob;
    } catch (error) {
      console.error('Blob upload error:', error);
      throw error;
    }
  }

  /**
   * Delete a file from Vercel Blob
   */
  static async delete(url: string) {
    try {
      await del(url);
      return { success: true };
    } catch (error) {
      console.error('Blob delete error:', error);
      throw error;
    }
  }

  /**
   * List files in a prefix
   */
  static async list(prefix?: string) {
    try {
      const { blobs } = await list({ prefix });
      return blobs;
    } catch (error) {
      console.error('Blob list error:', error);
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  static async head(url: string) {
    try {
      const blob = await head(url);
      return blob;
    } catch (error) {
      console.error('Blob head error:', error);
      throw error;
    }
  }

  /**
   * Upload message attachment
   */
  static async uploadAttachment(
    messageId: string,
    file: Blob | Buffer,
    filename: string,
    contentType?: string
  ) {
    const path = `attachments/${messageId}/${filename}`;
    return this.upload(path, file, {
      contentType,
      access: 'public',
    });
  }

  /**
   * Upload log file
   */
  static async uploadLog(
    logType: string,
    content: string,
    timestamp: Date = new Date()
  ) {
    const filename = `logs/${logType}/${timestamp.toISOString()}.log`;
    return this.upload(filename, content, {
      contentType: 'text/plain',
      access: 'private',
    });
  }

  /**
   * Upload backup
   */
  static async uploadBackup(
    backupType: string,
    data: Blob | Buffer,
    timestamp: Date = new Date()
  ) {
    const filename = `backups/${backupType}/${timestamp.toISOString()}.backup`;
    return this.upload(filename, data, {
      contentType: 'application/octet-stream',
      access: 'private',
    });
  }
}
