import { Loader } from "@/components/motion/Loader";

/** To'liq ekranli yuklanish (test/imtihon oynasi tayyorlanayotganda) */
export default function Loading() {
  return (
    <div className="lx-page-loader lx-page-loader-full">
      <Loader size={164} />
    </div>
  );
}
