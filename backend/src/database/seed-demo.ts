import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { dataSourceOptions } from '../config/data-source';

const SALT_ROUNDS = 12;

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function dateOnly(d: Date): string {
  return d.toISOString().split('T')[0];
}

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

async function seedDemo() {
  const dataSource = new DataSource({
    ...dataSourceOptions,
    url: process.env.DATABASE_URL,
  });

  await dataSource.initialize();
  console.log('Database connected for demo seeding...\n');

  // === 1. Plan ===
  const planRepo = dataSource.getRepository('plans');
  let plan = await planRepo.findOne({
    where: { name: 'Profesional' },
  });

  if (!plan) {
    plan = await planRepo.save({
      name: 'Profesional',
      price_monthly: 29.90,
      max_budgets_per_month: 50,
      max_messages_per_month: 500,
      max_ai_calls_per_month: 300,
      trial_days: 7,
      is_active: true,
    });
    console.log('Plan created: Profesional');
  }

  // === 2. Admin User ===
  const adminRepo = dataSource.getRepository('admin_users');
  const existingAdmin = await adminRepo.findOne({
    where: { email: 'admin@bosszap.com' },
  });

  if (!existingAdmin) {
    const hash = await bcrypt.hash('BossZap2024!', SALT_ROUNDS);
    await adminRepo.save({
      email: 'admin@bosszap.com',
      password_hash: hash,
      role: 'master',
      preferred_language: 'es',
    });
    console.log('Admin created: admin@bosszap.com / BossZap2024!');
  }

  // === 3. Demo Subscriber ===
  const subRepo = dataSource.getRepository('subscribers');
  let subscriber = await subRepo.findOne({
    where: { phone: '+5511999990001' },
  });

  if (!subscriber) {
    subscriber = await subRepo.save({
      phone: '+5511999990001',
      business_name: 'Carlos Pintura Profesional',
      owner_name: 'Carlos Mendez',
      email: 'carlos@demo.bosszap.com',
      address: 'Av. Paulista 1000, Sao Paulo, SP',
      preferred_language: 'es',
      status: 'active',
      plan_id: plan.id,
      onboarding_completed_at: daysAgo(45),
    });
    console.log('Demo subscriber created: Carlos Mendez');
  }

  // === 4. Demo Subscriber Login ===
  // So the client can log into the subscriber dashboard
  const subLoginCheck = await dataSource.query(
    `SELECT id FROM subscribers WHERE email = $1`,
    ['carlos@demo.bosszap.com'],
  );

  if (subLoginCheck.length > 0) {
    const hash = await bcrypt.hash('Demo2024!', SALT_ROUNDS);
    await dataSource.query(
      `UPDATE subscribers SET password_hash = $1 WHERE email = $2`,
      [hash, 'carlos@demo.bosszap.com'],
    );
    console.log(
      'Subscriber login: carlos@demo.bosszap.com / Demo2024!',
    );
  }

  // === 5. Subscription ===
  const subscRepo = dataSource.getRepository('subscriptions');
  const existingSub = await subscRepo.findOne({
    where: { subscriber_id: subscriber.id },
  });

  if (!existingSub) {
    await subscRepo.save({
      subscriber_id: subscriber.id,
      plan_id: plan.id,
      status: 'active',
      current_period_start: daysAgo(15),
      current_period_end: daysFromNow(15),
    });
    console.log('Subscription created (active)');
  }

  // === 6. Financial Records (last 6 months) ===
  const finRepo = dataSource.getRepository('financial_records');
  const existingFin = await finRepo.count({
    where: { subscriber_id: subscriber.id },
  });

  if (existingFin === 0) {
    const categories = {
      income: [
        'Pintura residencial',
        'Pintura comercial',
        'Pintura exterior',
        'Impermeabilizacion',
        'Textura decorativa',
        'Reparacion de paredes',
      ],
      expense: [
        { desc: 'Pintura latex', cat: 'materials' },
        { desc: 'Rodillos y brochas', cat: 'materials' },
        { desc: 'Cinta de enmascarar', cat: 'materials' },
        { desc: 'Lija y masilla', cat: 'materials' },
        { desc: 'Transporte al trabajo', cat: 'transport' },
        { desc: 'Gasolina', cat: 'transport' },
        { desc: 'Almuerzo en obra', cat: 'food' },
        { desc: 'Escalera nueva', cat: 'tools' },
        { desc: 'Ayudante del dia', cat: 'labor' },
      ],
    };

    const records: Array<Record<string, unknown>> = [];

    for (let monthsAgo = 5; monthsAgo >= 0; monthsAgo--) {
      const baseDate = new Date();
      baseDate.setMonth(baseDate.getMonth() - monthsAgo);

      // 4-8 income records per month
      const incomeCount = 4 + Math.floor(Math.random() * 5);
      for (let i = 0; i < incomeCount; i++) {
        const day = 1 + Math.floor(Math.random() * 27);
        const d = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          day,
        );
        const desc =
          categories.income[
            Math.floor(Math.random() * categories.income.length)
          ];
        const persons = [
          'Sr. Rodriguez',
          'Sra. Garcia',
          'Sr. Lopez',
          'Empresa ABC',
          'Condominio Sol',
          'Sr. Martinez',
          'Sra. Oliveira',
        ];

        records.push({
          subscriber_id: subscriber.id,
          type: 'income',
          amount: randomBetween(200, 2500),
          description: desc,
          category: 'labor',
          reference_person:
            persons[Math.floor(Math.random() * persons.length)],
          record_date: dateOnly(d),
        });
      }

      // 6-12 expense records per month
      const expenseCount = 6 + Math.floor(Math.random() * 7);
      for (let i = 0; i < expenseCount; i++) {
        const day = 1 + Math.floor(Math.random() * 27);
        const d = new Date(
          baseDate.getFullYear(),
          baseDate.getMonth(),
          day,
        );
        const exp =
          categories.expense[
            Math.floor(Math.random() * categories.expense.length)
          ];

        records.push({
          subscriber_id: subscriber.id,
          type: 'expense',
          amount: randomBetween(15, 350),
          description: exp.desc,
          category: exp.cat,
          record_date: dateOnly(d),
        });
      }
    }

    await finRepo.save(records);
    console.log(`Financial records created: ${records.length}`);
  }

  // === 7. Events (past + upcoming) ===
  const eventRepo = dataSource.getRepository('events');
  const existingEvents = await eventRepo.count({
    where: { subscriber_id: subscriber.id },
  });

  if (existingEvents === 0) {
    const events: Array<Record<string, unknown>> = [];

    // Past completed events
    const pastJobs = [
      'Pintura sala - Sr. Rodriguez',
      'Pintura exterior - Condominio Sol',
      'Textura decorativa - Sra. Garcia',
      'Pintura oficina - Empresa ABC',
      'Reparacion pared - Sr. Lopez',
      'Impermeabilizacion terraza - Sr. Martinez',
      'Pintura dormitorio - Sra. Oliveira',
      'Pintura cocina - Sr. Fernandez',
    ];

    for (let i = 0; i < pastJobs.length; i++) {
      events.push({
        subscriber_id: subscriber.id,
        title: pastJobs[i],
        description: 'Trabajo completado satisfactoriamente',
        event_date: dateOnly(daysAgo(3 + i * 4)),
        event_time: `${8 + Math.floor(Math.random() * 4)}:00`,
        location: `Calle ${10 + i * 5}, Sao Paulo`,
        status: 'completed',
      });
    }

    // Upcoming scheduled events
    const upcomingJobs = [
      {
        title: 'Pintura sala completa - Sra. Perez',
        loc: 'Av. Brasil 250, Apt 12',
      },
      {
        title: 'Textura pared acento - Sr. Santos',
        loc: 'Rua Augusta 480',
      },
      {
        title: 'Pintura exterior casa - Sr. Almeida',
        loc: 'Calle Los Olivos 33',
      },
      {
        title: 'Impermeabilizacion - Condominio Luna',
        loc: 'Av. Libertador 1200',
      },
      {
        title: 'Pintura oficina corporativa - Tech Corp',
        loc: 'Av. Faria Lima 900, Piso 5',
      },
    ];

    for (let i = 0; i < upcomingJobs.length; i++) {
      events.push({
        subscriber_id: subscriber.id,
        title: upcomingJobs[i].title,
        description: 'Presupuesto aceptado por el cliente',
        event_date: dateOnly(daysFromNow(1 + i * 2)),
        event_time: `${9 + i}:00`,
        location: upcomingJobs[i].loc,
        status: 'scheduled',
      });
    }

    // One cancelled event
    events.push({
      subscriber_id: subscriber.id,
      title: 'Pintura garaje - Sr. Vidal (cancelado)',
      description: 'Cliente cancelo por viaje',
      event_date: dateOnly(daysFromNow(3)),
      event_time: '14:00',
      location: 'Calle 7 de Septiembre 88',
      status: 'cancelled',
    });

    await eventRepo.save(events);
    console.log(`Events created: ${events.length}`);
  }

  // === 8. Budgets / Service Orders ===
  const budgetRepo = dataSource.getRepository('budgets');
  const existingBudgets = await budgetRepo.count({
    where: { subscriber_id: subscriber.id },
  });

  if (existingBudgets === 0) {
    const budgets: Array<Record<string, unknown>> = [
      {
        subscriber_id: subscriber.id,
        document_type: 'budget',
        client_name: 'Sra. Perez',
        client_phone: '+5511988880001',
        description: 'Pintura completa sala y comedor',
        items: JSON.stringify([
          {
            description: 'Pintura latex premium (20L)',
            quantity: 3,
            unit_price: 85.0,
            total: 255.0,
          },
          {
            description: 'Mano de obra (2 dias)',
            quantity: 2,
            unit_price: 350.0,
            total: 700.0,
          },
          {
            description: 'Materiales auxiliares',
            quantity: 1,
            unit_price: 60.0,
            total: 60.0,
          },
        ]),
        total_amount: 1015.0,
        status: 'accepted',
        valid_until: dateOnly(daysFromNow(15)),
        notes: 'Incluye limpieza final',
      },
      {
        subscriber_id: subscriber.id,
        document_type: 'budget',
        client_name: 'Sr. Santos',
        client_phone: '+5511988880002',
        description: 'Textura decorativa pared acento',
        items: JSON.stringify([
          {
            description: 'Textura especial (5L)',
            quantity: 2,
            unit_price: 120.0,
            total: 240.0,
          },
          {
            description: 'Mano de obra especializada',
            quantity: 1,
            unit_price: 500.0,
            total: 500.0,
          },
        ]),
        total_amount: 740.0,
        status: 'sent',
        valid_until: dateOnly(daysFromNow(10)),
      },
      {
        subscriber_id: subscriber.id,
        document_type: 'budget',
        client_name: 'Sr. Almeida',
        client_phone: '+5511988880003',
        description: 'Pintura exterior casa completa',
        items: JSON.stringify([
          {
            description: 'Pintura exterior (20L)',
            quantity: 5,
            unit_price: 95.0,
            total: 475.0,
          },
          {
            description: 'Impermeabilizante',
            quantity: 2,
            unit_price: 110.0,
            total: 220.0,
          },
          {
            description: 'Andamio alquiler (3 dias)',
            quantity: 3,
            unit_price: 80.0,
            total: 240.0,
          },
          {
            description: 'Mano de obra (4 dias)',
            quantity: 4,
            unit_price: 350.0,
            total: 1400.0,
          },
        ]),
        total_amount: 2335.0,
        status: 'accepted',
        valid_until: dateOnly(daysFromNow(12)),
      },
      {
        subscriber_id: subscriber.id,
        document_type: 'budget',
        client_name: 'Empresa XYZ',
        client_phone: '+5511988880004',
        client_email: 'compras@xyz.com',
        description: 'Pintura oficinas planta baja',
        items: JSON.stringify([
          {
            description: 'Pintura acrilica (20L)',
            quantity: 8,
            unit_price: 90.0,
            total: 720.0,
          },
          {
            description: 'Mano de obra (5 dias)',
            quantity: 5,
            unit_price: 400.0,
            total: 2000.0,
          },
          {
            description: 'Materiales auxiliares',
            quantity: 1,
            unit_price: 150.0,
            total: 150.0,
          },
        ]),
        total_amount: 2870.0,
        status: 'draft',
        valid_until: dateOnly(daysFromNow(15)),
      },
      {
        subscriber_id: subscriber.id,
        document_type: 'budget',
        client_name: 'Sra. Oliveira',
        client_phone: '+5511988880005',
        description: 'Pintura dormitorio matrimonial',
        items: JSON.stringify([
          {
            description: 'Pintura premium colores (4L)',
            quantity: 2,
            unit_price: 65.0,
            total: 130.0,
          },
          {
            description: 'Mano de obra (1 dia)',
            quantity: 1,
            unit_price: 300.0,
            total: 300.0,
          },
        ]),
        total_amount: 430.0,
        status: 'rejected',
        valid_until: dateOnly(daysAgo(5)),
        notes: 'Cliente opto por otro presupuesto',
      },

      // Service Orders
      {
        subscriber_id: subscriber.id,
        document_type: 'service_order',
        client_name: 'Condominio Sol',
        client_phone: '+5511988880006',
        client_email: 'admin@condominiosol.com',
        description:
          'Pintura area comun - hall y escaleras',
        items: JSON.stringify([
          {
            description: 'Pintura latex (20L)',
            quantity: 6,
            unit_price: 85.0,
            total: 510.0,
          },
          {
            description: 'Mano de obra (3 dias, 2 pintores)',
            quantity: 6,
            unit_price: 300.0,
            total: 1800.0,
          },
          {
            description: 'Proteccion pisos y muebles',
            quantity: 1,
            unit_price: 100.0,
            total: 100.0,
          },
        ]),
        total_amount: 2410.0,
        status: 'accepted',
        valid_until: dateOnly(daysFromNow(30)),
        notes: 'Horario: 8h-17h, sin fines de semana',
      },
    ];

    await budgetRepo.save(budgets);
    console.log(`Budgets/Orders created: ${budgets.length}`);
  }

  // === 9. Usage Tracking ===
  const usageRepo = dataSource.getRepository('usage_tracking');
  const existingUsage = await usageRepo.count({
    where: { subscriber_id: subscriber.id },
  });

  if (existingUsage === 0) {
    const currentMonth = new Date();
    currentMonth.setDate(1);

    await usageRepo.save({
      subscriber_id: subscriber.id,
      month: dateOnly(currentMonth),
      messages_count: 127,
      budgets_count: 6,
      ai_calls_count: 89,
    });
    console.log('Usage tracking created for current month');
  }

  // === 10. More demo subscribers for admin dashboard ===
  const demoSubs = [
    {
      phone: '+5511999990002',
      business_name: 'Eletrica Silva',
      owner_name: 'Roberto Silva',
      email: 'roberto@demo.bosszap.com',
      status: 'active',
    },
    {
      phone: '+5511999990003',
      business_name: 'Maria Beleza',
      owner_name: 'Maria Fernandez',
      email: 'maria@demo.bosszap.com',
      status: 'active',
    },
    {
      phone: '+5511999990004',
      business_name: 'Pedro Encanamentos',
      owner_name: 'Pedro Costa',
      email: 'pedro@demo.bosszap.com',
      status: 'active',
    },
    {
      phone: '+5511999990005',
      business_name: 'Ana Limpieza Pro',
      owner_name: 'Ana Souza',
      email: 'ana@demo.bosszap.com',
      status: 'suspended',
    },
    {
      phone: '+5511999990006',
      business_name: 'Jorge Carpinteria',
      owner_name: 'Jorge Ramirez',
      email: 'jorge@demo.bosszap.com',
      status: 'active',
    },
    {
      phone: '+5511999990007',
      business_name: 'Lucia Jardineria',
      owner_name: 'Lucia Torres',
      email: 'lucia@demo.bosszap.com',
      status: 'cancelled',
    },
    {
      phone: '+5511999990008',
      business_name: 'Fernando AC Service',
      owner_name: 'Fernando Lima',
      email: 'fernando@demo.bosszap.com',
      status: 'active',
    },
    {
      phone: '+5511999990009',
      business_name: 'Marcos Construccion',
      owner_name: 'Marcos Vidal',
      email: 'marcos@demo.bosszap.com',
      status: 'trialing',
    },
  ];

  for (const sub of demoSubs) {
    const exists = await subRepo.findOne({
      where: { phone: sub.phone },
    });
    if (!exists) {
      const created = await subRepo.save({
        ...sub,
        preferred_language: 'es',
        plan_id: plan.id,
        onboarding_completed_at:
          sub.status !== 'trialing'
            ? daysAgo(Math.floor(Math.random() * 60) + 5)
            : null,
      });

      // Create subscription for each
      const subStatus =
        sub.status === 'suspended'
          ? 'past_due'
          : sub.status === 'cancelled'
            ? 'cancelled'
            : sub.status === 'trialing'
              ? 'trialing'
              : 'active';

      await subscRepo.save({
        subscriber_id: created.id,
        plan_id: plan.id,
        status: subStatus,
        trial_ends_at:
          subStatus === 'trialing' ? daysFromNow(5) : null,
        current_period_start: daysAgo(15),
        current_period_end: daysFromNow(15),
      });

      // Usage tracking
      const currentMonth = new Date();
      currentMonth.setDate(1);
      await usageRepo.save({
        subscriber_id: created.id,
        month: dateOnly(currentMonth),
        messages_count:
          Math.floor(Math.random() * 300) + 20,
        budgets_count: Math.floor(Math.random() * 20),
        ai_calls_count:
          Math.floor(Math.random() * 150) + 10,
      });
    }
  }
  console.log(`Demo subscribers created: ${demoSubs.length}`);

  // === 11. Payments for admin dashboard ===
  const paymentRepo = dataSource.getRepository('payments');
  const allSubs = await subscRepo.find();

  for (const sub of allSubs) {
    const existingPayments = await paymentRepo.count({
      where: { subscription_id: sub.id },
    });
    if (existingPayments === 0 && sub.status !== 'trialing') {
      const paymentCount =
        sub.status === 'cancelled' ? 2 : 3;
      for (let i = 0; i < paymentCount; i++) {
        await paymentRepo.save({
          subscription_id: sub.id,
          amount: 29.90,
          status:
            sub.status === 'past_due' && i === 0
              ? 'failed'
              : 'succeeded',
          payment_method:
            Math.random() > 0.5 ? 'credit_card' : 'pix',
          paid_at:
            sub.status === 'past_due' && i === 0
              ? null
              : daysAgo(i * 30),
        });
      }
    }
  }
  console.log('Payment records created for all subscribers');

  await dataSource.destroy();

  console.log('\n========================================');
  console.log('  DEMO SEED COMPLETE!');
  console.log('========================================');
  console.log('');
  console.log('  Subscriber Dashboard Login:');
  console.log('    URL:      http://localhost:3001/es/login');
  console.log('    Email:    carlos@demo.bosszap.com');
  console.log('    Password: Demo2024!');
  console.log('');
  console.log('  Admin Dashboard Login:');
  console.log('    URL:      http://localhost:3002/es/login');
  console.log('    Email:    admin@bosszap.com');
  console.log('    Password: BossZap2024!');
  console.log('');
  console.log('  Landing Page:');
  console.log('    URL:      http://localhost:3003/es');
  console.log('========================================\n');
}

seedDemo().catch((error) => {
  console.error('Demo seed failed:', error);
  process.exit(1);
});
