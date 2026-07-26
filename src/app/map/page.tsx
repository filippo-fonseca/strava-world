import { redirect } from "next/navigation";
import { MapExplorer } from "@/components/map/MapExplorer";
import { getSession } from "@/lib/session";

export default async function MapPage() {
  const session = await getSession();

  if (!session.athlete) {
    redirect("/");
  }

  const athlete = {
    id: session.athlete.id,
    firstname: session.athlete.firstname,
    lastname: session.athlete.lastname,
    profile: session.athlete.profile,
    city: session.athlete.city,
    country: session.athlete.country,
  };

  return (
    <MapExplorer
      initialAthlete={athlete}
      isDemo={Boolean(session.isDemo)}
    />
  );
}
