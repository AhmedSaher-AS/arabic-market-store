import { SeoMeta } from "@/components/SeoMeta";
import { useLocation } from "wouter";

const siteName = "سوقك العربي";
const defaultDescription = "مكتبة رقمية عربية لاكتشاف الكتب وشرائها وقراءتها من حسابك، مع وسائل دفع مرنة ودعم مباشر عبر واتساب.";

export function StoreSeo() {
  const [location] = useLocation();
  const isPrivate = ["/المدير", "/حسابي", "/طلباتي", "/مكتبتي", "/إتمام-الطلب", "/إثبات-الدفع"].some(path => location.startsWith(path));
  const metadata = location === "/" ? { title: `${siteName} | مكتبة رقمية عربية`, description: defaultDescription }
    : location === "/كتب-رقمية" ? { title: `كتب رقمية عربية | ${siteName}`, description: "اكتشف كتب PDF عربية واقرأ العينة واشترِ الكتاب من مكتبتك الرقمية." }
      : location === "/من-نحن" ? { title: `عن ${siteName}`, description: "تعرّف إلى سوقك العربي ورسالتنا في جعل الكتب الرقمية العربية أقرب إلى القراء." }
        : { title: `${siteName} | مكتبة رقمية عربية`, description: defaultDescription };

  return <SeoMeta title={metadata.title} description={metadata.description} canonicalPath={location} noIndex={isPrivate || location.startsWith("/بحث") || location.startsWith("/المفضلة")} jsonLd={{
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteName,
    url: window.location.origin,
    inLanguage: "ar",
    potentialAction: { "@type": "SearchAction", target: `${window.location.origin}/بحث?q={search_term_string}`, "query-input": "required name=search_term_string" },
  }} />;
}
