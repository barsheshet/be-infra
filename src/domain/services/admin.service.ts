import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { ServiceError } from '../../lib/service-error';
import { RedisProvider, RedisPrefix } from '../providers/redis.provider';
import * as moment from 'moment';
import {
  GetUsersListDto,
  UsersListDto,
  UserExtendedDto,
  OrderBy,
  BlockUserDto,
} from '../dto/admin.dto';

export enum AdminServiceErrors {
  UserDoesNotExists = 'UserDoesNotExists',
}

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly redis: RedisProvider,
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

    const [roles, blocks] = await Promise.all([
      this.redis.mget(users.map(u => `${RedisPrefix.Role}:${u.id}`)),
      this.redis.mget(users.map(u => `${RedisPrefix.BlockedUser}:${u.id}`)),
    ]);

    const usersExtended = users.map((u, i) => {
      return {
        ...u.nonSensitive(),
        role: roles[i],
        block: blocks[i],
      };
    });

    return {
      page: page,
      totalPages: Math.ceil(count / pageSize),
      totalItems: count,
      users: usersExtended as UserExtendedDto[],
    };
  }

  async getUserDetails(userId: string): Promise<UserExtendedDto> {
    const user = await this.getUserById(userId);

    const [role, block] = await Promise.all([
      this.redis.get(`${RedisPrefix.Role}:${user.id}`),
      this.redis.get(`${RedisPrefix.BlockedUser}:${user.id}`),
    ]);

    return {
      ...user.nonSensitive(),
      role,
      block,
    } as UserExtendedDto;
  }

  async blockUser({ userId, expiration }: BlockUserDto): Promise<void> {
    const user = await this.getUserById(userId);
    const key = `${RedisPrefix.BlockedUser}:${user.id}`;
    const utc = moment(expiration).utc();
    await this.redis.set(key, utc.format());
    await this.redis.expireat(key, utc.unix());
  }

  async unBlockUser(userId: string): Promise<void> {
    const user = await this.getUserById(userId);
    const key = `${RedisPrefix.BlockedUser}:${user.id}`;
    await this.redis.del(key);
  }
}
