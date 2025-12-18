const crypto = require('crypto');
import * as bcrypt from 'bcrypt';

class PasswordHelper {
  static generatePassword = () => {
    return crypto.randomBytes(20).toString('hex');
  };

  static hashPassword = async (password: string | undefined) => {
    let hashed_password = '';

    if (password) {
      hashed_password = await bcrypt.hash(password, 10);
    } else {
      hashed_password = await bcrypt.hash(this.generatePassword(), 10);
    }

    return hashed_password;
  };

  static comparePassword = async (
    password: string,
    hashed_password: string,
  ) => {
    return await bcrypt.compare(password, hashed_password);
  };
}

export { PasswordHelper };
