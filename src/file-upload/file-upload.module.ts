import { Module } from '@nestjs/common';
import { FileUploadController } from './file-upload.controller';
import { Mp3ParserService } from './mp3-parser.service';

@Module({
  controllers: [FileUploadController],
  providers: [Mp3ParserService],
  exports: [Mp3ParserService],
})
export class FileUploadModule {}
