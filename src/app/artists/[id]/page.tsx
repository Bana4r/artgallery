import ArtistDetailClient from './ArtistDetailClient';

interface ArtistDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ArtistDetailPage({ params }: ArtistDetailPageProps) {
  const resolvedParams = await params;
  const artistId = resolvedParams.id;

  if (!artistId) {
    throw new Error('Artist ID is missing');
  }

  return <ArtistDetailClient id={artistId} />;
}