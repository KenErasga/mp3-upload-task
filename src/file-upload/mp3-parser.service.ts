import { Injectable, Logger } from '@nestjs/common';

interface Mp3FrameHeader {
  syncWord: number;
  mpegVersion: number;
  layer: number;
  bitrate: number;
  sampleRate: number;
  padding: number;
  frameSize: number;
}

@Injectable()
export class Mp3ParserService {
  private readonly logger = new Logger(Mp3ParserService.name);

  // MPEG Version 1 Layer 3 bitrate table (kbps)
  private readonly bitrateTable = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0];

  // MPEG Version 1 sample rate table (Hz)
  private readonly sampleRateTable = [44100, 48000, 32000, 0];

  /**
   * Counts the number of frames in an MP3 file
   * @param buffer - The MP3 file buffer
   * @returns The number of frames in the file
   */
  countFrames(buffer: Buffer): number {
    let frameCount = 0;
    let offset = 0;

    // Skip ID3v2 tag if present
    offset = this.skipId3v2Tag(buffer, offset);

    while (offset < buffer.length - 4) {
      // Look for frame sync (11 bits set to 1)
      if (!this.isFrameSync(buffer, offset)) {
        offset++;
        continue;
      }

      try {
        const header = this.parseFrameHeader(buffer, offset);

        if (header && this.isValidHeader(header)) {
          frameCount++;
          offset += header.frameSize;
        } else {
          offset++;
        }
      } catch (error) {
        this.logger.warn(`Error parsing frame at offset ${offset}: ${error.message}`);
        offset++;
      }
    }

    this.logger.log(`Found ${frameCount} frames in MP3 file`);
    return frameCount;
  }

  /**
   * Skips the ID3v2 tag if present at the beginning of the file
   */
  private skipId3v2Tag(buffer: Buffer, offset: number): number {
    // Check for ID3v2 tag (starts with "ID3")
    if (offset + 10 <= buffer.length && buffer.toString('ascii', offset, offset + 3) === 'ID3') {
      // ID3v2 tag size is stored in bytes 6-9 as a synchsafe integer
      const size =
        ((buffer[offset + 6] & 0x7f) << 21) |
        ((buffer[offset + 7] & 0x7f) << 14) |
        ((buffer[offset + 8] & 0x7f) << 7) |
        (buffer[offset + 9] & 0x7f);

      this.logger.log(`Skipping ID3v2 tag of size ${size + 10} bytes`);
      return offset + size + 10;
    }

    return offset;
  }

  /**
   * Checks if the current position contains a valid frame sync
   */
  private isFrameSync(buffer: Buffer, offset: number): boolean {
    if (offset + 1 >= buffer.length) {
      return false;
    }

    // Frame sync: 11 bits set to 1 (0xFF followed by 0xE0 or higher)
    return buffer[offset] === 0xff && (buffer[offset + 1] & 0xe0) === 0xe0;
  }

  /**
   * Parses the MP3 frame header
   */
  private parseFrameHeader(buffer: Buffer, offset: number): Mp3FrameHeader | null {
    if (offset + 4 > buffer.length) {
      return null;
    }

    const header = buffer.readUInt32BE(offset);

    // Sync word (11 bits)
    const syncWord = (header >> 21) & 0x7ff;

    // MPEG Audio version (2 bits)
    const mpegVersion = (header >> 19) & 0x03;

    // Layer description (2 bits)
    const layer = (header >> 17) & 0x03;

    // Bitrate index (4 bits)
    const bitrateIndex = (header >> 12) & 0x0f;

    // Sample rate index (2 bits)
    const sampleRateIndex = (header >> 10) & 0x03;

    // Padding bit
    const padding = (header >> 9) & 0x01;

    // Validate MPEG Version 1, Layer 3
    if (mpegVersion !== 0x03 || layer !== 0x01) {
      return null;
    }

    const bitrate = this.bitrateTable[bitrateIndex];
    const sampleRate = this.sampleRateTable[sampleRateIndex];

    if (bitrate === 0 || sampleRate === 0) {
      return null;
    }

    // Calculate frame size for MPEG Version 1 Layer 3
    const frameSize = Math.floor((144 * bitrate * 1000) / sampleRate) + padding;

    return {
      syncWord,
      mpegVersion,
      layer,
      bitrate,
      sampleRate,
      padding,
      frameSize,
    };
  }

  /**
   * Validates the parsed frame header
   */
  private isValidHeader(header: Mp3FrameHeader): boolean {
    return (
      header.syncWord === 0x7ff &&
      header.mpegVersion === 0x03 &&
      header.layer === 0x01 &&
      header.bitrate > 0 &&
      header.sampleRate > 0 &&
      header.frameSize > 0 &&
      header.frameSize < 2881 // Max frame size for MPEG1 Layer3
    );
  }
}
