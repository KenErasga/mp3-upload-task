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
import { Mp3ParserService } from './mp3-parser.service';
import { FileUploadResponseDto } from './dto/file-upload-response.dto';

@ApiTags('file-upload')
@Controller('file-upload')
export class FileUploadController {
  private readonly logger = new Logger(FileUploadController.name);

  constructor(private readonly mp3ParserService: Mp3ParserService) {}

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
    type: FileUploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'No file uploaded or invalid file' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  uploadFile(@UploadedFile() file: Express.Multer.File): FileUploadResponseDto {
    if (!file) {
      this.logger.warn('No file uploaded');
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'audio/mpeg' && !file.originalname.endsWith('.mp3')) {
      this.logger.warn(`Invalid file type: ${file.mimetype}`);
      throw new BadRequestException('Only MP3 files are allowed');
    }

    try {
      this.logger.log(`Processing file: ${file.originalname}, size: ${file.size} bytes`);
      const frameCount = this.mp3ParserService.countFrames(file.buffer);

      if (frameCount === 0) {
        throw new BadRequestException('No valid MP3 frames found in file');
      }

      this.logger.log(`Successfully counted ${frameCount} frames`);
      return { frameCount };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error processing file: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error processing MP3 file');
    }
  }
}
