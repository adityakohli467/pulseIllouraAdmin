import { redirect } from "next/navigation"

// The Illoura admin portal has no dashboard; land on the Orders page.
export default function HomePage() {
  redirect("/admin/ellora/orders")
}
