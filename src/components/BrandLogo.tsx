import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

type BrandLogoProps = {
  className?: string;
  alt?: string;
};

export default function BrandLogo({ className, alt = "ATHEV gym" }: Readonly<BrandLogoProps>) {
  return (
    <img
      src={logo}
      alt={alt}
      className={cn("object-contain select-none", className)}
      draggable={false}
    />
  );
}
