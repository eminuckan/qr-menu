import CategoryDetail from "@/components/sections/category-detail";

type CategoryDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const { id } = await params;
  return <CategoryDetail id={id} />;
}
