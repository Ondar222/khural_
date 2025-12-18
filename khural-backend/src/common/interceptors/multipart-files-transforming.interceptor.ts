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
      const request: Request = context.switchToHttp().getRequest();
      const files = (request as any).files;
      const file = (request as any).file;
      
      // Если есть req.file (одиночный файл от FileInterceptor)
      if (file) {
        // Проверяем, что это еще Multer файл, а не уже обработанный
        const isMulterFile = file.mimetype && 'originalname' in file && !file.id;
        if (isMulterFile) {
          const convertedFile = this.convertMulterFileToAppFile(file as Express.Multer.File);
          (request as any).file = convertedFile;
        }
      }
      // Если есть req.files (массив файлов от FilesInterceptor/AnyFilesInterceptor)
      else if (Array.isArray(files) && files.length > 0) {
        // Проверяем, что это еще Multer файлы
        const needsProcessing = files.some((f: any) => f.mimetype && !f.id);
        if (needsProcessing) {
          this.files = files as Express.Multer.File[];
          (request as any).files = this.collectFields();
        }
      }
      // Если файлы в req.files как объект (от AnyFilesInterceptor)
      else if (files && typeof files === 'object' && !Array.isArray(files)) {
        // Проверяем каждый файл в объекте
        let needsProcessing = false;
        for (const key in files) {
          const fileValue = files[key];
          if (Array.isArray(fileValue)) {
            if (fileValue.some((f: any) => f.mimetype && !f.id)) {
              needsProcessing = true;
              break;
            }
          } else if (fileValue && fileValue.mimetype && !fileValue.id) {
            needsProcessing = true;
            break;
          }
        }
        
        if (needsProcessing) {
          // Собираем все файлы в массив
          this.files = [];
          for (const key in files) {
            const fileValue = files[key];
            if (Array.isArray(fileValue)) {
              this.files.push(...(fileValue as Express.Multer.File[]));
            } else if (fileValue) {
              this.files.push(fileValue as Express.Multer.File);
            }
          }
          (request as any).files = this.collectFields();
        }
      }

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
    const filenameDisk = join(process.env.UPLOAD_PATH!, filename);

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
