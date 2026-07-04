import Image from "next/image";

export const AUTH_BACKGROUND_IMAGE_SRC = "/images/background.jpg";

export function AuthImageBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-full flex-1 flex-col">
      <div className="pointer-events-none fixed inset-0" aria-hidden>
        <Image
          src={AUTH_BACKGROUND_IMAGE_SRC}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="relative z-10 flex flex-1 flex-col">{children}</div>
    </div>
  );
}
