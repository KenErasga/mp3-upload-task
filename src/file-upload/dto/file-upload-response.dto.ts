import { ApiProperty } from '@nestjs/swagger';

export class FileUploadResponseDto {
  @ApiProperty({
    example: 6090,
    description: 'Number of MP3 frames in the file',
  })
  frameCount: number;
}
