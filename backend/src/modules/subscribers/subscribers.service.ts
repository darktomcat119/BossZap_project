import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Subscriber } from '../../database/entities/subscriber.entity';

/**
 * Canonical form for any phone we store: E.164 digits only, with
 * country code. For Brazilian mobile numbers Meta's WhatsApp API
 * returns the legacy 12-digit form (55 + 2-digit DDD + 8 digits),
 * while registration flows usually have the post-2014 13-digit form
 * (55 + DDD + 9 + 8 digits). We normalize everything to the 13-digit
 * "with 9" form — the real-world canonical number.
 *
 * Non-Brazilian numbers are stripped to digits-only with optional +.
 */
export function normalizePhone(raw: string): string {
  if (!raw) return raw;
  const digits = raw.replace(/[^\d]/g, '');

  // 12-digit Brazilian mobile without the 9 → insert 9 after DDD
  //   55 + DD(11-99) + 8 digits   →   55 + DD + 9 + 8 digits
  // Only for DDDs with mobile prefixes 6-9 (post-2014 mandatory 9).
  if (/^55\d{10}$/.test(digits)) {
    const ddd = digits.slice(2, 4);
    const firstLocal = digits[4];
    if (['6', '7', '8', '9'].includes(firstLocal)) {
      return '55' + ddd + '9' + digits.slice(4);
    }
  }
  return digits;
}

/** Return an array of phone variants to look up: canonical + legacy BR fallback. */
export function phoneLookupVariants(raw: string): string[] {
  const normalized = normalizePhone(raw);
  const variants = new Set<string>([raw, normalized]);
  // If input was 13-digit BR mobile (with 9), also try the legacy 12-digit.
  if (/^55\d{2}9\d{8}$/.test(normalized)) {
    variants.add(normalized.slice(0, 4) + normalized.slice(5));
  }
  // Also include versions with a leading "+"
  [...variants].forEach((v) => variants.add('+' + v));
  return [...variants];
}

@Injectable()
export class SubscribersService {
  constructor(
    @InjectRepository(Subscriber)
    private readonly subscriberRepo: Repository<Subscriber>,
  ) {}

  async findByPhone(phone: string): Promise<Subscriber | null> {
    return this.subscriberRepo.findOne({
      where: { phone: In(phoneLookupVariants(phone)) },
    });
  }

  async findById(id: string): Promise<Subscriber> {
    const subscriber = await this.subscriberRepo.findOne({
      where: { id },
    });
    if (!subscriber) {
      throw new NotFoundException('Subscriber not found');
    }
    return subscriber;
  }

  async findByEmail(email: string): Promise<Subscriber | null> {
    return this.subscriberRepo.findOne({ where: { email } });
  }

  async create(data: Partial<Subscriber>): Promise<Subscriber> {
    const normalized = data.phone
      ? { ...data, phone: normalizePhone(data.phone) }
      : data;
    const subscriber = this.subscriberRepo.create(normalized);
    return this.subscriberRepo.save(subscriber);
  }

  async update(id: string, data: Partial<Subscriber>): Promise<Subscriber> {
    await this.subscriberRepo.update(id, data);
    return this.findById(id);
  }
}
