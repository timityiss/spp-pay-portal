import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText } from "lucide-react";

interface Invoice {
  id: string;
  student_name: string;
  student_class: string;
  description: string;
  amount: number;
  month: string;
  year: number;
  status: string;
  midtrans_order_id: string | null;
  paid_at: string | null;
  created_at: string;
}

interface InvoiceTableProps {
  invoices: Invoice[];
  loading: boolean;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  unpaid: { label: "Belum Bayar", variant: "destructive" },
  pending: { label: "Menunggu", variant: "outline" },
  paid: { label: "Lunas", variant: "default" },
  expired: { label: "Kadaluarsa", variant: "secondary" },
};

function formatRupiah(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount);
}

export default function InvoiceTable({ invoices, loading }: InvoiceTableProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Daftar Invoice ({invoices.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">Memuat data...</div>
        ) : invoices.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">Belum ada invoice</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Siswa</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>Bulan/Tahun</TableHead>
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tanggal Bayar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const sc = statusConfig[inv.status] || statusConfig.unpaid;
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-medium">{inv.student_name}</TableCell>
                      <TableCell>{inv.student_class}</TableCell>
                      <TableCell>{inv.month} {inv.year}</TableCell>
                      <TableCell>{inv.description}</TableCell>
                      <TableCell className="font-semibold">{formatRupiah(inv.amount)}</TableCell>
                      <TableCell>
                        <Badge variant={sc.variant}>{sc.label}</Badge>
                      </TableCell>
                      <TableCell>
                        {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("id-ID") : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
