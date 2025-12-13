import { Injectable } from "@nestjs/common";
import { DataSource, Repository } from "typeorm";
import { Files } from "./files.entity";
import { v4 as uuidv4 } from "uuid";
import path from "node:path";

@Injectable()
export class FilesRepository extends Repository<Files> {
  constructor(private dataSource: DataSource) {
    super(Files, dataSource.createEntityManager());
  }

  async clone(originalFile: Files): Promise<Files> {
    const fileUUID = uuidv4();

    const parsedOriginalFile = path.parse(originalFile.filename_disk);
    const filename = `${fileUUID}${parsedOriginalFile.ext}`;
    const newFilenameDisk = path.join(parsedOriginalFile.dir, filename);

    const file = this.create({
      ...originalFile,
      id: fileUUID,
      filename_disk: newFilenameDisk,
    });

    return await this.save(file);
  }
}