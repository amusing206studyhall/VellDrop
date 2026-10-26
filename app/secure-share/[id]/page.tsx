import ReceiveShare from "@/components/ReceiveShare";

export default async function ReceivePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReceiveShare shareId={id} />;
}
