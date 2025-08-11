import TeamHistory from '@/components/team-history';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  return <TeamHistory teamId={resolvedParams.id} />;
}
