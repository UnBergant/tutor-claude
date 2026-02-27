import { redirect } from "next/navigation";
import { generateModuleProposals } from "@/modules/lesson/actions";
import { ModuleSelection } from "@/modules/lesson/components/module-selection";
import { auth } from "@/shared/lib/auth";

export default async function ModulesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const modules = await generateModuleProposals();

  return <ModuleSelection modules={modules} />;
}
