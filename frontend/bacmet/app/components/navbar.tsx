"use client"
import { usePathname } from "next/navigation";

import NavBarCore, { NavBarProps } from "./nav-bar-core"

export default function NavBar(props: NavBarProps) {
  const pathname = usePathname();

  return <NavBarCore {...props} pathname={pathname} />;

}