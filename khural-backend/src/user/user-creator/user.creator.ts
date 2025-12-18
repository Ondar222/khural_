import { UserCreator } from './interface';

class UserCreationStrategy {
  constructor() {}

  strategy: UserCreator;

  async register() {
    return await this.strategy.create({});
  }
}

export { UserCreationStrategy };
