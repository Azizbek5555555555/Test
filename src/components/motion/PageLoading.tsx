import { Loader } from "./Loader";

/**
 * Sahifa serverda tayyorlanayotganda (ma'lumot yuklaydigan og'ir sahifalar) kontent
 * o'rnida ko'rinadi. Bosh sahifaga qo'yilmagan — u progressiv chiziladi va kirishda
 * splash bilan ochiladi.
 */
export default function PageLoading() {
  return (
    <div className="lx-page-loader">
      <Loader />
    </div>
  );
}
