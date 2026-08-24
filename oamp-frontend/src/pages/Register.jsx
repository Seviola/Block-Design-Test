import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";

const GRADES = ["4A", "4B", "4C", "5A", "5B", "5C", "6A", "6B", "6C"];

const initialForm = {
  uid: "",
  name: "",
  age: "",
  grade: "",
  gender: "",
  height: "",
  weight: "",
  dexterity: "",
  grip_strength: "",
};

export function Register() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const uidRef = useRef(null);

  const { data: batchesRes } = useQuery({
    queryKey: ["batches"],
    queryFn: () => api.get("/batches"),
  });

  const activeBatch = useMemo(() => {
    const list = batchesRes?.data?.data || batchesRes?.data || [];
    return list.find((b) => b.is_active) || null;
  }, [batchesRes]);

  const hasUidPrefix = activeBatch?.uid_prefix;
  const autoUidHint = hasUidPrefix
    ? `${activeBatch.uid_prefix}${String(activeBatch.uid_counter + 1).padStart(3, "0")}`
    : "";

  useEffect(() => {
    uidRef.current?.focus();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleUidScan(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      const uid = form.uid.trim();
      if (!uid) return;

      try {
        const res = await api.get(`/participants/uid/${uid}`);
        if (res.data) {
          toast.info(`Peserta sudah terdaftar: ${res.data.name}`);
          return;
        }
      } catch {
        // 404 means UID not registered yet — proceed with form
      }

      // Move focus to Name field
      document.getElementById("name")?.focus();
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      uid: form.uid.trim() || undefined,
      name: form.name.trim(),
      age: parseInt(form.age),
      grade: form.grade,
      gender: form.gender,
      height: parseFloat(form.height),
      weight: parseFloat(form.weight),
      dexterity: form.dexterity ? parseFloat(form.dexterity) : undefined,
      grip_strength: form.grip_strength ? parseFloat(form.grip_strength) : undefined,
    };

    try {
      const res = await api.post("/participants", payload);
      toast.success("Peserta berhasil didaftarkan!");
      const newUid = res.data?.uid || payload.uid;
      await queryClient.invalidateQueries({ queryKey: ["participants"] });
      await queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      navigate(`/paywall/${newUid}`);
    } catch (err) {
      console.error("[Register] Failed:", err?.response?.status, err?.response?.data);
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "Gagal mendaftarkan peserta.";
      if (status === 409) {
        toast.error("UID sudah terdaftar. Gunakan UID lain.");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto">
      <Card className="border border-[var(--color-border)] shadow-sm rounded-xl">
        <CardHeader className="bg-muted border-b border-[var(--color-border)]">
          <CardTitle className="flex items-center gap-2 text-foreground font-bold">
            <UserPlus className="h-5 w-5" />
            Registration Station
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="uid">ID Peserta </Label>
              <Input
                id="uid"
                name="uid"
                ref={uidRef}
                value={form.uid}
                onChange={handleChange}
                onKeyDown={handleUidScan}
                placeholder={hasUidPrefix ? `${autoUidHint} — kosongkan untuk auto` : "Masukkan ID peserta..."}
                required={!hasUidPrefix}
                autoFocus
                className="border border-[var(--color-border)] shadow-sm rounded-xl"
              />
              {hasUidPrefix ? (
                <p className="text-xs text-muted-foreground">
                  Kosongkan untuk auto-generate <strong>{autoUidHint}</strong>. Ketik manual untuk koreksi.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Ketik atau scan ID peserta. Field ini otomatis aktif.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nama peserta"
                required
                className="border border-[var(--color-border)] shadow-sm rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  min={3}
                  max={150}
                  value={form.age}
                  onChange={handleChange}
                placeholder="3-150"
                required
                className="border border-[var(--color-border)] shadow-sm rounded-xl"
              />
              </div>
              <div className="space-y-2">
                <Label>Class *</Label>
                <Select
                  value={form.grade}
                  onValueChange={(val) =>
                    setForm((prev) => ({ ...prev, grade: val }))
                  }
                >
                  <SelectTrigger className="border border-[var(--color-border)] shadow-sm rounded-xl">
                    <SelectValue placeholder="Pilih kelas" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Gender *</Label>
              <RadioGroup
                value={form.gender}
                onValueChange={(val) =>
                  setForm((prev) => ({ ...prev, gender: val }))
                }
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female">Female</Label>
                </div>
              </RadioGroup>
            </div>

            {/* <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm) *</Label>
                <Input
                  id="height"
                  name="height"
                  type="number"
                  min={50}
                  max={300}
                  step={0.1}
                  value={form.height}
                  onChange={handleChange}
                placeholder="50-300"
                required
                className="border border-[var(--color-border)] shadow-sm rounded-xl"
              />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg) *</Label>
                <Input
                  id="weight"
                  name="weight"
                  type="number"
                  min={5}
                  max={500}
                  step={0.1}
                  value={form.weight}
                  onChange={handleChange}
                placeholder="5-500"
                required
                className="border border-[var(--color-border)] shadow-sm rounded-xl"
              />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dexterity">Dexterity</Label>
                <Input
                  id="dexterity"
                  name="dexterity"
                  type="number"
                  min={0}
                  max={500}
                  step={0.1}
                  value={form.dexterity}
                  onChange={handleChange}
                  placeholder="Optional"
                className="border border-[var(--color-border)] shadow-sm rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grip_strength">Grip (kg)</Label>
                <Input
                  id="grip_strength"
                  name="grip_strength"
                  type="number"
                  min={0}
                  max={200}
                  step={0.1}
                  value={form.grip_strength}
                  onChange={handleChange}
                  placeholder="Optional"
                className="border border-[var(--color-border)] shadow-sm rounded-xl"
                />
              </div>
            </div> */}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                "Register Participant"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}