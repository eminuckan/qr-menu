import { MenuDetail } from "@/components/sections/menu-detail";

type MenuDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function MenuDetailPage({ params }: MenuDetailPageProps) {
  const {id} = await params;
  return <MenuDetail id={id} />;
}
