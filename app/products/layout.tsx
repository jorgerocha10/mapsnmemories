import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Products | Maps & Memories",
  description: "Browse our collection of products",
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
} 