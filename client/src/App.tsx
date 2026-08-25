import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreSeo } from "@/components/StoreSeo";
import { WhatsAppTeamLinkGuard } from "@/components/WhatsAppTeamLinkGuard";
import { useAuth } from "@/_core/hooks/useAuth";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { lazy, Suspense, useEffect } from "react";

const Account = lazy(() => import("./pages/Account"));
const Admin = lazy(() => import("./pages/Admin"));
const Catalog = lazy(() => import("./pages/Catalog"));
const Checkout = lazy(() => import("./pages/Checkout"));
const DigitalLibrary = lazy(() => import("./pages/DigitalLibrary"));
const DigitalBookDetails = lazy(() => import("./pages/DigitalBookDetails"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const LocalDigitalBooks = lazy(() => import("./pages/LocalDigitalBooks"));
const LocalProducts = lazy(() => import("./pages/LocalProducts"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const PaymentProof = lazy(() => import("./pages/PaymentProof"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const WishlistPage = lazy(() => import("./pages/WishlistPage"));
const StorePolicy = lazy(() => import("./pages/StorePolicy"));
const StoreTrust = lazy(() => import("./pages/StoreTrust"));

function AdminRoute() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user?.role !== "admin") {
      setLocation("/", { replace: true });
    }
  }, [loading, setLocation, user?.role]);

  if (loading || user?.role !== "admin") return null;
  return <Admin />;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/كتب-رقمية/:handle"} component={DigitalBookDetails} />
      <Route path={"/كتب-رقمية"} component={LocalDigitalBooks} />
      <Route path={"/متجر-مستقل"} component={LocalProducts} />
      <Route path={"/بحث"} component={SearchPage} />
      <Route path={"/المفضلة"} component={WishlistPage} />
      <Route path={"/المساعدة"} component={HelpCenter} />
      <Route path={"/سياسة-الشحن"} component={StorePolicy} />
      <Route path={"/الاستبدال-والاسترجاع"} component={StorePolicy} />
      <Route path={"/الخصوصية"} component={StorePolicy} />
      <Route path={"/شروط-الاستخدام"} component={StorePolicy} />
      <Route path={"/سياسة-المنتجات-الرقمية"} component={StorePolicy} />
      <Route path={"/من-نحن"} component={StorePolicy} />
      <Route path={"/ضمان-المتجر"} component={StoreTrust} />
      <Route path={"/المنتجات"} component={Catalog} />
      <Route path={"/المنتجات/:handle"} component={ProductDetails} />
      <Route path={"/إتمام-الطلب"} component={Checkout} />
      <Route path={"/إثبات-الدفع/:orderId"} component={PaymentProof} />
      <Route path={"/حسابي"} component={Account} />
      <Route path={"/طلباتي"} component={OrderTracking} />
      <Route path={"/مكتبتي"} component={DigitalLibrary} />
      <Route path={"/المدير"} component={AdminRoute} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <CartProvider>
            <Toaster />
            <StoreSeo />
            <WhatsAppTeamLinkGuard />
            <Suspense fallback={<div className="grid min-h-[50vh] place-items-center text-sm font-bold text-[#173c37]">جارٍ تجهيز الصفحة…</div>}>
              <Router />
            </Suspense>
          </CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
