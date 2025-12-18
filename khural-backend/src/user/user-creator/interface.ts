import { User } from '../user.entity';

interface UserCreator {
  create(dto: any): Promise<User>;
}

export { UserCreator };
