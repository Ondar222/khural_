import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { Files } from "./files.entity";
import { FilesRepository } from "./files.repository";
import fs from "fs";
import { UploadedFile } from "../common/interceptors";

@Injectable()
export class FilesService {
  constructor(private filesRepository: FilesRepository) {}

  async getById(id: string) {
    return await this.filesRepository.findOneBy({
      id: id,
    });
  }

  async upload(file: UploadedFile) {
    try {
      if (!file.id) {
        console.error('File ID is missing', file)
        throw new
        InternalServerErrorException('File ID is required');
      }
        await this.saveFile(file);
        const createdFile = this.filesRepository.create({
          ...file,
          id: file.id,
        });

        return await this.filesRepository.save(createdFile);
      } catch (e) {
      console.error(e);
      throw new InternalServerErrorException();
    }
  }

  async uploadMany(files: Array<UploadedFile>): Promise<Array<Files>> {
    try {
      const images: Array<Files> = [];
      for (const file of files) {
        const uploadedFile = await this.upload(file);
        if (uploadedFile && uploadedFile.id) images.push(uploadedFile);
      }
      // for (let i = 0; i < files.length; i++) {
      //   const file = await this.upload(files[i]);
      //   if (file && file.id) {
      //     images.push(file);
      //   }
      // }
      return images;
    } catch (e) {
      console.log(e);
      throw new InternalServerErrorException();
    }
  }

  async delete(id: string) {
    return await this.filesRepository.delete({
      id,
    });
  }

  async saveFile(file: UploadedFile) {
    if (file && file.filename_disk && file.buffer) {
      fs.writeFileSync(file.filename_disk, file.buffer);
    }
  }

  async clone(id: string): Promise<Files | null> {
    const originalFile = await this.getById(id);
    if (!originalFile) {
      return null;
    }

    const file: Files = await this.filesRepository.clone(originalFile);
    this.copyFile(originalFile, file.filename_disk);

    return file;
  }

  copyFile(originalFile: Files, copyDestination: string) {
    fs.copyFileSync(originalFile.filename_disk, copyDestination);
  }
}
