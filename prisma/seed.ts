// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database…");

  // Create demo user
  const password = await bcrypt.hash("demo1234", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@projectgoalie.com" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@projectgoalie.com",
      password,
    },
  });

  console.log("✅ Created user:", user.email);

  // Create budget
  await prisma.budget.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      monthlyLimit: 100,
      alertAt: 0.9,
    },
  });

  // Create goals
  const [careerGoal, eduGoal] = await Promise.all([
    prisma.goal.create({
      data: {
        userId: user.id,
        title: "Get a software engineering internship",
        category: "CAREER",
        description: "Land an internship at a tech company by summer",
      },
    }),
    prisma.goal.create({
      data: {
        userId: user.id,
        title: "Learn full-stack development",
        category: "EDUCATION",
        description: "Complete online courses and build 3 projects",
      },
    }),
  ]);

  // Create subscriptions
  const now = new Date();
  const inDays = (d: number) => new Date(now.getTime() + d * 86400000);

  const subs = [
    { name: "Netflix",         cost: 15.99, category: "STREAMING",    billingCycle: "MONTHLY",  renewalDate: inDays(3),  usageLevel: "WEEKLY" },
    { name: "Spotify",         cost: 9.99,  category: "STREAMING",    billingCycle: "MONTHLY",  renewalDate: inDays(12), usageLevel: "DAILY"  },
    { name: "GitHub Pro",      cost: 4,     category: "SOFTWARE",     billingCycle: "MONTHLY",  renewalDate: inDays(7),  usageLevel: "DAILY", goalId: careerGoal.id },
    { name: "Udemy",           cost: 29.99, category: "EDUCATION",    billingCycle: "MONTHLY",  renewalDate: inDays(18), usageLevel: "WEEKLY", goalId: eduGoal.id },
    { name: "LinkedIn Premium",cost: 39.99, category: "FINANCE",      billingCycle: "MONTHLY",  renewalDate: inDays(5),  usageLevel: "RARELY", goalId: careerGoal.id },
    { name: "Hulu",            cost: 17.99, category: "STREAMING",    billingCycle: "MONTHLY",  renewalDate: inDays(22), usageLevel: "NEVER"  },
    { name: "Adobe CC",        cost: 54.99, category: "SOFTWARE",     billingCycle: "MONTHLY",  renewalDate: inDays(15), usageLevel: "DAILY"  },
    { name: "Gym Membership",  cost: 40,    category: "FITNESS",      billingCycle: "MONTHLY",  renewalDate: inDays(1),  usageLevel: "RARELY" },
  ];

  for (const sub of subs) {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        name: sub.name,
        cost: sub.cost,
        category: sub.category as any,
        billingCycle: sub.billingCycle as any,
        renewalDate: sub.renewalDate,
        usageLevel: sub.usageLevel as any,
        goalId: (sub as any).goalId ?? null,
        notifyDaysBefore: 3,
      },
    });
    console.log("  ✅ Subscription:", sub.name);
  }

  // Upcoming notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: user.id,
        type: "RENEWAL_REMINDER",
        title: "Netflix renews in 3 days",
        message: "Your Netflix subscription will renew for $15.99. Still worth it?",
        scheduledFor: new Date(),
      },
      {
        userId: user.id,
        type: "RARELY_USED_ALERT",
        title: "Rarely using Hulu?",
        message: "You marked Hulu as never used. Cancel to save $17.99/month.",
        scheduledFor: new Date(),
      },
    ],
  });

  console.log("✅ Seed complete!");
  console.log("👤 Login: demo@projectgoalie.com / demo1234");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
