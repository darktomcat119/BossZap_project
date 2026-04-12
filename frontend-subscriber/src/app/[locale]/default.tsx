import { redirect } from "next/navigation";

export default function Default({
  params: { locale },
}: {
  params: { locale: string };
}) {
  redirect(`/${locale}/dashboard`);
}
