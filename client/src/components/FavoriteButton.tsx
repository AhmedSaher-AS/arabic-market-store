import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { Heart, LoaderCircle } from "lucide-react";

type FavoriteItem = { itemType: "منتج" | "كتاب رقمي"; itemId: number; title: string; subtitle?: string; price: number | string; currencyCode: string; imageUrl?: string | null; targetPath: string };
export function FavoriteButton({ item, compact = false }: { item: FavoriteItem; compact?: boolean }) {
  const { user } = useAuth(); const utils = trpc.useUtils(); const { data: favorites = [] } = trpc.wishlist.mine.useQuery(undefined, { enabled: Boolean(user) }); const saved = favorites.some(favorite => favorite.itemType === item.itemType && favorite.itemId === item.itemId);
  const save = trpc.wishlist.save.useMutation({ onSuccess: () => utils.wishlist.mine.invalidate() }); const remove = trpc.wishlist.remove.useMutation({ onSuccess: () => utils.wishlist.mine.invalidate() }); const pending = save.isPending || remove.isPending;
  const toggle = (event: React.MouseEvent<HTMLButtonElement>) => { event.preventDefault(); event.stopPropagation(); if (!user) { startLogin(); return; } if (saved) remove.mutate({ itemType: item.itemType, itemId: item.itemId }); else save.mutate({ ...item, subtitle: item.subtitle || "", price: Number(item.price), imageUrl: item.imageUrl || undefined }); };
  return <Button type="button" aria-label={saved ? "إزالة من المفضلة" : "حفظ في المفضلة"} title={saved ? "إزالة من المفضلة" : "حفظ في المفضلة"} variant="ghost" onClick={toggle} disabled={pending} className={`${compact ? "h-9 w-9" : "h-10 w-10"} rounded-full p-0 text-[#b76f2c] hover:bg-[#fff4df]`}>{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Heart className={`h-5 w-5 ${saved ? "fill-current" : ""}`} />}</Button>;
}
