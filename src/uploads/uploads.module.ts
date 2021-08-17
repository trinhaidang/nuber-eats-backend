import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import * as S3 from 'aws-sdk/clients/s3';

@Module({
    controllers: [UploadsController],
})
export class UploadsModule {}
