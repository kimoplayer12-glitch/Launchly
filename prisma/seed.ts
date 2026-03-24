import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const exampleGraph = {
    nodes: [
      {
        id: "trigger-manual",
        type: "TriggerManual",
        position: { x: 120, y: 120 },
        data: {
          label: "Manual Trigger",
          params: {
            description: "Seed workflow starter",
          },
        },
      },
      {
        id: "http-request",
        type: "CoreHttpRequest",
        position: { x: 420, y: 120 },
        data: {
          label: "Fetch Example",
          params: {
            method: "GET",
            url: "https://jsonplaceholder.typicode.com/posts/1",
          },
        },
      },
      {
        id: "set-fields",
        type: "CoreSetFields",
        position: { x: 720, y: 120 },
        data: {
          label: "Map Fields",
          params: {
            title: "{{ $node[\"http-request\"].output.title }}",
            userId: "{{ $node[\"http-request\"].output.userId }}",
          },
        },
      },
    ],
    edges: [
      {
        id: "e1",
        source: "trigger-manual",
        target: "http-request",
      },
      {
        id: "e2",
        source: "http-request",
        target: "set-fields",
      },
    ],
  };

  const workflow = await prisma.workflow.create({
    data: {
      userId: "seed-user",
      name: "Example Automation",
      status: "PUBLISHED",
      draftGraphJson: exampleGraph,
      webhookSecret: "seed-webhook-secret",
      versions: {
        create: {
          versionNumber: 1,
          graphJson: exampleGraph,
          publishedAt: new Date(),
        },
      },
    },
  });

  console.log("Seeded workflow:", workflow.id);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
