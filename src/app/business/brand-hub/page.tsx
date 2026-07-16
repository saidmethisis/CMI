import { redirect } from "next/navigation";

// Legacy: кабинет бизнеса объединён с кабинетом компании (4-ролевая модель).
export default function BusinessRedirect() {
  redirect("/company");
}
