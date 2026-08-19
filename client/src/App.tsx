import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoreSeo } from "@/components/StoreSeo";
import { useAuth } from "@/_core/hooks/useAuth";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { CartProvider } from "./contexts/CartContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Account from "./pages/Account";
import Admin from "./pages/Admin";
import Catalog from "./pages/Catalog";
import Checkout from "./pages/Checkout";
import DigitalLibrary from "./pages/DigitalLibrary";
import DigitalBookDetails from "./pages/DigitalBookDetails";
import Home from "./pages/Home";
import HelpCenter from "./pages/HelpCenter";
import LocalDigitalBooks from "./pages/LocalDigitalBooks";
import LocalProducts from "./pages/LocalProducts";
import OrderTracking from "./pages/OrderTracking";
import PaymentProof from "./pages/PaymentProof";
import ProductDetails from "./pages/ProductDetails";
import SearchPage from "./pages/SearchPage";
import WishlistPage from "./pages/WishlistPage";
import StorePolicy from "./pages/StorePolicy";
import StoreTrust from "./pages/StoreTrust";
import { useEffect } from "react";

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
            <Router />
          </CartProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
