import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import StoreInitializer from "@/components/StoreInitializer";
import MobileSidebarWrapper from "@/components/MobileSidebarWrapper";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="app-container">
      <StoreInitializer />
      <MobileSidebarWrapper>
        <Sidebar />
      </MobileSidebarWrapper>
      <main className="main-content">
        <TopHeader />
        <div className="page-container">
           {children}
        </div>
      </main>
    </div>
  );
}
