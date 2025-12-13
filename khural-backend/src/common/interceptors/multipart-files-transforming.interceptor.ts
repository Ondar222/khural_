import {
	BadRequestException,
	CallHandler,
	ExecutionContext,
	NestInterceptor,
} from "@nestjs/common";
import path, { join } from "path";
import { Observable } from "rxjs";
import { Files } from "../../files/files.entity";
import { Request } from "express";
import { v4 } from "uuid";
import fs from "fs";

type UploadedFile = Omit<Files, "link"> & {
	buffer?: Express.Multer.File["buffer"];
};

class MultipartFilesTransformingInterceptor implements NestInterceptor {
  files: Express.Multer.File[] = [] ;
  // uploaded_by
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> | Promise<Observable<any>> {
    try {
      const { files  }: Request = context
        .switchToHttp()
        .getRequest();
      if (Array.isArray(files) && this.checkIsFilesProvided(files)) {
        this.files = files;
      }
      context.switchToHttp().getRequest().files = this.collectFields();

      return next.handle();
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  checkIsFilesProvided( files: Express.Multer.File[]): boolean {
    console.log(files);
    if (!files || !Array.isArray(files)) {
      throw new BadRequestException('Files should be an array');
    }
    if (files.length > 0) {
      return true;
    }
    throw new BadRequestException('No files provided');
  }

  collectFields() {
    const uploadFields: {
      [key: string]: UploadedFile | Array<UploadedFile>;
    } = {};

    const fields = new Map<string, Array<UploadedFile>>();

    for (const file of this.files) {
      console.log(file);
      const convertedFile = this.convertMulterFileToAppFile(file);

      if (fields.has(file.fieldname)) {
        fields.get(file.fieldname)?.push(convertedFile);
      } else {
        fields.set(file.fieldname, []);
        fields.get(file.fieldname)?.push(convertedFile);
      }
    }

    fields.forEach((value, key) => {
      if (value.length === 1) {
        uploadFields[key] = value[0];
      } else {
        uploadFields[key] = value;
      }
    });

    return uploadFields;
  }

  convertMulterFileToAppFile(uploadedFile: Express.Multer.File): UploadedFile {
    const id = v4();
    const extname = path.extname(uploadedFile.originalname);
    const filename = String().concat(id, extname);
    const uploadRoot = process.env.UPLOAD_PATH || "./uploads";
    const filenameDisk = path.resolve(uploadRoot, filename);
    // ensure directory exists
    fs.mkdirSync(path.dirname(filenameDisk), { recursive: true });

    return {
      id: id,
      storage: 'cdn',

      filename_disk: filenameDisk,
      filename_download: filename,
      title: id,
      type: uploadedFile.mimetype,

      // uploaded_by: this.uploaded_by,

      filesize: uploadedFile.size,
      buffer: uploadedFile.buffer,
    };
  }
}

export { MultipartFilesTransformingInterceptor, UploadedFile };
