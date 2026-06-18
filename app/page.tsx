import { getSelectableMeta } from "@/lib/knowledge";
import { Studio } from "@/components/Studio";

export default function Page() {
  const { searchFields, tonalities } = getSelectableMeta();
  return <Studio searchFields={searchFields} tonalities={tonalities} />;
}
