import { getVendorDetails, VendorDetails } from "@/lib/queryHelpers";
import { VendorsClient } from "@/components/VendorsClient";

export default async function VendorsPage() {
  let vendors: VendorDetails[] = [];

  try {
    vendors = await getVendorDetails();
  } catch (error) {
    console.error("Error fetching vendors:", error);
  }

  return <VendorsClient initialVendors={vendors} />;
}
