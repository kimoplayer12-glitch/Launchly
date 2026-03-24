import prismaPkg from "@prisma/client";

const PrismaClient = (prismaPkg as unknown as { PrismaClient: any }).PrismaClient;

type PrismaClientType = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClientType;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
