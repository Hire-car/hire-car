import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function BrandLogo({
  className,
  imageClassName,
  priority = false,
}: BrandLogoProps) {
  return (
    <div className={cn("relative h-[40px] w-[160px] md:h-[44px] md:w-[176px] shrink-0", className)}>
      <Image
        src="/LOGO.png"
        alt="HireCar Marketplace"
        fill
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        sizes="(max-width: 640px) 140px, 176px"
        className={cn("object-contain object-left", imageClassName)}
      />
    </div>
  );
}
