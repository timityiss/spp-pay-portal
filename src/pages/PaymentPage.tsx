import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { CreditCard, Search, ArrowLeft } from "lucide-react";

declare global {
  interface Window {
    snap: {
      pay: (token: string, options: {
        onSuccess: (result: unknown) => void;
        onPending: (result: unknown) => void;
        onError: (result: unknown) => void;
        onClose: () => void;
      }) => void;
    };
  }
}

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  unpaid: { label: "Belum Bayar", variant: "destructive" },
  pending: { label: "Menunggu", variant: "outline" },
  paid: { label: "Lunas", variant: "default" },
  expired: { label: "Kadaluarsa", variant: "secondary" },
};

export default function PaymentPage() {
  const [search, setSearch] = useState("");
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [snapLoaded, setSnapLoaded] = useState(false);

  // Load Midtrans Snap script
  useEffect(() => {
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY;
    if (!clientKey) {
      console.warn("VITE_MIDTRANS_CLIENT_KEY not set, using fallback");
    }
    
    const existingScript = document.querySelector('script[src*="snap.js"]');
    if (existingScript) {
      setSnapLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", clientKey || "");
    script.onload = () => setSnapLoaded(true);
    document.head.appendChild(script);
  }, []);

  const searchInvoices = async () => {
    if (!search.trim()) {
      toast.error("Masukkan nama siswa untuk mencari");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .ilike("student_name", `%${search.trim()}%`)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Gagal mencari invoice");
    } else {
      setInvoices(data || []);
      if (data?.length === 0) toast.info("Tidak ada invoice ditemukan");
    }
    setLoading(false);
  };

  const handlePay = async (invoice: any) => {
    if (!snapLoaded) {
      toast.error("Midtrans belum siap, tunggu sebentar");
      return;
    }

    setPayingId(invoice.id);
    try {
      const { data, error } = await supabase.functions.invoke("create-midtrans-token", {
        body: {
          order_id: invoice.midtrans_order_id,
          gross_amount: invoice.amount,
          student_name: invoice.student_name,
          description: invoice.description,
        },
      });

      if (error) throw error;
      if (!data?.token) throw new Error("Token tidak diterima dari Midtrans");

      window.snap.pay(data.token, {
        onSuccess: async () => {
          toast.success("Pembayaran berhasil!");
          await supabase.from("invoices").update({ status: "paid", paid_at: new Date().toISOString() }).eq("id", invoice.id);
          searchInvoices();
        },
        onPending: async () => {
          toast.info("Pembayaran sedang diproses");
          await supabase.from("invoices").update({ status: "pending" }).eq("id", invoice.id);
          searchInvoices();
        },
        onError: () => {
          toast.error("Pembayaran gagal");
        },
        onClose: () => {
          toast.info("Popup pembayaran ditutup");
        },
      });
    } catch (error) {
      console.error(error);
      toast.error("Gagal memproses pembayaran");
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Pembayaran SPP</h1>
          </div>
          <Button variant="outline" asChild>
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Admin
            </Link>
          </Button>
        </div>
      </header>
      <main className="container max-w-2xl space-y-6 py-8">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Cari Invoice
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => { e.preventDefault(); searchInvoices(); }}
              className="flex gap-3"
            >
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Masukkan nama siswa..."
                className="flex-1"
              />
              <Button type="submit" disabled={loading}>
                {loading ? "Mencari..." : "Cari"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {invoices.length > 0 && (
          <div className="space-y-3">
            {invoices.map((inv) => {
              const sc = statusConfig[inv.status] || statusConfig.unpaid;
              return (
                <Card key={inv.id} className="animate-fade-in">
                  <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-semibold">{inv.student_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {inv.student_class} &middot; {inv.description} &middot; {inv.month} {inv.year}
                      </p>
                      <p className="text-lg font-bold text-primary">{formatRupiah(inv.amount)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={sc.variant}>{sc.label}</Badge>
                      {inv.status === "unpaid" && (
                        <Button
                          onClick={() => handlePay(inv)}
                          disabled={payingId === inv.id}
                          size="sm"
                        >
                          {payingId === inv.id ? "Memproses..." : "Bayar Sekarang"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
