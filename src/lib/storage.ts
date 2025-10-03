export type StorageProvider = {
  putObject: (key: string, body: Buffer | string) => Promise<string>;
  getSignedUrl: (key: string, expiresSeconds: number) => Promise<string>;
};

class MemoryStorage implements StorageProvider {
  private store = new Map<string, Buffer>();
  async putObject(key: string, body: Buffer | string) {
    const buf = typeof body === 'string' ? Buffer.from(body) : body;
    this.store.set(key, buf);
    return `memory://${key}`;
  }
  async getSignedUrl(key: string) {
    return `memory://${key}`;
  }
}

let storageImpl: StorageProvider | null = null;
export function getStorage(): StorageProvider {
  if (storageImpl) return storageImpl;
  const bucket = process.env.S3_BUCKET;
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (bucket && region && accessKeyId && secretAccessKey) {
    // Lazy import to keep edge minimal
    const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
    const s3 = new S3Client({ region, credentials: { accessKeyId, secretAccessKey } });
    storageImpl = {
      async putObject(key, body) {
        const buf = typeof body === 'string' ? Buffer.from(body) : body;
        await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buf }));
        return `s3://${bucket}/${key}`;
      },
      async getSignedUrl(key) {
        // Placeholder: for prod, use @aws-sdk/s3-request-presigner
        return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
      },
    };
  } else {
    storageImpl = new MemoryStorage();
  }
  return storageImpl;
}


