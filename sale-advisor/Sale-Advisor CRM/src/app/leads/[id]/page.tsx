import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LeadDetail from "./LeadDetail";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const lead = await prisma.lead.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, stage: true } },
      conversations: { select: { id: true }, take: 1 },
    },
  });

  if (!lead) notFound();

  const serialized = JSON.parse(JSON.stringify(lead));

  return <LeadDetail lead={serialized} />;
}
