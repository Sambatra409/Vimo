import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPropertyForOwner } from "@/lib/actions/properties-crud";
import { PropertyForm } from "@/components/property-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPropertyPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/property/${id}/edit`);

  const property = await getPropertyForOwner(id);
  if (!property) notFound();

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <PropertyForm
        initial={{
          id: property.id,
          title: property.title,
          description: property.description,
          property_type: property.property_type,
          listing_type: property.listing_type,
          price: property.price,
          surface: property.surface,
          rooms: property.rooms,
          address: property.address,
          city: property.city,
          postal_code: property.postal_code,
          photos: property.photos,
        }}
      />
    </div>
  );
}
