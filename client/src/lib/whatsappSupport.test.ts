import { describe, expect, it } from "vitest";
import { TEAM_WHATSAPP_URL, buildTeamWhatsAppUrl, replaceLegacyWhatsAppUrl } from "./whatsappSupport";

describe("روابط فريق واتساب", () => {
  it("تنشئ رابط المراسلة الجديد مع رسالة مشفرة", () => {
    expect(buildTeamWhatsAppUrl("مرحبًا فريق المتجر")).toBe("https://wa.me/201554586850?text=%D9%85%D8%B1%D8%AD%D8%A8%D9%8B%D8%A7%20%D9%81%D8%B1%D9%8A%D9%82%20%D8%A7%D9%84%D9%85%D8%AA%D8%AC%D8%B1");
  });

  it("يستبدل رقم الدعم القديم دون تعديل بقية الرسالة", () => {
    expect(replaceLegacyWhatsAppUrl("https://wa.me/201146303129?text=help")).toBe(`${TEAM_WHATSAPP_URL}?text=help`);
  });
});
