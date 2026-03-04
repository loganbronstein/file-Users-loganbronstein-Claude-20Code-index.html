import { notFound } from "next/navigation";
import { getListingById } from "@/lib/queries";
import ListingDetail from "./ListingDetail";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ListingDetailPage({ params }: Props) {
  const { id } = await params;
  const listing = await getListingById(id);

  if (!listing) notFound();

  const serialized = JSON.parse(JSON.stringify(listing));
  return <ListingDetail listing={serialized} />;
}
