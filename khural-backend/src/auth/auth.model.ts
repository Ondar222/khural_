import { LoginDto } from './dto/auth.dto';
import * as Express from "express";

export interface AuthModel{
  login: (
    headers: Express.Request["headers"],
    ip: string,
    body: LoginDto
  ) => Promise<LoginDto>;
}