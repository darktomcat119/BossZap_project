import { Injectable, NotFoundException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AdminUser } from '../../database/entities/admin-user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class AdminProfileService {
  constructor(
    @InjectRepository(AdminUser)
    private readonly adminRepo: Repository<AdminUser>,
  ) {}

  async getProfile(adminId: string) {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) throw new NotFoundException('Admin not found');
    return {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      preferred_language: admin.preferred_language,
      created_at: admin.created_at,
    };
  }

  async updateProfile(adminId: string, data: UpdateProfileDto) {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) throw new NotFoundException('Admin not found');

    if (data.email !== undefined && data.email !== admin.email) {
      const existing = await this.adminRepo.findOne({ where: { email: data.email } });
      if (existing && existing.id !== adminId) {
        throw new ConflictException('Email already in use');
      }
      admin.email = data.email;
    }
    if (data.preferred_language !== undefined) {
      admin.preferred_language = data.preferred_language;
    }

    await this.adminRepo.save(admin);
    return this.getProfile(adminId);
  }

  async changePassword(adminId: string, data: ChangePasswordDto) {
    const admin = await this.adminRepo.findOne({ where: { id: adminId } });
    if (!admin) throw new NotFoundException('Admin not found');

    const ok = await bcrypt.compare(data.current_password, admin.password_hash);
    if (!ok) throw new UnauthorizedException('Current password is incorrect');

    admin.password_hash = await bcrypt.hash(data.new_password, SALT_ROUNDS);
    await this.adminRepo.save(admin);
    return { changed: true };
  }
}
