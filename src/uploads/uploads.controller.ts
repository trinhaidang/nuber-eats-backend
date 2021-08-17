import { Controller, Post, UploadedFile, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import * as AWS from 'aws-sdk';
import { BUCKET_NAME } from "src/common/common.constants";



@Controller('uploads')
export class UploadsController {
    @Post('')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file) {
        AWS.config.update({
            credentials: {
                accessKeyId: "",
                secretAccessKey: "",
            }
        })
        try {
            //remove after creating bucket or use an existing bucket
            // const createBucket = await new AWS.S3().createBucket({
            //     Bucket: BUCKET_NAME,
            // }).promise();
            // console.log(createBucket);

            const objectName = `${Date.now() + file.originalName}`;
            await new AWS.S3().putObject({
                Body: file.buffer,
                Bucket: BUCKET_NAME,
                Key: objectName,
                ACL: 'public-read'
            }).promise();
            const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${objectName}`;
            return { url: fileUrl };
        } catch (error) {
            console.log(error);
            return { url: null };
        }
        console.log(file);
    }
}