import ManageShare from "@/components/ManageShare";

export default async function ManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ManageShare shareId={id} />;
}
