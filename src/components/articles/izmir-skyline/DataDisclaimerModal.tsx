import { useEffect, useRef, useState } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function DataDisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  const strong = "text-foreground";

  return (
    <div
      className={`my-10 border-t pt-6 ${"border-border"}`}
    >
      <div
        className={`flex min-w-0 flex-col gap-4 rounded-[18px] border p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${"border-border bg-card"}`}
      >
        <div className="flex min-w-0 items-start gap-3">
          <div className="min-w-0">
            <h4
              className={`m-0 text-sm font-semibold ${"text-foreground"}`}
            >
              Veri ve metodoloji notu
            </h4>
            <p
              className={`mt-1 text-xs leading-5 ${"text-muted-foreground"}`}
            >
              Veri kapsamını, ayıklanan kayıtları ve 3D ölçeği okuyun.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-haspopup="dialog"
          className={`inline-flex min-h-10 w-full shrink-0 items-center justify-center gap-2 rounded-full border px-4 text-sm font-medium transition sm:w-auto ${"border-border bg-card text-foreground hover:bg-muted"}`}
        >
          Metodolojiyi incele <span aria-hidden="true">→</span>
        </button>
      </div>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-sm sm:items-center sm:p-4"
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
            className={`relative max-h-[92svh] w-full overflow-y-auto rounded-t-[22px] border p-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:max-w-2xl sm:rounded-[22px] sm:p-8 ${"border-border bg-card text-foreground/80"}`}
          >
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              ref={closeButtonRef}
              aria-label="Veri ve metodoloji notunu kapat"
              className={`absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:right-6 sm:top-6 ${"text-muted-foreground hover:bg-muted hover:text-foreground"}`}
            >
              <span aria-hidden="true">✕</span>
            </button>

            <h3
              id="izmir-data-dialog-title"
              className={`mb-5 pr-12 text-2xl font-semibold tracking-[-0.025em] sm:text-3xl ${strong}`}
            >
              Haritanın sınırları
            </h3>

            <div
              id="izmir-data-dialog-description"
              className={`space-y-5 text-sm leading-7 ${"text-foreground/80"}`}
            >
              <p>
                Bu çalışma, İzmir Büyükşehir Belediyesi Açık Veri Portalı’nda
                yer alan <em>“İlçelere Ait Bina Kat Sayıları”</em>
                tablosundaki 30 ilçeye ait 899.447 ham kayıtla hazırlandı. “20+
                kat” ifadesi mimari türü veya metre cinsinden yüksekliği değil,
                kaynak tablodaki kat kategorisini gösterir.
              </p>

              <div
                className={`border-y py-5 ${"border-border"}`}
              >
                <h4 className={`m-0 text-base font-semibold ${strong}`}>
                  Okurken bilinmesi gerekenler
                </h4>

                <div className="mt-5 space-y-5">
                  <section>
                    <h5 className={`m-0 text-sm font-semibold ${strong}`}>
                      Editoryal ayıklama
                    </h5>
                    <p className="mt-1.5">
                      Ham dosya değiştirilmedi. Teknik inceleme gerektiren 10
                      satırdaki 11 kayıt analiz dışında bırakıldı. Harita ve
                      grafikler, kalan{" "}
                      <strong className={strong}>899.436 bina kaydı</strong> ve
                      bunların içindeki{" "}
                      <strong className={strong}>
                        176 adet “20+ kat” verisi
                      </strong>{" "}
                      üzerinden hesaplandı.
                    </p>
                  </section>

                  <section>
                    <h5 className={`m-0 text-sm font-semibold ${strong}`}>
                      Kat sayısı yapı türünü göstermez
                    </h5>
                    <p className="mt-1.5">
                      Kat bilgisi, bir yapının konut, plaza veya iş merkezi
                      olduğunu tek başına göstermez. Tablo yalnızca kat
                      dağılımını karşılaştırır.
                    </p>
                  </section>

                  <section>
                    <h5 className={`m-0 text-sm font-semibold ${strong}`}>
                      3D görselleştirme ölçeği
                    </h5>
                    <p className="mt-1.5">
                      Haritadaki temsili yükseklikler gerçek bina yüksekliği
                      değildir. Kat farklarının ekranda okunabilmesi için
                      ölçeklenmiştir.
                    </p>
                  </section>
                </div>
              </div>

              <p
                className={`text-xs italic leading-6 ${"text-muted-foreground"}`}
              >
                Harita kat dağılımını karşılaştırır; bina türü veya gerçek
                yüksekliği göstermez.
              </p>
            </div>

            <div
              className={`mt-6 flex justify-end border-t pt-5 ${"border-border"}`}
            >
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="min-h-10 rounded-full bg-foreground px-6 text-sm font-medium text-background transition hover:bg-foreground/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
