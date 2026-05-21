"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Add01Icon,
  Building03Icon,
  CheckmarkCircle01Icon,
  Copy01Icon,
  DatabaseSync01Icon,
  Delete02Icon,
  Key01Icon,
  Link05Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { HugeIcon } from "@/components/ui/huge-icon";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  EmptyState,
  PageHeader,
  SectionHeader,
  StatusBadge,
} from "@/components/ui/console-primitives";
import { useBusinessContext } from "@/lib/contexts/business-context";

type ConnectionStatus = {
  id: string;
  businessId: string;
  restaurantIdentity: string | null;
  isActive: boolean;
  lastVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  hasCredentials: boolean;
};

type ConnectionResponse = {
  connection: ConnectionStatus | null;
  fallbackConfigured: boolean;
  canManageConnection?: boolean;
  migrationMissing?: boolean;
};

type FormState = {
  restaurantIdentity: string;
  apiKey: string;
  apiSecret: string;
  apiConsumer: string;
};

const emptyForm: FormState = {
  restaurantIdentity: "",
  apiKey: "",
  apiSecret: "",
  apiConsumer: "",
};

function formatDate(value: string | null) {
  if (!value) return "Henüz yok";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AdisyoSettingsPage() {
  const { selectedBusiness, selectedBusinessId, loading: businessLoading } = useBusinessContext();
  const [connection, setConnection] = useState<ConnectionStatus | null>(null);
  const [fallbackConfigured, setFallbackConfigured] = useState(false);
  const [migrationMissing, setMigrationMissing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [origin, setOrigin] = useState("");

  const webhookUrl = useMemo(() => {
    const path = selectedBusinessId
      ? `/api/adisyo/webhook?businessId=${selectedBusinessId}`
      : "/api/adisyo/webhook";
    return origin ? `${origin}${path}` : path;
  }, [selectedBusinessId, origin]);

  const loadConnection = useCallback(async () => {
    if (!selectedBusinessId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`/api/adisyo/connection?businessId=${selectedBusinessId}`, {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | ConnectionResponse
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(
          payload && "error" in payload ? payload.error : "Adisyo bağlantısı okunamadı.",
        );
      }
      const result = payload as ConnectionResponse;
      setConnection(result.connection);
      setFallbackConfigured(result.fallbackConfigured);
      setMigrationMissing(Boolean(result.migrationMissing));
      setForm((current) => ({
        ...emptyForm,
        restaurantIdentity: result.connection?.restaurantIdentity ?? current.restaurantIdentity,
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Adisyo bağlantısı okunamadı.");
      setConnection(null);
      setMigrationMissing(false);
    } finally {
      setLoading(false);
    }
  }, [selectedBusinessId]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    void loadConnection();
  }, [loadConnection]);

  const setField = (field: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const save = async (validate: boolean) => {
    if (!selectedBusinessId) {
      toast.error("Önce bir işletme seçin.");
      return;
    }
    setSaving(true);
    setTesting(validate);
    try {
      const response = await fetch("/api/adisyo/connection", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          businessId: selectedBusinessId,
          restaurantIdentity: form.restaurantIdentity,
          apiKey: form.apiKey,
          apiSecret: form.apiSecret,
          apiConsumer: form.apiConsumer,
          validate,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { message?: string; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.message ?? payload?.error ?? "Adisyo bağlantısı kaydedilemedi.");
      }
      toast.success(
        validate
          ? "Adisyo bağlantısı doğrulandı ve kaydedildi."
          : "Adisyo bağlantısı kaydedildi.",
      );
      setForm((current) => ({ ...emptyForm, restaurantIdentity: current.restaurantIdentity }));
      await loadConnection();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Adisyo bağlantısı kaydedilemedi.");
    } finally {
      setSaving(false);
      setTesting(false);
    }
  };

  const removeConnection = async () => {
    if (!selectedBusinessId) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/adisyo/connection?businessId=${selectedBusinessId}`, {
        method: "DELETE",
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? "Adisyo bağlantısı kaldırılamadı.");
      }
      toast.success("Adisyo bağlantısı kaldırıldı.");
      setForm(emptyForm);
      await loadConnection();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Adisyo bağlantısı kaldırılamadı.");
    } finally {
      setDeleting(false);
    }
  };

  const copyWebhookUrl = async () => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      toast.success("Webhook endpointi kopyalandı.");
    } catch {
      toast.error("Webhook endpointi kopyalanamadı.");
    }
  };

  const canSubmit = Boolean(
    selectedBusinessId && form.apiKey && form.apiSecret && form.apiConsumer,
  );
  const statusTone = migrationMissing
    ? "danger"
    : connection?.isActive
      ? "success"
      : fallbackConfigured
        ? "info"
        : "warning";
  const statusText = migrationMissing
    ? "Migration gerekli"
    : connection?.isActive
      ? "Bağlı"
      : fallbackConfigured
        ? "Env fallback"
        : "Bağlantı yok";

  if (businessLoading) {
    return (
      <div>
        <PageHeader title="Adisyo bağlantısı" />
        <div className="grid place-items-center py-16 text-sm text-muted-foreground">Yükleniyor...</div>
      </div>
    );
  }

  if (!selectedBusinessId || !selectedBusiness) {
    return (
      <div>
        <PageHeader
          title="Adisyo bağlantısı"
          description="POS hesabınızı bağlayarak menü senkronunu aktifleştirin."
        />
        <EmptyState
          title="İşletme seçilmemiş"
          description="Adisyo bağlantısını yönetmek için önce kenar çubuğundan bir işletme seçin."
          icon={Building03Icon}
          action={
            <Button asChild size="sm">
              <Link href="/dashboard/settings/business-settings">
                <HugeIcon icon={Add01Icon} size={16} />
                İşletme oluştur
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Adisyo bağlantısı"
        description="POS hesabınızın API anahtarlarını kaydedin; katalog senkronu bu bağlantı üzerinden çalışır."
        meta={
          <span className="inline-flex items-center gap-1.5">
            <HugeIcon icon={Building03Icon} size={14} />
            {selectedBusiness.name}
          </span>
        }
        actions={
          <>
            <StatusBadge tone={statusTone}>{statusText}</StatusBadge>
            <Button
              variant="ghost"
              size="iconMd"
              onClick={() => void loadConnection()}
              disabled={loading}
              aria-label="Yenile"
            >
              <HugeIcon
                icon={RefreshIcon}
                size={16}
                className={loading ? "animate-spin" : undefined}
              />
            </Button>
          </>
        }
      />

      {migrationMissing ? (
        <div className="mb-6 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm leading-6 text-destructive">
          Adisyo senkron tabloları Supabase veritabanında yok. Repodaki migration uygulandıktan sonra
          bağlantı kaydı ve scheduled sync aktif olur.
        </div>
      ) : null}

      <section className="mb-8">
        <SectionHeader title="Durum özeti" />
        <ul className="grid gap-0 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <DetailRow
            label="Bağlantı"
            value={statusText}
            sub={
              fallbackConfigured && !connection?.isActive
                ? "Env fallback devrede"
                : connection?.hasCredentials
                  ? "Kayıtlı credential"
                  : "Credential bekleniyor"
            }
            icon={DatabaseSync01Icon}
            tone={statusTone}
          />
          <DetailRow
            label="Son doğrulama"
            value={connection?.lastVerifiedAt ? "Doğrulandı" : "Yapılmadı"}
            sub={formatDate(connection?.lastVerifiedAt ?? null)}
            icon={CheckmarkCircle01Icon}
          />
          <DetailRow
            label="Son kayıt"
            value={connection?.updatedAt ? "Var" : "Yok"}
            sub={formatDate(connection?.updatedAt ?? null)}
            icon={Key01Icon}
          />
        </ul>
      </section>

      <section className="mb-8">
        <SectionHeader
          title="Credential kaydı"
          description="Adisyo panelindeki API anahtarlarını işletmeye bağlayın. Değerler sunucu tarafında şifrelenir."
        />
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="restaurantIdentity">Restaurant identity</Label>
            <Input
              id="restaurantIdentity"
              value={form.restaurantIdentity}
              onChange={(event) => setField("restaurantIdentity", event.target.value)}
              placeholder="Webhook eşleştirmesi için opsiyonel"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="apiKey">API key</Label>
              <Input
                id="apiKey"
                type="password"
                value={form.apiKey}
                onChange={(event) => setField("apiKey", event.target.value)}
                autoComplete="new-password"
                placeholder={
                  connection?.hasCredentials ? "Yeni değer girerseniz güncellenir" : "x-api-key"
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="apiSecret">API secret</Label>
              <Input
                id="apiSecret"
                type="password"
                value={form.apiSecret}
                onChange={(event) => setField("apiSecret", event.target.value)}
                autoComplete="new-password"
                placeholder={
                  connection?.hasCredentials ? "Yeni değer girerseniz güncellenir" : "x-api-secret"
                }
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="apiConsumer">API consumer</Label>
            <Input
              id="apiConsumer"
              type="password"
              value={form.apiConsumer}
              onChange={(event) => setField("apiConsumer", event.target.value)}
              autoComplete="new-password"
              placeholder={
                connection?.hasCredentials
                  ? "Yeni değer girerseniz güncellenir"
                  : "x-api-consumer"
              }
            />
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {connection ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => void removeConnection()}
                disabled={deleting}
              >
                <HugeIcon icon={Delete02Icon} size={16} />
                Bağlantıyı kaldır
              </Button>
            ) : (
              <span />
            )}
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                onClick={() => void save(false)}
                disabled={!canSubmit || saving}
              >
                Kaydet
              </Button>
              <Button onClick={() => void save(true)} disabled={!canSubmit || saving}>
                <HugeIcon
                  icon={testing ? RefreshIcon : CheckmarkCircle01Icon}
                  size={16}
                  className={testing ? "animate-spin" : undefined}
                />
                Kaydet ve doğrula
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          title="Webhook endpointi"
          description="Adisyo webhook ekranında URL alanına bu endpointi kaydedin."
          action={<StatusBadge tone="info">POST</StatusBadge>}
        />
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="webhookUrl">Endpoint URL</Label>
            <div className="flex gap-2">
              <Input
                id="webhookUrl"
                value={webhookUrl}
                readOnly
                className="font-mono text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="iconMd"
                onClick={() => void copyWebhookUrl()}
                aria-label="Webhook endpointini kopyala"
              >
                <HugeIcon icon={Copy01Icon} size={16} />
              </Button>
            </div>
          </div>
          <div className="rounded-md border border-border bg-muted/30 px-3 py-3 text-xs text-muted-foreground">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <HugeIcon icon={Link05Icon} size={14} />
              Güvenlik başlığı
            </div>
            <code className="block break-all rounded-sm bg-background px-2 py-1 font-mono">
              Authorization: Bearer {"<ADISYO_WEBHOOK_SECRET>"}
            </code>
            <p className="mt-2">
              Adisyo header destekliyorsa bu secret kullanılabilir; desteklemiyorsa
              ADISYO_WEBHOOK_SECRET boş kalmalı ve businessId&apos;li URL kullanılmalı.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
function DetailRow({
  label,
  value,
  sub,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub: string;
  icon: typeof DatabaseSync01Icon;
  tone?: "success" | "warning" | "danger" | "neutral" | "info";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning-foreground"
        : tone === "danger"
          ? "text-destructive"
          : tone === "info"
            ? "text-foreground"
            : "text-foreground";
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        <HugeIcon icon={icon} size={16} />
      </span>
      <div className="min-w-0">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className={`truncate text-sm font-semibold ${toneClass}`}>{value}</div>
        <div className="truncate text-xs text-muted-foreground">{sub}</div>
      </div>
    </li>
  );
}
