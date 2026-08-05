import { DisplayView } from "@/components/DisplayView";

export default async function DisplayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DisplayView tournamentId={id} />;
}
