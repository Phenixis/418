import ConnexionForm from "@/components/login/connexion-form";

interface Props {
  searchParams: Promise<{ invite_id?: string }>;
}

export default async function ConnexionPage({ searchParams }: Readonly<Props>) {
  return <ConnexionForm />;
}
