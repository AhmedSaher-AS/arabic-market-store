import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const links = [
  { label: "الرئيسية", href: "/" },
  { label: "المنتجات", href: "/المنتجات" },
  { label: "كتب", href: "/المنتجات?category=كتب" },
  { label: "كتب رقمية", href: "/كتب-رقمية" },
  { label: "ملابس", href: "/المنتجات?category=ملابس" },
  { label: "أجهزة", href: "/المنتجات?category=أجهزة" },
];

export function StoreHeader() {
  const [location] = useLocation();
  const { itemCount, openCart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-[#fffdf8]/90 backdrop-blur-xl">
      <div className="container flex h-[76px] items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3" aria-label="سوقك العربي - الرئيسية">
          <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-[#173c37] text-lg font-black text-[#f5c96a] shadow-lg shadow-[#173c37]/15 transition-transform duration-200 group-hover:scale-105">س</span>
          <span className="text-lg font-extrabold tracking-tight text-[#173c37]">سوقك العربي</span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex" aria-label="التنقل الرئيسي">
          {links.map(link => (
            <Link key={link.href} href={link.href} className={`text-sm font-semibold transition-colors ${location.startsWith(link.href.split("?")[0]) && link.href !== "/" ? "text-[#b76f2c]" : "text-stone-600 hover:text-[#173c37]"}`}>
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/حسابي" aria-label="حسابي" className="hidden h-10 w-10 place-items-center rounded-full text-[#173c37] transition-colors hover:bg-stone-100 sm:grid">
            <UserRound className="h-5 w-5" />
          </Link>
          <Button onClick={openCart} variant="ghost" className="relative h-10 rounded-full px-3 text-[#173c37] hover:bg-stone-100" aria-label="فتح سلة التسوق">
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && <span className="absolute -left-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[#b76f2c] px-1 text-[10px] font-bold text-white">{itemCount}</span>}
            <span className="mr-1 hidden text-sm font-bold md:inline">السلة</span>
          </Button>
          <Button variant="ghost" className="h-10 w-10 rounded-full p-0 lg:hidden" onClick={() => setIsMenuOpen(current => !current)} aria-label="فتح القائمة">
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="border-t border-stone-200 bg-[#fffdf8] px-5 py-4 lg:hidden" aria-label="التنقل عبر الجوال">
          <div className="mx-auto grid max-w-2xl grid-cols-2 gap-2">
            {[...links, { label: "حسابي", href: "/حسابي" }].map(link => (
              <Link key={link.href} onClick={() => setIsMenuOpen(false)} href={link.href} className="rounded-xl bg-stone-100 px-4 py-3 text-center text-sm font-bold text-[#173c37] transition-colors hover:bg-[#e3eee8]">
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
