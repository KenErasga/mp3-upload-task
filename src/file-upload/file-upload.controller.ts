import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';

interface FrameCountResponse {
  frameCount: number;
}

@ApiTags('file-upload')
@Controller('file-upload')
export class FileUploadController {
  private readonly logger = new Logger(FileUploadController.name);

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload MP3 file and get frame count' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully counted frames in MP3 file',
    schema: {
      type: 'object',
      properties: {
        frameCount: {
          type: 'number',
          example: 1234,
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'No file uploaded or invalid file' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  uploadFile(@UploadedFile() file: Express.Multer.File): FrameCountResponse {
    if (!file) {
      this.logger.warn('No file uploaded');
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'audio/mpeg' && !file.originalname.endsWith('.mp3')) {
      this.logger.warn(`Invalid file type: ${file.mimetype}`);
      throw new BadRequestException('Only MP3 files are allowed');
    }

    try {
      // TODO: parse mp3 to count frame
      const frameCount = 1234;

      return { frameCount };
    } catch (error) {
      this.logger.error(`Error processing file: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error processing MP3 file');
    }
  }
}
