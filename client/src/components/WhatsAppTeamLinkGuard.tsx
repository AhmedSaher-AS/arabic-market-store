import { useEffect } from "react";
import { replaceLegacyWhatsAppUrl } from "@/lib/whatsappSupport";

const legacyNumbers = ["01146303129", "201146303129"];

export function WhatsAppTeamLinkGuard() {
  useEffect(() => {
    const normalizeLegacySupportLinks = () => {
      document.querySelectorAll<HTMLAnchorElement>('a[href*="wa.me/"]').forEach(anchor => {
        const nextHref = replaceLegacyWhatsAppUrl(anchor.href);
        if (nextHref !== anchor.href) anchor.href = nextHref;
      });

      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const text = node.textContent ?? "";
        const nextText = legacyNumbers.reduce((current, legacyNumber) => current.replaceAll(legacyNumber, "فريق المتجر"), text);
        if (nextText !== text) node.textContent = nextText;
        node = walker.nextNode();
      }
    };

    normalizeLegacySupportLinks();
    const observer = new MutationObserver(normalizeLegacySupportLinks);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["href"] });
    return () => observer.disconnect();
  }, []);

  return null;
}
