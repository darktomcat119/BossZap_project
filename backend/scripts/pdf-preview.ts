/* eslint-disable no-console */
/**
 * Standalone preview: renders the new PDF generator with a fixed
 * sample budget + subscriber and writes the bytes to /tmp/preview.pdf
 * so we can eyeball the redesign before deploying.
 *
 * Run from backend/:
 *   npx ts-node -r tsconfig-paths/register scripts/pdf-preview.ts
 */
import * as fs from 'fs';
import { PdfGeneratorService } from '../src/modules/budget/pdf-generator.service';
import { Budget } from '../src/database/entities/budget.entity';
import { Subscriber } from '../src/database/entities/subscriber.entity';

const subscriber = {
  id: 'test-sub',
  phone: '67 9811-4027',
  business_name: 'BossZap',
  owner_name: 'Janete Cleia',
  email: 'dev@bosszap.com.br',
  address: 'Rua Nilo Peçanha, 935 - Vila Almeida - Campo Grande MS',
  preferred_language: 'pt-BR',
  status: 'active',
  logo_url: null,
} as unknown as Subscriber;

const budget = {
  id: 'test-budget-001',
  subscriber_id: 'test-sub',
  document_type: 'budget',
  document_number: 'ORC-001',
  client_name: 'Marcelo Miranda',
  client_phone: null,
  client_email: null,
  client_address: 'Rua Játoba, 416 - Guanandi, Campo Grande MS',
  description: null,
  items: [
    { description: 'Demolição e Remoção', quantity: 1, unit_price: 2500, total: 2500 },
    { description: 'Nivelamento de Piso', quantity: '45m²', unit_price: 45, total: 2025 },
    { description: 'Assentamento de Porcelanato', quantity: '45m²', unit_price: 85, total: 3825 },
    { description: 'Pintura Interna', quantity: '180m²', unit_price: 35, total: 6300 },
    { description: 'Forro de Gesso', quantity: '45m²', unit_price: 110, total: 4950 },
    { description: 'Instalação Elétrica', quantity: 1, unit_price: 3200, total: 3200 },
    { description: 'Reforma de Banheiro', quantity: 2, unit_price: 1800, total: 3600 },
    { description: 'Instalação de Ar Condicionado', quantity: 3, unit_price: 650, total: 1950 },
  ],
  total_amount: 26932.5,
  discount_amount: 1417.5,
  status: 'draft',
  valid_until: null,
  notes: null,
  created_at: new Date('2026-04-26T12:00:00Z'),
  updated_at: new Date('2026-04-26T12:00:00Z'),
} as unknown as Budget;

async function main() {
  const svc = new PdfGeneratorService();
  const buffer = await svc.generateBudgetPdf(budget, subscriber);
  fs.writeFileSync('/tmp/preview.pdf', buffer);
  console.log(`PDF written: /tmp/preview.pdf (${buffer.length} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
