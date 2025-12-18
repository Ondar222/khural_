import { EUserRole } from './user-role';


export type IAccountability = {
  role: EUserRole;
  user: string;
  admin: boolean;
  app: boolean;
  scope: EAppScope;
};

export enum EAppScope {
  LANA_FOOD = 'LANA_FOOD',
}
