import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from '../src/app.module';

describe('FileUploadController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/file-upload (POST)', () => {
    it('should upload valid MP3 file and return frame count', () => {
      const mp3FilePath = path.join(__dirname, '../src/file-upload/test-data/sample (2).mp3');
      const fileBuffer = fs.readFileSync(mp3FilePath);

      return request(app.getHttpServer())
        .post('/file-upload')
        .attach('file', fileBuffer, 'sample.mp3')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('frameCount');
          expect(res.body.frameCount).toBe(6090);
          expect(typeof res.body.frameCount).toBe('number');
        });
    });

    it('should return 400 when no file is uploaded', () => {
      return request(app.getHttpServer())
        .post('/file-upload')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('No file uploaded');
        });
    });

    it('should return 400 when non-MP3 file is uploaded', () => {
      const textBuffer = Buffer.from('This is not an MP3 file');

      return request(app.getHttpServer())
        .post('/file-upload')
        .attach('file', textBuffer, 'test.txt')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('Only MP3 files are allowed');
        });
    });

    it('should return 400 when file has no valid MP3 frames', () => {
      const invalidMp3Buffer = Buffer.from('FAKE MP3 DATA WITH NO FRAMES');

      return request(app.getHttpServer())
        .post('/file-upload')
        .attach('file', invalidMp3Buffer, 'invalid.mp3')
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('No valid MP3 frames found');
        });
    });

    it('should handle MP3 file with ID3v2 tag', () => {
      // Create a minimal MP3 buffer with ID3v2 tag
      const id3Tag = Buffer.from([
        0x49,
        0x44,
        0x33, // "ID3"
        0x03,
        0x00, // version
        0x00, // flags
        0x00,
        0x00,
        0x00,
        0x0a, // size (10 bytes of data)
      ]);

      const id3Data = Buffer.alloc(10); // 10 bytes of ID3 data

      // Valid MP3 frame header (MPEG1 Layer3 128kbps 44100Hz)
      const frameHeader = Buffer.from([
        0xff,
        0xfb, // sync + version + layer
        0x90,
        0x00, // bitrate + samplerate + padding
      ]);

      const frameData = Buffer.alloc(413); // Rest of the frame (417 total - 4 header)

      const mp3WithId3 = Buffer.concat([id3Tag, id3Data, frameHeader, frameData]);

      return request(app.getHttpServer())
        .post('/file-upload')
        .attach('file', mp3WithId3, 'test-with-id3.mp3')
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('frameCount');
          expect(res.body.frameCount).toBeGreaterThan(0);
        });
    });

    it('should return correct content-type header', () => {
      const mp3FilePath = path.join(__dirname, '../src/file-upload/test-data/sample (2).mp3');
      const fileBuffer = fs.readFileSync(mp3FilePath);

      return request(app.getHttpServer())
        .post('/file-upload')
        .attach('file', fileBuffer, 'sample.mp3')
        .expect(201)
        .expect('Content-Type', /json/);
    });
  });
});
