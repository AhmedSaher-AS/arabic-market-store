export type BookSeoInput = {
  title: string;
  shortDescription?: string | null;
  description?: string | null;
};

const floatingAdmiralTitle = "الأميرال العائم";

export function getBookSeo({ title, shortDescription, description }: BookSeoInput) {
  const isFloatingAdmiral = title.trim() === floatingAdmiralTitle;
  const defaultDescription = `اشترِ واقرأ كتاب ${title} من مكتبتك الرقمية في سوقك العربي.`;
  const sourceDescription = shortDescription || description || defaultDescription;
  const targetDescription = "رواية الأميرال العائم PDF: نسخة رقمية عربية للشراء والقراءة من مكتبتك في سوقك العربي، مع تفاصيل الكتاب ووسائل دفع مرنة.";
  return {
    isFloatingAdmiral,
    title: isFloatingAdmiral ? "رواية الأميرال العائم PDF | شراء وقراءة | سوقك العربي" : `${title} | كتب رقمية | سوقك العربي`,
    description: (isFloatingAdmiral ? targetDescription : sourceDescription).slice(0, 160),
  };
}
