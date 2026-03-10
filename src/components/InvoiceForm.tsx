import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

interface InvoiceFormProps {
  onCreated: () => void;
}

export default function InvoiceForm({ onCreated }: InvoiceFormProps) {
  const [studentName, setStudentName] = useState("");
  const [studentClass, setStudentClass] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("SPP Bulanan");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !studentClass || !month || !amount) {
      toast.error("Mohon lengkapi semua field");
      return;
    }

    setLoading(true);
    try {
      const orderId = `SPP-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      
      const { error } = await supabase.from("invoices").insert({
        student_name: studentName.trim(),
        student_class: studentClass.trim(),
        month,
        year: parseInt(year),
        amount: parseInt(amount),
        description,
        midtrans_order_id: orderId,
      });

      if (error) throw error;

      toast.success("Invoice berhasil dibuat!");
      setStudentName("");
      setStudentClass("");
      setMonth("");
      setAmount("");
      onCreated();
    } catch (error) {
      console.error(error);
      toast.error("Gagal membuat invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Buat Invoice SPP
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="studentName">Nama Siswa</Label>
            <Input
              id="studentName"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Nama lengkap siswa"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="studentClass">Kelas</Label>
            <Input
              id="studentClass"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              placeholder="Contoh: XII IPA 1"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Bulan</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih bulan" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="year">Tahun</Label>
            <Input
              id="year"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Jumlah (Rp)</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="500000"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Keterangan</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Membuat..." : "Buat Invoice"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
