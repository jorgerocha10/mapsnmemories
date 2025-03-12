import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maps & Memories | Home",
  description: "Shop for high-quality clothing and accessories",
};

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
} 