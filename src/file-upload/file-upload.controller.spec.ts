import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FileUploadController } from './file-upload.controller';

describe('FileUploadController', () => {
  let controller: FileUploadController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FileUploadController],
      providers: [],
    }).compile();

    controller = module.get<FileUploadController>(FileUploadController);
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
      // TODO: update to count the expected frame rate
      const mockFile = {
        fieldname: 'file',
        originalname: 'test.mp3',
        encoding: '7bit',
        mimetype: 'audio/mpeg',
        buffer: Buffer.from('fake mp3 data'),
        size: 100,
      } as Express.Multer.File;

      const result = controller.uploadFile(mockFile);

      expect(result).toEqual({ frameCount: 1234 });
    });
  });
});
