import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { dataSourceOptions } from '../config/data-source';

const SALT_ROUNDS = 12;

async function seed() {
  const dataSource = new DataSource({
    ...dataSourceOptions,
    url: process.env.DATABASE_URL,
  });

  await dataSource.initialize();
  console.log('Database connected for seeding...');

  // --- 1. Default Plan ---
  const planRepo = dataSource.getRepository('plans');
  const existingPlan = await planRepo.findOne({
    where: { name: 'Profesional' },
  });

  let planId: string;

  if (!existingPlan) {
    const plan = await planRepo.save({
      name: 'Profesional',
      price_monthly: 29.90,
      max_budgets_per_month: 50,
      max_messages_per_month: 500,
      max_ai_calls_per_month: 300,
      trial_days: 7,
      is_active: true,
    });
    planId = plan.id;
    console.log('Default plan created: Profesional ($29.90/mo)');
  } else {
    planId = existingPlan.id;
    console.log('Default plan already exists, skipping.');
  }

  // --- 2. Admin User ---
  const adminRepo = dataSource.getRepository('admin_users');
  const existingAdmin = await adminRepo.findOne({
    where: { email: 'admin@bosszap.com' },
  });

  if (!existingAdmin) {
    const password = process.env.ADMIN_PASSWORD || 'BossZap2024!';
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    await adminRepo.save({
      email: 'admin@bosszap.com',
      password_hash: hash,
      role: 'master',
      preferred_language: 'es',
    });
    console.log('Admin user created: admin@bosszap.com');
    console.log(
      `  Password: ${password} (change this immediately!)`,
    );
  } else {
    console.log('Admin user already exists, skipping.');
  }

  // --- 3. HSM Templates ---
  const hsmRepo = dataSource.getRepository('hsm_templates');
  const existingTemplates = await hsmRepo.count();

  if (existingTemplates === 0) {
    const templates = [
      // Payment recovery
      {
        template_name: 'payment_recovery_reminder',
        language: 'es',
        category: 'payment_recovery',
        body_text:
          'Hola {{1}}, notamos que tu pago no se proceso. ' +
          'Actualiza tu metodo de pago aqui: {{2}}',
        meta_status: 'pending',
      },
      {
        template_name: 'payment_recovery_reminder',
        language: 'en',
        category: 'payment_recovery',
        body_text:
          'Hi {{1}}, we noticed your payment did not go through. ' +
          'Update your payment method here: {{2}}',
        meta_status: 'pending',
      },
      {
        template_name: 'payment_recovery_reminder',
        language: 'pt_BR',
        category: 'payment_recovery',
        body_text:
          'Ola {{1}}, notamos que seu pagamento nao foi processado. ' +
          'Atualize seu metodo de pagamento aqui: {{2}}',
        meta_status: 'pending',
      },

      // Welcome message
      {
        template_name: 'welcome_message',
        language: 'es',
        category: 'notification',
        body_text:
          'Bienvenido a BossZap, {{1}}! Tu asistente de negocios ' +
          'esta listo. Envia un mensaje para empezar.',
        meta_status: 'pending',
      },
      {
        template_name: 'welcome_message',
        language: 'en',
        category: 'notification',
        body_text:
          'Welcome to BossZap, {{1}}! Your business assistant ' +
          'is ready. Send a message to get started.',
        meta_status: 'pending',
      },
      {
        template_name: 'welcome_message',
        language: 'pt_BR',
        category: 'notification',
        body_text:
          'Bem-vindo ao BossZap, {{1}}! Seu assistente de negocios ' +
          'esta pronto. Envie uma mensagem para comecar.',
        meta_status: 'pending',
      },

      // Agenda reminder
      {
        template_name: 'agenda_reminder',
        language: 'es',
        category: 'reminder',
        body_text:
          'Recordatorio: tienes "{{1}}" programado para ' +
          '{{2}} a las {{3}}.',
        meta_status: 'pending',
      },
      {
        template_name: 'agenda_reminder',
        language: 'en',
        category: 'reminder',
        body_text:
          'Reminder: you have "{{1}}" scheduled for ' +
          '{{2}} at {{3}}.',
        meta_status: 'pending',
      },
      {
        template_name: 'agenda_reminder',
        language: 'pt_BR',
        category: 'reminder',
        body_text:
          'Lembrete: voce tem "{{1}}" agendado para ' +
          '{{2}} as {{3}}.',
        meta_status: 'pending',
      },

      // Budget ready
      {
        template_name: 'budget_ready',
        language: 'es',
        category: 'notification',
        body_text:
          'Tu presupuesto {{1}} esta listo. ' +
          'Descargalo aqui: {{2}}',
        meta_status: 'pending',
      },
      {
        template_name: 'budget_ready',
        language: 'en',
        category: 'notification',
        body_text:
          'Your quote {{1}} is ready. Download it here: {{2}}',
        meta_status: 'pending',
      },
      {
        template_name: 'budget_ready',
        language: 'pt_BR',
        category: 'notification',
        body_text:
          'Seu orcamento {{1}} esta pronto. ' +
          'Baixe aqui: {{2}}',
        meta_status: 'pending',
      },
    ];

    await hsmRepo.save(templates);
    console.log(
      `HSM templates created: ${templates.length} templates ` +
        '(4 types x 3 languages)',
    );
  } else {
    console.log('HSM templates already exist, skipping.');
  }

  await dataSource.destroy();
  console.log('\nSeed complete!');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
