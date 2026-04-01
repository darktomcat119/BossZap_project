import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const SALT_ROUNDS = 12;

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function tsAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function randomBetween(min: number, max: number): number {
  return Math.round(
    (Math.random() * (max - min) + min) * 100,
  ) / 100;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seedDemo() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [],
    synchronize: false,
  });

  await ds.initialize();
  console.log('Database connected for demo seeding...\n');

  // === 1. Get Plan ===
  let [plan] = await ds.query(
    `SELECT id FROM plans WHERE name = 'Profesional' LIMIT 1`,
  );
  if (!plan) {
    [plan] = await ds.query(
      `INSERT INTO plans (name, price_monthly,
        max_budgets_per_month, max_messages_per_month,
        max_ai_calls_per_month, trial_days)
       VALUES ('Profesional', 29.90, 50, 500, 300, 7)
       RETURNING id`,
    );
    console.log('Plan created: Profesional');
  } else {
    console.log('Plan exists, using it');
  }
  const planId = plan.id;

  // === 2. Admin User ===
  const [existingAdmin] = await ds.query(
    `SELECT id FROM admin_users
     WHERE email = 'admin@bosszap.com' LIMIT 1`,
  );
  if (!existingAdmin) {
    const hash = await bcrypt.hash('BossZap2024!', SALT_ROUNDS);
    await ds.query(
      `INSERT INTO admin_users
        (email, password_hash, role, preferred_language)
       VALUES ($1, $2, 'master', 'es')`,
      ['admin@bosszap.com', hash],
    );
    console.log('Admin: admin@bosszap.com / BossZap2024!');
  }

  // === 3. Main Demo Subscriber ===
  let [sub] = await ds.query(
    `SELECT id FROM subscribers
     WHERE phone = '+5511999990001' LIMIT 1`,
  );
  if (!sub) {
    const hash = await bcrypt.hash('Demo2024!', SALT_ROUNDS);
    [sub] = await ds.query(
      `INSERT INTO subscribers
        (phone, business_name, owner_name, email, address,
         preferred_language, status, password_hash,
         plan_id, onboarding_completed_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
      [
        '+5511999990001',
        'Carlos Pintura Profesional',
        'Carlos Mendez',
        'carlos@demo.bosszap.com',
        'Av. Paulista 1000, Sao Paulo, SP',
        'es',
        'active',
        hash,
        planId,
        tsAgo(45),
      ],
    );
    console.log(
      'Subscriber: carlos@demo.bosszap.com / Demo2024!',
    );
  }
  const subId = sub.id;

  // === 4. Subscription ===
  const [existingSub] = await ds.query(
    `SELECT id FROM subscriptions
     WHERE subscriber_id = $1 LIMIT 1`,
    [subId],
  );
  if (!existingSub) {
    await ds.query(
      `INSERT INTO subscriptions
        (subscriber_id, plan_id, status,
         current_period_start, current_period_end)
       VALUES ($1, $2, 'active', $3, $4)`,
      [subId, planId, daysAgo(15), daysFromNow(15)],
    );
    console.log('Subscription created (active)');
  }

  // === 5. Financial Records (6 months) ===
  const [finCount] = await ds.query(
    `SELECT COUNT(*) as c FROM financial_records
     WHERE subscriber_id = $1`,
    [subId],
  );
  if (parseInt(finCount.c) === 0) {
    const incomeDescs = [
      'Pintura residencial',
      'Pintura comercial',
      'Pintura exterior',
      'Impermeabilizacion',
      'Textura decorativa',
      'Reparacion de paredes',
    ];
    const expenseItems = [
      { desc: 'Pintura latex', cat: 'materials' },
      { desc: 'Rodillos y brochas', cat: 'materials' },
      { desc: 'Cinta de enmascarar', cat: 'materials' },
      { desc: 'Lija y masilla', cat: 'materials' },
      { desc: 'Transporte al trabajo', cat: 'transport' },
      { desc: 'Gasolina', cat: 'transport' },
      { desc: 'Almuerzo en obra', cat: 'food' },
      { desc: 'Escalera nueva', cat: 'tools' },
      { desc: 'Ayudante del dia', cat: 'labor' },
    ];
    const persons = [
      'Sr. Rodriguez', 'Sra. Garcia', 'Sr. Lopez',
      'Empresa ABC', 'Condominio Sol', 'Sr. Martinez',
    ];

    let total = 0;
    for (let m = 5; m >= 0; m--) {
      const base = new Date();
      base.setMonth(base.getMonth() - m);

      const incCount = 4 + Math.floor(Math.random() * 5);
      for (let i = 0; i < incCount; i++) {
        const day = 1 + Math.floor(Math.random() * 27);
        const d = new Date(
          base.getFullYear(), base.getMonth(), day,
        );
        await ds.query(
          `INSERT INTO financial_records
            (subscriber_id, type, amount, description,
             category, reference_person, record_date)
           VALUES ($1,'income',$2,$3,'labor',$4,$5)`,
          [
            subId,
            randomBetween(200, 2500),
            pick(incomeDescs),
            pick(persons),
            d.toISOString().split('T')[0],
          ],
        );
        total++;
      }

      const expCount = 6 + Math.floor(Math.random() * 7);
      for (let i = 0; i < expCount; i++) {
        const day = 1 + Math.floor(Math.random() * 27);
        const d = new Date(
          base.getFullYear(), base.getMonth(), day,
        );
        const exp = pick(expenseItems);
        await ds.query(
          `INSERT INTO financial_records
            (subscriber_id, type, amount, description,
             category, record_date)
           VALUES ($1,'expense',$2,$3,$4,$5)`,
          [
            subId,
            randomBetween(15, 350),
            exp.desc,
            exp.cat,
            d.toISOString().split('T')[0],
          ],
        );
        total++;
      }
    }
    console.log(`Financial records created: ${total}`);
  }

  // === 6. Events ===
  const [evCount] = await ds.query(
    `SELECT COUNT(*) as c FROM events
     WHERE subscriber_id = $1`,
    [subId],
  );
  if (parseInt(evCount.c) === 0) {
    const pastJobs = [
      'Pintura sala - Sr. Rodriguez',
      'Pintura exterior - Condominio Sol',
      'Textura decorativa - Sra. Garcia',
      'Pintura oficina - Empresa ABC',
      'Reparacion pared - Sr. Lopez',
      'Impermeabilizacion - Sr. Martinez',
      'Pintura dormitorio - Sra. Oliveira',
      'Pintura cocina - Sr. Fernandez',
    ];
    for (let i = 0; i < pastJobs.length; i++) {
      await ds.query(
        `INSERT INTO events
          (subscriber_id, title, description, event_date,
           event_time, location, status)
         VALUES ($1,$2,$3,$4,$5,$6,'completed')`,
        [
          subId,
          pastJobs[i],
          'Trabajo completado satisfactoriamente',
          daysAgo(3 + i * 4),
          `${8 + Math.floor(Math.random() * 4)}:00`,
          `Calle ${10 + i * 5}, Sao Paulo`,
        ],
      );
    }

    const upcoming = [
      { t: 'Pintura sala - Sra. Perez', l: 'Av. Brasil 250' },
      { t: 'Textura pared - Sr. Santos', l: 'Rua Augusta 480' },
      { t: 'Pintura exterior - Sr. Almeida', l: 'Los Olivos 33' },
      { t: 'Impermeabilizacion - Cond. Luna', l: 'Libertador 1200' },
      { t: 'Pintura oficina - Tech Corp', l: 'Faria Lima 900' },
    ];
    for (let i = 0; i < upcoming.length; i++) {
      await ds.query(
        `INSERT INTO events
          (subscriber_id, title, description, event_date,
           event_time, location, status)
         VALUES ($1,$2,$3,$4,$5,$6,'scheduled')`,
        [
          subId,
          upcoming[i].t,
          'Presupuesto aceptado por el cliente',
          daysFromNow(1 + i * 2),
          `${9 + i}:00`,
          upcoming[i].l,
        ],
      );
    }

    await ds.query(
      `INSERT INTO events
        (subscriber_id, title, description, event_date,
         event_time, location, status)
       VALUES ($1,$2,$3,$4,$5,$6,'cancelled')`,
      [
        subId,
        'Pintura garaje - Sr. Vidal',
        'Cliente cancelo por viaje',
        daysFromNow(3),
        '14:00',
        'Calle 7 de Septiembre 88',
      ],
    );
    console.log(`Events created: ${pastJobs.length + upcoming.length + 1}`);
  }

  // === 7. Budgets ===
  const [budCount] = await ds.query(
    `SELECT COUNT(*) as c FROM budgets
     WHERE subscriber_id = $1`,
    [subId],
  );
  if (parseInt(budCount.c) === 0) {
    const budgets = [
      {
        type: 'budget', client: 'Sra. Perez',
        phone: '+5511988880001',
        desc: 'Pintura completa sala y comedor',
        items: [
          { description: 'Pintura latex premium (20L)', quantity: 3, unit_price: 85, total: 255 },
          { description: 'Mano de obra (2 dias)', quantity: 2, unit_price: 350, total: 700 },
          { description: 'Materiales auxiliares', quantity: 1, unit_price: 60, total: 60 },
        ],
        total: 1015, status: 'accepted',
      },
      {
        type: 'budget', client: 'Sr. Santos',
        phone: '+5511988880002',
        desc: 'Textura decorativa pared acento',
        items: [
          { description: 'Textura especial (5L)', quantity: 2, unit_price: 120, total: 240 },
          { description: 'Mano de obra especializada', quantity: 1, unit_price: 500, total: 500 },
        ],
        total: 740, status: 'sent',
      },
      {
        type: 'budget', client: 'Sr. Almeida',
        phone: '+5511988880003',
        desc: 'Pintura exterior casa completa',
        items: [
          { description: 'Pintura exterior (20L)', quantity: 5, unit_price: 95, total: 475 },
          { description: 'Impermeabilizante', quantity: 2, unit_price: 110, total: 220 },
          { description: 'Andamio alquiler (3 dias)', quantity: 3, unit_price: 80, total: 240 },
          { description: 'Mano de obra (4 dias)', quantity: 4, unit_price: 350, total: 1400 },
        ],
        total: 2335, status: 'accepted',
      },
      {
        type: 'budget', client: 'Empresa XYZ',
        phone: '+5511988880004',
        desc: 'Pintura oficinas planta baja',
        items: [
          { description: 'Pintura acrilica (20L)', quantity: 8, unit_price: 90, total: 720 },
          { description: 'Mano de obra (5 dias)', quantity: 5, unit_price: 400, total: 2000 },
        ],
        total: 2720, status: 'draft',
      },
      {
        type: 'budget', client: 'Sra. Oliveira',
        phone: '+5511988880005',
        desc: 'Pintura dormitorio matrimonial',
        items: [
          { description: 'Pintura premium (4L)', quantity: 2, unit_price: 65, total: 130 },
          { description: 'Mano de obra (1 dia)', quantity: 1, unit_price: 300, total: 300 },
        ],
        total: 430, status: 'rejected',
      },
      {
        type: 'service_order', client: 'Condominio Sol',
        phone: '+5511988880006',
        desc: 'Pintura area comun - hall y escaleras',
        items: [
          { description: 'Pintura latex (20L)', quantity: 6, unit_price: 85, total: 510 },
          { description: 'Mano de obra (3 dias)', quantity: 6, unit_price: 300, total: 1800 },
        ],
        total: 2310, status: 'accepted',
      },
    ];

    for (let i = 0; i < budgets.length; i++) {
      const b = budgets[i];
      const prefix = b.type === 'budget' ? 'BUD' : 'OS';
      await ds.query(
        `INSERT INTO budgets
          (subscriber_id, document_type, document_number,
           client_name, client_phone, description,
           items, total_amount, status, valid_until)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          subId,
          b.type,
          `${prefix}-${String(i + 1).padStart(3, '0')}`,
          b.client,
          b.phone,
          b.desc,
          JSON.stringify(b.items),
          b.total,
          b.status,
          daysFromNow(15),
        ],
      );
    }
    console.log(`Budgets/Orders created: ${budgets.length}`);
  }

  // === 8. Usage Tracking ===
  const curMonth = new Date();
  curMonth.setDate(1);
  const monthStr = curMonth.toISOString().split('T')[0];

  const [usageCount] = await ds.query(
    `SELECT COUNT(*) as c FROM usage_tracking
     WHERE subscriber_id = $1`,
    [subId],
  );
  if (parseInt(usageCount.c) === 0) {
    await ds.query(
      `INSERT INTO usage_tracking
        (subscriber_id, month, messages_count,
         budgets_count, ai_calls_count)
       VALUES ($1,$2,127,6,89)`,
      [subId, monthStr],
    );
    console.log('Usage tracking created');
  }

  // === 9. More Subscribers (admin dashboard) ===
  const demoSubs = [
    { phone: '+5511999990002', biz: 'Eletrica Silva', name: 'Roberto Silva', email: 'roberto@demo.bosszap.com', st: 'active' },
    { phone: '+5511999990003', biz: 'Maria Beleza', name: 'Maria Fernandez', email: 'maria@demo.bosszap.com', st: 'active' },
    { phone: '+5511999990004', biz: 'Pedro Encanamentos', name: 'Pedro Costa', email: 'pedro@demo.bosszap.com', st: 'active' },
    { phone: '+5511999990005', biz: 'Ana Limpieza Pro', name: 'Ana Souza', email: 'ana@demo.bosszap.com', st: 'suspended' },
    { phone: '+5511999990006', biz: 'Jorge Carpinteria', name: 'Jorge Ramirez', email: 'jorge@demo.bosszap.com', st: 'active' },
    { phone: '+5511999990007', biz: 'Lucia Jardineria', name: 'Lucia Torres', email: 'lucia@demo.bosszap.com', st: 'cancelled' },
    { phone: '+5511999990008', biz: 'Fernando AC Service', name: 'Fernando Lima', email: 'fernando@demo.bosszap.com', st: 'active' },
    { phone: '+5511999990009', biz: 'Marcos Construccion', name: 'Marcos Vidal', email: 'marcos@demo.bosszap.com', st: 'trialing' },
  ];

  for (const s of demoSubs) {
    const [exists] = await ds.query(
      `SELECT id FROM subscribers WHERE phone = $1`,
      [s.phone],
    );
    if (!exists) {
      const onboarded = s.st !== 'trialing'
        ? tsAgo(Math.floor(Math.random() * 60) + 5)
        : null;

      const [created] = await ds.query(
        `INSERT INTO subscribers
          (phone, business_name, owner_name, email,
           preferred_language, status, plan_id,
           onboarding_completed_at)
         VALUES ($1,$2,$3,$4,'es',$5,$6,$7)
         RETURNING id`,
        [s.phone, s.biz, s.name, s.email, s.st, planId, onboarded],
      );

      const subSt = s.st === 'suspended' ? 'past_due'
        : s.st === 'cancelled' ? 'cancelled'
        : s.st === 'trialing' ? 'trialing' : 'active';

      const [subsc] = await ds.query(
        `INSERT INTO subscriptions
          (subscriber_id, plan_id, status,
           trial_ends_at, current_period_start,
           current_period_end)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING id`,
        [
          created.id, planId, subSt,
          subSt === 'trialing' ? daysFromNow(5) : null,
          daysAgo(15), daysFromNow(15),
        ],
      );

      // Payments
      if (subSt !== 'trialing') {
        const pCount = subSt === 'cancelled' ? 2 : 3;
        for (let i = 0; i < pCount; i++) {
          await ds.query(
            `INSERT INTO payments
              (subscription_id, amount, status,
               payment_method, paid_at)
             VALUES ($1, 29.90, $2, $3, $4)`,
            [
              subsc.id,
              subSt === 'past_due' && i === 0
                ? 'failed' : 'succeeded',
              Math.random() > 0.5
                ? 'credit_card' : 'pix',
              subSt === 'past_due' && i === 0
                ? null : tsAgo(i * 30),
            ],
          );
        }
      }

      // Usage
      await ds.query(
        `INSERT INTO usage_tracking
          (subscriber_id, month, messages_count,
           budgets_count, ai_calls_count)
         VALUES ($1,$2,$3,$4,$5)`,
        [
          created.id, monthStr,
          Math.floor(Math.random() * 300) + 20,
          Math.floor(Math.random() * 20),
          Math.floor(Math.random() * 150) + 10,
        ],
      );
    }
  }
  console.log(`Demo subscribers created: ${demoSubs.length}`);

  // === 10. Payments for main subscriber ===
  const [mainSubsc] = await ds.query(
    `SELECT id FROM subscriptions
     WHERE subscriber_id = $1 LIMIT 1`,
    [subId],
  );
  if (mainSubsc) {
    const [pCount] = await ds.query(
      `SELECT COUNT(*) as c FROM payments
       WHERE subscription_id = $1`,
      [mainSubsc.id],
    );
    if (parseInt(pCount.c) === 0) {
      for (let i = 0; i < 3; i++) {
        await ds.query(
          `INSERT INTO payments
            (subscription_id, amount, status,
             payment_method, paid_at)
           VALUES ($1, 29.90, 'succeeded', $2, $3)`,
          [
            mainSubsc.id,
            Math.random() > 0.5 ? 'credit_card' : 'pix',
            tsAgo(i * 30),
          ],
        );
      }
      console.log('Payments created for main subscriber');
    }
  }

  await ds.destroy();

  console.log('\n========================================');
  console.log('  DEMO SEED COMPLETE!');
  console.log('========================================');
  console.log('');
  console.log('  Subscriber Dashboard:');
  console.log('    http://localhost:3001/es/login');
  console.log('    carlos@demo.bosszap.com / Demo2024!');
  console.log('');
  console.log('  Admin Dashboard:');
  console.log('    http://localhost:3002/es/login');
  console.log('    admin@bosszap.com / BossZap2024!');
  console.log('');
  console.log('  Landing Page:');
  console.log('    http://localhost:3003/es');
  console.log('========================================\n');
}

seedDemo().catch((error) => {
  console.error('Demo seed failed:', error);
  process.exit(1);
});
