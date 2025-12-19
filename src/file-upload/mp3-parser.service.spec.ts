import { Test, TestingModule } from '@nestjs/testing';
import { Mp3ParserService } from './mp3-parser.service';
import * as fs from 'fs';
import * as path from 'path';

describe('Mp3ParserService', () => {
  let service: Mp3ParserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Mp3ParserService],
    }).compile();

    service = module.get<Mp3ParserService>(Mp3ParserService);
  });

  describe('countFrames', () => {
    it('should return 0 for empty buffer', () => {
      const buffer = Buffer.from([]);
      const result = service.countFrames(buffer);
      expect(result).toBe(0);
    });

    it('should return 0 for non-MP3 data', () => {
      const buffer = Buffer.from('This is not an MP3 file');
      const result = service.countFrames(buffer);
      expect(result).toBe(0);
    });

    it('should count frames in actual MP3 file', () => {
      const mp3FilePath = path.join(__dirname, 'test-data/sample (2).mp3');

      if (fs.existsSync(mp3FilePath)) {
        const buffer = fs.readFileSync(mp3FilePath);
        const result = service.countFrames(buffer);

        expect(result).toBeGreaterThan(0);
        console.log(`Sample MP3 file contains ${result} frames`);
      } else {
        console.warn('Sample MP3 file not found, skipping test');
      }
    });

    it('should handle MP3 with ID3v2 tag', () => {
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
        0x00, // size (synchsafe)
      ]);

      // Add a valid MP3 frame header (MPEG1 Layer3 128kbps 44100Hz)
      const frameHeader = Buffer.from([
        0xff,
        0xfb, // sync + version + layer
        0x90,
        0x00, // bitrate + samplerate + padding
      ]);

      const buffer = Buffer.concat([id3Tag, frameHeader, Buffer.alloc(417)]); // 417 bytes frame size
      const result = service.countFrames(buffer);

      expect(result).toBeGreaterThanOrEqual(1);
    });
  });
});
