import { EUserRole } from '../../lib/types/user-role';

class RolesHelper {
  static isAdmin = (role: EUserRole) => {
    return role === EUserRole.admin;
  };

  static isHotel = (role: EUserRole) => {
    return role === EUserRole.admin;
  };

  static isTourist = (role: EUserRole) => {
    return role === EUserRole.citizen;
  };
}

export { RolesHelper };
