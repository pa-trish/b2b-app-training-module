import Image from "next/image";

export const BRAND_LOGOTYPE_SRC = "/brand/Opti Cold - logotype PNG dark grey.png";
export const BRAND_LOGO_SRC = "/brand/Opti Colt - logo SVG dark grey.svg";

export function LogoMark({ className }: { className?: string }) {
  return (
    <Image
      src={BRAND_LOGO_SRC}
      alt=""
      width={911}
      height={911}
      priority
      className={className ?? "h-8 w-8 shrink-0"}
    />
  );
}

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
