import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Budget } from '../../database/entities/budget.entity';
import { Subscriber } from '../../database/entities/subscriber.entity';
import { CreateBudgetDto, BudgetItemDto } from './dto/create-budget.dto';
import { PdfGeneratorService } from './pdf-generator.service';

export interface BudgetFilters {
  documentType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page: number;
  limit: number;
}

export interface PaginatedBudgets {
  budgets: Budget[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepo: Repository<Budget>,
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  async create(subscriberId: string, data: CreateBudgetDto): Promise<Budget> {
    const documentType = data.document_type ?? 'budget';

    const documentNumber = await this.getNextDocumentNumber(
      subscriberId,
      documentType,
    );

    const items = data.items.map((item: BudgetItemDto) => ({
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.quantity * item.unit_price,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    const budget = this.budgetRepo.create({
      subscriber_id: subscriberId,
      document_type: documentType,
      document_number: documentNumber,
      client_name: data.client_name ?? null,
      client_phone: data.client_phone ?? null,
      client_email: data.client_email ?? null,
      description: data.description ?? null,
      items,
      total_amount: totalAmount,
      status: 'draft',
      valid_until: data.valid_until ?? null,
      notes: data.notes ?? null,
    });

    const saved = await this.budgetRepo.save(budget);
    this.logger.log(
      `Budget ${documentNumber} created for subscriber ${subscriberId}`,
    );
    return saved;
  }

  async findAll(
    subscriberId: string,
    filters: BudgetFilters,
  ): Promise<PaginatedBudgets> {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.budgetRepo
      .createQueryBuilder('budget')
      .where('budget.subscriber_id = :subscriberId', {
        subscriberId,
      });

    if (filters.documentType) {
      qb.andWhere('budget.document_type = :documentType', {
        documentType: filters.documentType,
      });
    }

    if (filters.status) {
      qb.andWhere('budget.status = :status', {
        status: filters.status,
      });
    }

    if (filters.startDate && filters.endDate) {
      qb.andWhere('budget.created_at BETWEEN :startDate AND :endDate', {
        startDate: filters.startDate,
        endDate: filters.endDate,
      });
    } else if (filters.startDate) {
      qb.andWhere('budget.created_at >= :startDate', {
        startDate: filters.startDate,
      });
    } else if (filters.endDate) {
      qb.andWhere('budget.created_at <= :endDate', {
        endDate: filters.endDate,
      });
    }

    qb.orderBy('budget.created_at', 'DESC').skip(skip).take(limit);

    const [budgets, total] = await qb.getManyAndCount();

    return {
      budgets,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(subscriberId: string, budgetId: string): Promise<Budget> {
    const budget = await this.budgetRepo.findOne({
      where: { id: budgetId, subscriber_id: subscriberId },
    });

    if (!budget) {
      throw new NotFoundException('Budget not found');
    }

    return budget;
  }

  async updateStatus(
    subscriberId: string,
    budgetId: string,
    status: string,
  ): Promise<Budget> {
    const budget = await this.findById(subscriberId, budgetId);
    budget.status = status;
    return this.budgetRepo.save(budget);
  }

  async generatePdf(subscriberId: string, budgetId: string): Promise<string> {
    const budget = await this.findById(subscriberId, budgetId);

    const subscriber = await this.subscriberRepo.findOne({
      where: { id: subscriberId },
    });

    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }

    const pdfBuffer = await this.pdfGeneratorService.generateBudgetPdf(
      budget,
      subscriber,
    );

    const docNum = budget.document_number ?? budget.id.substring(0, 8);
    const filename = `${docNum}-${Date.now()}.pdf`;

    const pdfUrl = await this.uploadPdfToS3(pdfBuffer, subscriberId, filename);

    budget.pdf_url = pdfUrl;
    await this.budgetRepo.save(budget);

    this.logger.log(`PDF generated for budget ${budgetId}: ${pdfUrl}`);
    return pdfUrl;
  }

  private async getNextDocumentNumber(
    subscriberId: string,
    documentType: string,
  ): Promise<string> {
    const prefix = documentType === 'service_order' ? 'OS' : 'BUD';

    const count = await this.budgetRepo.count({
      where: {
        subscriber_id: subscriberId,
        document_type: documentType,
      },
    });

    const nextNumber = count + 1;
    return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
  }

  private async uploadPdfToS3(
    buffer: Buffer,
    subscriberId: string,
    filename: string,
  ): Promise<string> {
    const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3');

    const s3Region = process.env.AWS_REGION ?? 'sa-east-1';
    const s3Bucket = process.env.AWS_S3_BUCKET ?? 'bosszap-files';

    const key = `subscribers/${subscriberId}/documents/${filename}`;

    const s3 = new S3Client({ region: s3Region });

    await s3.send(
      new PutObjectCommand({
        Bucket: s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: 'application/pdf',
      }),
    );

    return `https://${s3Bucket}.s3.${s3Region}.amazonaws.com/${key}`;
  }
}
