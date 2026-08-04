import { useEffect, useRef, useState } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function DataDisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateTheme = () => {
      setIsDark(document.documentElement.dataset.theme === "dark");
    };
    updateTheme();
    window.addEventListener("themechange", updateTheme);
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      window.removeEventListener("themechange", updateTheme);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
        return;
      }
      if (event.key !== "Tab" || !modalRef.current) return;

      const focusable = Array.from(
        modalRef.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (focusable.length === 0) return;
      const first = focusable[0]!;
      const last = focusable[focusable.length - 1]!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  const dc = (dark: string, light: string) => (isDark ? dark : light);
  const strong = dc("text-white", "text-slate-950");

  return (
    <div
      className={`my-10 border-t pt-6 ${dc("border-slate-800", "border-slate-200")}`}
    >
      <div
        className={`flex min-w-0 flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${dc("border-slate-800 bg-slate-900/60", "border-slate-200 bg-slate-50")}`}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="min-w-0">
            <h4
              className={`m-0 text-sm font-semibold ${dc("text-slate-100", "text-slate-900")}`}
            >
              Veri ve metodoloji notu
            </h4>
            <p
              className={`mt-1 text-xs leading-5 ${dc("text-slate-400", "text-slate-500")}`}
            >
              {" "}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          className={`inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-xl border px-4 text-xs font-semibold shadow-sm transition sm:w-auto ${dc("border-slate-700 bg-slate-800 text-amber-300 hover:bg-slate-700", "border-slate-300 bg-white text-amber-700 hover:bg-slate-100")}`}
        >
          Metodolojiyi incele <span aria-hidden="true">→</span>
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-md sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="izmir-data-dialog-title"
            aria-describedby="izmir-data-dialog-description"
            className={`relative max-h-[92svh] w-full overflow-y-auto rounded-t-3xl border p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-2xl sm:rounded-3xl sm:p-8 ${dc("border-slate-800 bg-slate-900 text-slate-300", "border-slate-200 bg-white text-slate-700")}`}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              ref={closeButtonRef}
              aria-label="Veri ve metodoloji notunu kapat"
              className={`absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500 sm:right-6 sm:top-6 ${dc("text-slate-300 hover:bg-slate-800 hover:text-white", "text-slate-500 hover:bg-slate-100 hover:text-slate-950")}`}
            >
              <span aria-hidden="true">✕</span>
            </button>

            <div
              className={`pr-12 font-mono text-[10px] font-semibold uppercase tracking-[0.17em] ${dc("text-amber-300", "text-amber-700")}`}
            >
              Veri ve Metodoloji Notu
            </div>
            <h3
              id="izmir-data-dialog-title"
              className={`mb-5 mt-2 pr-12 text-2xl font-bold tracking-[-0.025em] sm:text-3xl ${strong}`}
            >
              Haritanın Sınırları
            </h3>

            <div
              id="izmir-data-dialog-description"
              className={`space-y-5 text-sm leading-7 ${dc("text-slate-300", "text-slate-600")}`}
            >
              <p>
                Bu çalışma, İzmir Büyükşehir Belediyesi Açık Veri Portalı’nda
                yer alan <em>“İlçelere Ait Bina Kat Sayıları”</em>
                veritabanındaki 30 ilçeye ait 899.447 ham kayıt incelenerek
                hazırlandı. Veri setindeki “20+ kat” gibi ifadeler, binaların
                mimari türünü ya da metre cinsinden kesin yüksekliğini değil,
                veritabanındaki kat kategorilerini temsil ediyor.
              </p>

              <div
                className={`border-y py-5 ${dc("border-slate-700/80", "border-slate-200")}`}
              >
                <h4 className={`m-0 text-base font-semibold ${strong}`}>
                  Bu Çalışmayı Okurken Neleri Bilmelisiniz?
                </h4>

                <div className="mt-5 space-y-5">
                  <section>
                    <h5 className={`m-0 text-sm font-semibold ${strong}`}>
                      Editoryal Ayıklama ve Doğrulama
                    </h5>
                    <p className="mt-1.5">
                      Orijinal ham dosyaya hiçbir müdahalede bulunmadık. Ancak
                      veri bütünlüğü açısından teknik inceleme gerektiren 10
                      satırdaki 11 bina kaydını analiz dışı bıraktık. Harita ve
                      grafiklerimiz; doğrulanmış{" "}
                      <strong className={strong}>899.436 bina kaydı</strong> ve
                      bu kayıtlar arasındaki{" "}
                      <strong className={strong}>
                        176 adet “20+ kat” verisi
                      </strong>{" "}
                      üzerinden hesaplandı.
                    </p>
                  </section>

                  <section>
                    <h5 className={`m-0 text-sm font-semibold ${strong}`}>
                      Kat Sayısı Yapı Türünü Belirlemez
                    </h5>
                    <p className="mt-1.5">
                      Veri setindeki kat bilgisi, bir yapının konut, plaza veya
                      iş merkezi olduğunu tek başına göstermez. Tablodaki
                      veriler kentin genel dikey/yatay eğilimini sunar.
                    </p>
                  </section>

                  <section>
                    <h5 className={`m-0 text-sm font-semibold ${strong}`}>
                      3D Görselleştirme Ölçeği
                    </h5>
                    <p className="mt-1.5">
                      3D haritadaki temsili bina yükseklikleri, binaların
                      birebir mimari yükseklik karşılığı değildir. Ekran okuma
                      deneyimini kolaylaştırmak ve kentsel dokuyu anlaşılır
                      kılmak adına yükseklik ölçekleri normalize edilerek
                      sahneye aktarıldı.
                    </p>
                  </section>
                </div>
              </div>

              <p
                className={`text-xs italic leading-6 ${dc("text-slate-400", "text-slate-500")}`}
              >
                Özetle; bu çalışma verinin özünü saklamıyor, sadece haritanın
                gözle okunabilir ve anlaşılır kalması için mimari ölçeği görsel
                olarak dengeliyor.
              </p>
            </div>

            <div
              className={`mt-6 flex justify-end border-t pt-5 ${dc("border-slate-800", "border-slate-200")}`}
            >
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-11 rounded-xl bg-amber-500 px-6 text-xs font-bold text-slate-950 transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
