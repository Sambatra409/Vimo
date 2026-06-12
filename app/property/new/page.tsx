import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { PropertyForm } from "@/components/property-form";

export default async function NewPropertyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/property/new");
  if (!user.roles.includes("proprietaire") && !user.roles.includes("admin"))
    redirect("/dashboard/tenant");

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <PropertyForm />
    </div>
  );
}
