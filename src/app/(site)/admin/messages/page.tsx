import type { Metadata } from "next";
import { listMessages } from "@/lib/admin-queries";
import { toggleMessageHandledAction } from "@/lib/actions/admin";
import { formatDateTime } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Xabarlar",
  robots: { index: false, follow: false },
};

export default async function AdminMessagesPage() {
  const messages = await listMessages();
  const unread = messages.filter((m) => !m.handled);
  const handled = messages.filter((m) => m.handled);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-extrabold">Xabarlar</h2>
        <p className="text-sm text-muted mt-0.5">
          &quot;Biz bilan bog&apos;lanish&quot; formasidan kelgan murojaatlar
        </p>
      </div>

      {messages.length === 0 ? (
        <EmptyState
          icon="✉️"
          title="Xabarlar yo'q"
          description="Kontakt formasidan yuborilgan xabarlar shu yerda ko'rinadi."
        />
      ) : (
        <>
          <section>
            <h3 className="font-bold mb-3">
              Javob berilmagan{" "}
              <span className="text-muted tabular-nums">({unread.length})</span>
            </h3>

            {unread.length === 0 ? (
              <p className="text-sm text-muted">
                ✅ Barcha xabarlarga javob berilgan.
              </p>
            ) : (
              <div className="space-y-3">
                {unread.map((message) => (
                  <MessageCard key={message.id} message={message} />
                ))}
              </div>
            )}
          </section>

          {handled.length > 0 ? (
            <section>
              <h3 className="font-bold mb-3">Javob berilgan</h3>
              <div className="space-y-3">
                {handled.map((message) => (
                  <MessageCard key={message.id} message={message} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function MessageCard({
  message,
}: {
  message: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    message: string;
    handled: boolean;
    created_at: string;
  };
}) {
  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold">{message.name}</p>
            {message.handled ? (
              <Badge tone="success">Javob berilgan</Badge>
            ) : (
              <Badge tone="warning">Yangi</Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-3 mt-1">
            {message.email ? (
              <a
                href={`mailto:${message.email}`}
                className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
              >
                ✉️ {message.email}
              </a>
            ) : null}
            {message.phone ? (
              <a
                href={`tel:${message.phone.replace(/\s/g, "")}`}
                className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
              >
                📞 {message.phone}
              </a>
            ) : null}
          </div>

          <p className="text-sm mt-3 leading-relaxed whitespace-pre-line">
            {message.message}
          </p>

          <p className="text-xs text-muted mt-2">
            {formatDateTime(message.created_at)}
          </p>
        </div>

        <form action={toggleMessageHandledAction}>
          <input type="hidden" name="id" value={message.id} />
          <input
            type="hidden"
            name="handled"
            value={message.handled ? "false" : "true"}
          />
          <button
            type="submit"
            className="rounded-lg border border-line bg-[var(--bg-subtle)]
                       px-3 py-1.5 text-sm font-semibold hover:border-brand-400 transition-colors
                       whitespace-nowrap"
          >
            {message.handled ? "↺ Qayta ochish" : "✅ Bajarildi"}
          </button>
        </form>
      </div>
    </div>
  );
}
