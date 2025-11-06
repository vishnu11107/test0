import { MeetingDetails } from '@/components/meetings';

interface MeetingDetailsPageProps {
  params: {
    id: string;
  };
}

export default function MeetingDetailsPage({ params }: MeetingDetailsPageProps) {
  return <MeetingDetails meetingId={params.id} />;
}
