import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { FileUploadController } from './file-upload.controller';
import { Mp3ParserService } from './mp3-parser.service';

describe('FileUploadController', () => {
  let controller: FileUploadController;
  let mp3ParserService: Mp3ParserService;

  const mockMp3ParserService = {
    countFrames: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileUploadController],
      providers: [
        {
          provide: Mp3ParserService,
          useValue: mockMp3ParserService,
        },
      ],
    }).compile();

    controller = module.get<FileUploadController>(FileUploadController);
    mp3ParserService = module.get<Mp3ParserService>(Mp3ParserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadFile', () => {
    it('should throw error when no file is uploaded', () => {
      expect(() => controller.uploadFile(undefined)).toThrow(new BadRequestException('No file uploaded'));
    });

    it('should throw error when file is not an MP3', () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.txt',
        encoding: '7bit',
        mimetype: 'text/plain',
        buffer: Buffer.from('test'),
        size: 4,
      } as Express.Multer.File;

      expect(() => controller.uploadFile(mockFile)).toThrow(new BadRequestException('Only MP3 files are allowed'));
    });

    it('should process valid MP3 file and return frame count', () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.mp3',
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        buffer: Buffer.from('fake mp3 data'),
        size: 100,
      } as Express.Multer.File;

      mockMp3ParserService.countFrames.mockReturnValue(1234);

      const result = controller.uploadFile(mockFile);

      expect(result).toEqual({ frameCount: 1234 });
      expect(mp3ParserService.countFrames).toHaveBeenCalledWith(mockFile.buffer);
    });

    it('should throw error when no frames found', () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.mp3',
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        buffer: Buffer.from('fake mp3 data'),
        size: 100,
      } as Express.Multer.File;

      mockMp3ParserService.countFrames.mockReturnValue(0);

      expect(() => controller.uploadFile(mockFile)).toThrow(new BadRequestException('No valid MP3 frames found in file'));
    });

    it('should throw InternalServerErrorException on parsing error', () => {
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.mp3',
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        buffer: Buffer.from('fake mp3 data'),
        size: 100,
      } as Express.Multer.File;

      mockMp3ParserService.countFrames.mockImplementation(() => {
        throw new Error('Parsing error');
      });

      expect(() => controller.uploadFile(mockFile)).toThrow(new InternalServerErrorException('Error processing MP3 file'));
    });
  });
});
