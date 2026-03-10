import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import InvoiceForm from "@/components/InvoiceForm";
import InvoiceTable from "@/components/InvoiceTable";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CreditCard, LayoutDashboard } from "lucide-react";

export default function AdminDashboard() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) setInvoices(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin SPP</h1>
          </div>
          <Button variant="outline" asChild>
            <Link to="/bayar">
              <CreditCard className="mr-2 h-4 w-4" />
              Halaman Pembayaran
            </Link>
          </Button>
        </div>
      </header>
      <main className="container space-y-6 py-8">
        <InvoiceForm onCreated={fetchInvoices} />
        <InvoiceTable invoices={invoices} loading={loading} />
      </main>
    </div>
  );
}
