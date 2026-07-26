import { redirect } from "next/navigation";
import { MapExplorer } from "@/components/map/MapExplorer";
import { getSession } from "@/lib/session";

export default async function MapPage() {
  const session = await getSession();

  if (!session.athlete) {
    redirect("/");
  }

  const { accessToken: _a, refreshToken: _r, expiresAt: _e, ...athlete } =
    session.athlete;

  return (
    <MapExplorer
      initialAthlete={athlete}
      isDemo={Boolean(session.isDemo)}
    />
  );
}
