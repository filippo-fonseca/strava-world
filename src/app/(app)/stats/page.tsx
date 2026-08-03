import { redirect } from "next/navigation";
import { StatsPage } from "@/components/stats/StatsPage";
import { getSession } from "@/lib/session";

export default async function StatsRoute() {
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
    <StatsPage initialAthlete={athlete} isDemo={Boolean(session.isDemo)} />
  );
}
