import Link from "next/link";
import { getAllListings } from "@/lib/queries";
import ListingsView from "./ListingsView";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ tab?: string }>;
}

export default async function ListingsPage({ searchParams }: Props) {
  const { tab } = await searchParams;
  const listings = await getAllListings();
  const serialized = JSON.parse(JSON.stringify(listings));

  return (
    <>
      <div className="header">
        <div>
          <h1>Listings</h1>
          <div className="header-subtitle">{listings.length} listing{listings.length !== 1 ? "s" : ""}</div>
        </div>
        <Link
          href="/listings/new"
          style={{
            padding: "10px 20px",
            borderRadius: 8,
            background: "var(--accent)",
            color: "#fff",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          + New Listing
        </Link>
      </div>

      <ListingsView listings={serialized} initialTab={tab} />
    </>
  );
}
