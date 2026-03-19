import { notFound } from "next/navigation";
import InscriptionForm from "@/components/login/inscription-form";

interface Props {
  searchParams: Promise<{ invite_id?: string }>;
}

export default async function InscriptionPage({ searchParams }: Props) {
  const { invite_id } = await searchParams;

  if (!invite_id || invite_id.trim() === "") {
    notFound();
  }

  return <InscriptionForm />;
}
