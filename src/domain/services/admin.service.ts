import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ServiceError } from '../../lib/service-error';
import {
  GetUsersListDto,
  UsersListDto,
  UserExtendedDto,
  OrderBy,
} from '../dto/admin.dto';

export enum AdminServiceErrors {
  UserDoesNotExists = 'UserDoesNotExists',
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  private async getUserById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne(id);
    if (!user) {
      throw new ServiceError({
        name: AdminServiceErrors.UserDoesNotExists,
      });
    }
    return user;
  }

  async getUsersList({
    orderBy,
    orderByDirection,
    page,
    pageSize,
    searchTerm,
  }: GetUsersListDto): Promise<UsersListDto> {
    const infoFields = [OrderBy.firstName, OrderBy.lastName];
    const orderByCol = infoFields.includes(orderBy)
      ? `info->>'${orderBy}'`
      : orderBy;
    const query = this.usersRepository
      .createQueryBuilder()
      .take(pageSize)
      .skip(pageSize * (page - 1))
      .orderBy(orderByCol, orderByDirection);

    if (searchTerm) {
      const t = `%${searchTerm}%`;
      const searchCols = ['email', `info->>'firstName'`, `info->>'lastName'`];
      searchCols.forEach(c => query.orWhere(`${c} LIKE :t`, { t }));
    }

    const [users, count] = await query.getManyAndCount();

    return {
      page: page,
      totalPages: Math.ceil(count / pageSize),
      totalItems: count,
      users: users.map(u => u.nonSensitive()) as UserExtendedDto[],
    };
  }

  async getUserDetails(userId: string): Promise<UserExtendedDto> {
    const user = await this.getUserById(userId);
    return user.nonSensitive() as UserExtendedDto;
  }

  async blockUser(userId: string): Promise<void> {
    const user = await this.getUserById(userId);
    user.isBlocked = true;
    await this.usersRepository.save(user);
  }

  async unBlockUser(userId: string): Promise<void> {
    const user = await this.getUserById(userId);
    user.isBlocked = false;
    await this.usersRepository.save(user);
  }
}
