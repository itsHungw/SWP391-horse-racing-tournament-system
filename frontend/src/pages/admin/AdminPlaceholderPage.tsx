import { AdminLayout } from "../../layouts/AdminLayout";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

type AdminPlaceholderPageProps = {
  title: string;
  description: string;
};

export function AdminPlaceholderPage({ title, description }: AdminPlaceholderPageProps) {
  useDocumentTitle(`${title} admin`);

  return (
    <AdminLayout>
      <section aria-labelledby="admin-placeholder-title" className="rounded-lg border border-[#d8d8d8] bg-white p-8">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-[#b3193a]">
          Admin workspace
        </p>
        <h1 id="admin-placeholder-title" className="mt-2 text-4xl font-black tracking-tight">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p>
        <p className="mt-6 max-w-2xl text-sm font-bold text-slate-500">
          This admin section is reserved for the next implementation slice.
        </p>
      </section>
    </AdminLayout>
  );
}
