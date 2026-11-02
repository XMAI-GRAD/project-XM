import { ProtoSwitcher } from "./_switcher";
import s from "./palette.module.css";

export default function ProtoLayout({
  children,
}: LayoutProps<"/[lang]/proto">) {
  return (
    <div className={s.palette}>
      {/* ponytail: hides the root layout's bare header so each prototype owns the page; goes with this folder */}
      <style>{"body > header { display: none; }"}</style>
      {children}
      <ProtoSwitcher />
    </div>
  );
}
