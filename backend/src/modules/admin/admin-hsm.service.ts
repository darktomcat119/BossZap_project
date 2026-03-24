import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HsmTemplate } from '../../database/entities';
import { CreateHsmTemplateDto } from './dto/create-hsm-template.dto';

@Injectable()
export class AdminHsmService {
  constructor(
    @InjectRepository(HsmTemplate)
    private readonly hsmRepo: Repository<HsmTemplate>,
  ) {}

  async findAll(): Promise<HsmTemplate[]> {
    return this.hsmRepo.find({ order: { created_at: 'DESC' } });
  }

  async create(dto: CreateHsmTemplateDto): Promise<HsmTemplate> {
    const template = this.hsmRepo.create(dto);
    return this.hsmRepo.save(template);
  }

  async update(
    id: string,
    dto: Partial<CreateHsmTemplateDto>,
  ): Promise<HsmTemplate> {
    const template = await this.hsmRepo.findOne({ where: { id } });
    if (!template) {
      throw new NotFoundException(`HSM Template ${id} not found`);
    }
    Object.assign(template, dto);
    return this.hsmRepo.save(template);
  }
}
