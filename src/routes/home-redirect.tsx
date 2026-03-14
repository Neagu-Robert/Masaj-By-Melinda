import { redirect } from "react-router";
import type { ClientLoaderFunctionArgs } from "react-router";

export function clientLoader({ request }: ClientLoaderFunctionArgs) {
  return redirect("/");
}

export default function HomeRedirect() {
  // This component is never rendered because the loader always redirects
  return null;
}
