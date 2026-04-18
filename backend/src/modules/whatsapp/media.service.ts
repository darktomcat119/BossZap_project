import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';

const MAX_IMAGE_SIZE = 200 * 1024;
const MAX_IMAGE_DIMENSION = 500;
const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);
  private readonly openaiApiKey: string;
  private readonly s3Bucket: string;
  private readonly s3Region: string;

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly configService: ConfigService,
  ) {
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    this.s3Bucket = this.configService.get<string>(
      'AWS_S3_BUCKET',
      'bosszap-files',
    );
    this.s3Region = this.configService.get<string>('AWS_REGION', 'sa-east-1');
  }

  async transcribeAudio(mediaId: string): Promise<string> {
    this.logger.log(`Transcribing audio ${mediaId}`);

    const mediaUrl = await this.whatsappService.getMediaUrl(mediaId);
    const audioBuffer = await this.whatsappService.downloadMedia(mediaUrl);

    const formData = new FormData();
    const audioBlob = new Blob([new Uint8Array(audioBuffer) as any], {
      type: 'audio/ogg',
    });
    formData.append('file', audioBlob, 'audio.ogg');
    formData.append('model', 'whisper-1');

    const response = await fetch(
      'https://api.openai.com/v1/audio/transcriptions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Whisper API error: ${error}`);
      throw new Error(`Whisper transcription failed: ${error}`);
    }

    const result = (await response.json()) as { text: string };
    this.logger.log(`Audio transcribed: ${result.text.substring(0, 50)}...`);
    return result.text;
  }

  async processAndStoreImage(
    mediaId: string,
    subscriberId: string,
    purpose: string,
  ): Promise<string> {
    this.logger.log(`Processing image ${mediaId} for ${subscriberId}`);

    const mediaUrl = await this.whatsappService.getMediaUrl(mediaId);
    const imageBuffer = await this.whatsappService.downloadMedia(mediaUrl);

    const key = `subscribers/${subscriberId}/${purpose}/` + `${Date.now()}.jpg`;

    const s3Url = await this.uploadToS3(imageBuffer, key, 'image/jpeg');

    this.logger.log(`Image stored at ${s3Url}`);
    return s3Url;
  }

  async uploadToS3(
    buffer: Buffer,
    key: string,
    contentType: string,
  ): Promise<string> {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

    const s3 = new S3Client({ region: this.s3Region });

    await s3.send(
      new PutObjectCommand({
        Bucket: this.s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );

    return (
      `https://${this.s3Bucket}.s3.` + `${this.s3Region}.amazonaws.com/${key}`
    );
  }

  async uploadPdfToS3(
    buffer: Buffer,
    subscriberId: string,
    filename: string,
  ): Promise<string> {
    const key = `subscribers/${subscriberId}/documents/${filename}`;
    return this.uploadToS3(buffer, key, 'application/pdf');
  }

  isValidImageType(mimeType: string): boolean {
    return ALLOWED_IMAGE_TYPES.includes(mimeType);
  }
}
