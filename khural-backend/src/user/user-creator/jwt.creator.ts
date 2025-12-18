import { User } from '../user.entity';
import { UserFactory } from '../user.factory';
import { UserCreator } from './interface';

class JwtProvidedUserCreator implements UserCreator {
  constructor(userFactory: UserFactory) {}

  async create({ phone, email, password, code }) {
    return new User();
  }
}

export { JwtProvidedUserCreator };
