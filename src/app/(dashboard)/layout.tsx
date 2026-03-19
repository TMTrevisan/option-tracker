import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import StoreInitializer from "@/components/StoreInitializer";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-container">
      <StoreInitializer />
      <Sidebar />
      <main className="main-content">
        <TopHeader />
        <div className="page-container">
           {children}
        </div>
      </main>
    </div>
  );
}
