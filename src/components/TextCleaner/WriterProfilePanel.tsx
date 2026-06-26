import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buildProfile, serializeProfile, parseProfile, type WriterProfile } from "@/lib/writerProfile";
import {
  loadProfiles,
  saveProfiles,
  loadActiveProfileId,
  saveActiveProfileId,
  generateProfileId,
  type StoredProfiles,
} from "@/lib/profileStore";
import { UserPen, Download, Upload, Trash2 } from "lucide-react";

interface WriterProfilePanelProps {
  profile: WriterProfile | null;
  onProfileChange: (p: WriterProfile | null) => void;
}

export const WriterProfilePanel: React.FC<WriterProfilePanelProps> = ({ profile, onProfileChange }) => {
  const [sample, setSample] = useState("");
  const [newName, setNewName] = useState("");
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<StoredProfiles>({});
  const [activeId, setActiveId] = useState<string | null>(null);

  // Chargement initial depuis localStorage (une seule fois au montage).
  // Restaure le profil actif précédent, s'il existe encore.
  useEffect(() => {
    const stored = loadProfiles();
    setProfiles(stored);
    const storedActiveId = loadActiveProfileId();
    if (storedActiveId && stored[storedActiveId]) {
      setActiveId(storedActiveId);
      onProfileChange(stored[storedActiveId]);
    }
    // onProfileChange volontairement omis des deps : on ne veut exécuter
    // cette restauration qu'une seule fois, au montage du composant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persist = (next: StoredProfiles) => {
    setProfiles(next);
    saveProfiles(next);
  };

  const selectProfile = (id: string | null) => {
    setActiveId(id);
    saveActiveProfileId(id);
    onProfileChange(id ? profiles[id] ?? null : null);
  };

  const handleAnalyze = () => {
    if (sample.trim().length < 100) {
      toast.error("Collez au moins 100 caractères de votre écriture");
      return;
    }
    const name = newName.trim() || `Profil ${Object.keys(profiles).length + 1}`;
    const p = buildProfile(sample, name);
    const id = generateProfileId();
    const next = { ...profiles, [id]: p };
    persist(next);
    selectProfile(id);
    setSample("");
    setNewName("");
    toast.success(`Profil « ${name} » créé`);
  };

  const handleExport = () => {
    if (!profile) return;
    const blob = new Blob([serializeProfile(profile)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const safeName = profile.name.trim().replace(/\s+/g, "-").toLowerCase() || "profil";
    link.download = `${safeName}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const p = parseProfile(await file.text());
      const id = generateProfileId();
      const next = { ...profiles, [id]: p };
      persist(next);
      selectProfile(id);
      toast.success(`Profil « ${p.name} » importé`);
    } catch {
      toast.error("Fichier de profil invalide");
    }
    e.target.value = "";
  };

  const handleDelete = (id: string) => {
    const removedName = profiles[id]?.name;
    const next = { ...profiles };
    delete next[id];
    persist(next);
    if (activeId === id) selectProfile(null);
    if (removedName) toast.success(`Profil « ${removedName} » supprimé`);
  };

  const profileEntries = Object.entries(profiles);

  return (
    <div className="space-y-3 p-4 rounded-lg border border-border bg-card/50">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-medium"
      >
        <span className="flex items-center gap-2">
          <UserPen className="w-4 h-4 text-primary" />
          Profil d'écriture
          {profile && <span className="text-xs text-primary">({profile.name})</span>}
        </span>
        <span className="text-xs text-muted-foreground">{open ? "Masquer" : "Configurer"}</span>
      </button>

      {open && (
        <div className="space-y-3">
          {profileEntries.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Profil actif :</span>
              <Select
                value={activeId ?? "none"}
                onValueChange={(v) => selectProfile(v === "none" ? null : v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Aucun profil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun (pas de style appliqué)</SelectItem>
                  {profileEntries.map(([id, p]) => (
                    <SelectItem key={id} value={id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeId && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                  onClick={() => handleDelete(activeId)}
                  title="Supprimer ce profil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Collez un de vos textes pour créer un nouveau profil stylistique local (JSON), sauvegardé
            sur cet appareil. Il sert à réécrire dans votre style.
          </p>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom du profil (ex. Travail, Réseaux sociaux)"
            className="text-sm"
          />
          <Textarea
            value={sample}
            onChange={(e) => setSample(e.target.value)}
            placeholder="Collez ici un exemple de votre écriture..."
            className="min-h-24 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={handleAnalyze}>
              <UserPen className="w-4 h-4" /> Créer ce profil
            </Button>
            <Button size="sm" variant="outline" onClick={handleExport} disabled={!profile}>
              <Download className="w-4 h-4" /> Exporter
            </Button>
            <Button size="sm" variant="outline" asChild>
              <label className="cursor-pointer">
                <Upload className="w-4 h-4" /> Importer
                <input type="file" accept="application/json" className="hidden" onChange={handleImport} />
              </label>
            </Button>
          </div>

          {profile && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded border border-border bg-background/40">
                <div className="font-semibold">{profile.metrics.avgSentenceLength}</div>
                <div className="text-muted-foreground">mots/phrase</div>
              </div>
              <div className="p-2 rounded border border-border bg-background/40">
                <div className="font-semibold">{Math.round(profile.metrics.lexicalDiversity * 100)}%</div>
                <div className="text-muted-foreground">diversité</div>
              </div>
              <div className="p-2 rounded border border-border bg-background/40">
                <div className="font-semibold">{profile.metrics.firstPersonRate}</div>
                <div className="text-muted-foreground">1re pers./phrase</div>
              </div>
              <div className="p-2 rounded border border-border bg-background/40">
                <div className="font-semibold uppercase">{profile.language}</div>
                <div className="text-muted-foreground">langue</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
