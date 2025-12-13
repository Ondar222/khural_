import { Controller, Get, Param, Res } from "@nestjs/common";
import { FilesService } from "./files.service";
import { Response } from "express";
import * as path from "path";
import { ConfigService } from "@nestjs/config";

@Controller("files")
export class FilesController {
  constructor(
    private readonly configService: ConfigService,
    private filesService: FilesService
  ) {}

  // deprecated
  @Get("/:id")
  async getByID(@Param("id") id: string, @Res() res: Response) {
    const uploadPath = this.configService.get<string>("UPLOAD_PATH") || "./uploads";
    const data = await this.filesService.getById(id);
    if (!data || !data.filename_disk) return res.sendStatus(400);
    else {
      res.sendFile(path.resolve(uploadPath));
    }
  }

  @Get("/v2/:id")
  async v2getByID(@Param("id") id: string, @Res() res: Response) {
    const data = await this.filesService.getById(id);
    if (!data || !data.filename_disk) return res.sendStatus(400);
    else {
      res.sendFile(data.filename_disk);
    }
  }
}