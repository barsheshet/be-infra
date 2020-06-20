import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ServiceError } from '../../lib/service-error';
import { RedisProvider } from '../providers/redis.provider';
import {
  GetUsersListDto,
  UsersListDto,
  UserDto,
  OrderBy,
} from '../dto/admin.dto';

export enum AdminServiceErrors {}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly redis: RedisProvider,
  ) {}

  async getUsersList(options: GetUsersListDto): Promise<UsersListDto> {
    const orderBy = [OrderBy.firstName, OrderBy.lastName].includes(
      options.orderBy,
    )
      ? `info->>'${options.orderBy}'`
      : options.orderBy;
    const query = this.usersRepository
      .createQueryBuilder()
      .take(options.pageSize)
      .skip(options.pageSize * (options.page - 1))
      .orderBy(
        orderBy,
        options.orderByDirection,
      );

    if (options.searchTerm) {
      const t = `%${options.searchTerm}%`;
      ['email', `info->>'firstName'`, `info->>'lastName'`].forEach(c =>
        query.orWhere(`${c} LIKE :t`, { t }),
      );
    }

    const [users, count] = await query.getManyAndCount();

    return {
      page: options.page,
      totalPages: Math.ceil(count / options.pageSize),
      totalItems: count,
      users: users.map(u => u.nonSensitive() as UserDto),
    };
  }
}
