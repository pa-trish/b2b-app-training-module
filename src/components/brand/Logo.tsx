import Image from "next/image";

export const BRAND_LOGOTYPE_SRC = "/brand/Opti Cold - logotype PNG dark grey.png";

export function Logo({ className }: { className?: string }) {
  return (
    <Image
      src={BRAND_LOGOTYPE_SRC}
      alt="Opti Colt Training Platform"
      width={3732}
      height={911}
      priority
      className={className ?? "h-14 w-auto max-w-full"}
    />
  );
}
