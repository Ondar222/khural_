import { IAccountability } from '../lib/types/';

// interface IUserController {}

interface IUserService {
  createUserCredentials: (id: string) => Promise<IAccountability>;
}

// interface IUserRepository {}

export type {  IUserService };
