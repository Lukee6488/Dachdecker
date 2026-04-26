import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2, Bell, Palette, Shield, Database, Info,
  Save, Upload, Trash2, Download, Mail, Phone,
  MapPin, Globe, Clock, Sun, Moon, Monitor,
  Lock, Key, FileText, AlertTriangle, CheckCircle2, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useOrders } from "@/context/OrdersContext";

const Einstellungen = () => {
  const { orders } = useOrders();

  const handleExportCSV = () => {
    const headers = ["ID", "Kunde", "Adresse", "Telefon", "Kategorie", "Priorität", "Status", "Eingang", "Termin", "Zugewiesen an", "Beschreibung", "Notizen"];
    const rows = orders.map((o) => [
      o.id, o.customerName, o.address, o.phone, o.category, o.priority,
      o.status, o.receivedAt, o.scheduledAt ?? "", o.assignedTo ?? "",
      o.description, o.notes,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";"));
    const csv = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "auftraege.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportiert");
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(orders, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "auftraege.json"; a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exportiert");
  };
  function usePersisted<T>(key: string, initial: T): [T, (v: T) => void] {
    const [value, setValue] = useState<T>(() => {
      try { const s = localStorage.getItem(key); return s !== null ? JSON.parse(s) : initial; } catch { return initial; }
    });
    const set = (v: T) => { setValue(v); try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ } };
    return [value, set];
  }

  const [companyName, setCompanyName] = usePersisted("settings.companyName", "Elektro Heikes");
  const [companyEmail, setCompanyEmail] = usePersisted("settings.companyEmail", "info@elektro-heikes.de");
  const [companyPhone, setCompanyPhone] = usePersisted("settings.companyPhone", "");
  const [companyAddress, setCompanyAddress] = usePersisted("settings.companyAddress", "");
  const [companyWebsite, setCompanyWebsite] = usePersisted("settings.companyWebsite", "");
  const [companyDescription, setCompanyDescription] = usePersisted("settings.companyDescription",
    "Elektriker-Dispositionssoftware für effiziente Einsatzplanung und Auftragsverwaltung."
  );
  const [taxId, setTaxId] = usePersisted("settings.taxId", "");

  const [emailNotifications, setEmailNotifications] = usePersisted("settings.emailNotifications", true);
  const [pushNotifications, setPushNotifications] = usePersisted("settings.pushNotifications", true);
  const [smsNotifications, setSmsNotifications] = usePersisted("settings.smsNotifications", false);
  const [newOrderAlert, setNewOrderAlert] = usePersisted("settings.newOrderAlert", true);
  const [statusChangeAlert, setStatusChangeAlert] = usePersisted("settings.statusChangeAlert", true);
  const [urgentOrderAlert, setUrgentOrderAlert] = usePersisted("settings.urgentOrderAlert", true);
  const [dailyReport, setDailyReport] = usePersisted("settings.dailyReport", false);
  const [weeklyReport, setWeeklyReport] = usePersisted("settings.weeklyReport", true);

  const [theme, setTheme] = useState(() => {
    if (document.documentElement.classList.contains("dark")) return "dark";
    return "system";
  });

  const applyTheme = (value: string) => {
    setTheme(value);
    const root = document.documentElement;
    if (value === "dark") {
      root.classList.add("dark");
    } else if (value === "light") {
      root.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) root.classList.add("dark");
      else root.classList.remove("dark");
    }
  };
  const [language, setLanguage] = usePersisted("settings.language", "de");
  const [timezone, setTimezone] = usePersisted("settings.timezone", "Europe/Berlin");
  const [dateFormat, setDateFormat] = usePersisted("settings.dateFormat", "dd.MM.yyyy");
  const [compactMode, setCompactMode] = usePersisted("settings.compactMode", false);
  const [animationsEnabled, setAnimationsEnabled] = usePersisted("settings.animationsEnabled", true);

  const [twoFactorEnabled, setTwoFactorEnabled] = usePersisted("settings.twoFactorEnabled", false);
  const [sessionTimeout, setSessionTimeout] = usePersisted("settings.sessionTimeout", "30");
  const [autoLogout, setAutoLogout] = usePersisted("settings.autoLogout", true);

  const handleSave = (section: string) => toast.success(`${section} gespeichert`, { description: "Einstellungen werden beim nächsten Start geladen." });

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Einstellungen</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Unternehmen, Benachrichtigungen und System verwalten
          </p>
        </div>

        <Tabs defaultValue="company" className="space-y-5">
          <TabsList className="h-9 bg-muted/50 p-1">
            <TabsTrigger value="company" className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Building2 className="h-3.5 w-3.5" />
              Unternehmen
            </TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Bell className="h-3.5 w-3.5" />
              Benachrichtigungen
            </TabsTrigger>
            <TabsTrigger value="appearance" className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Palette className="h-3.5 w-3.5" />
              Darstellung
            </TabsTrigger>
            <TabsTrigger value="security" className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Shield className="h-3.5 w-3.5" />
              Sicherheit
            </TabsTrigger>
            <TabsTrigger value="data" className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Database className="h-3.5 w-3.5" />
              Daten
            </TabsTrigger>
            <TabsTrigger value="about" className="text-xs gap-1.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Info className="h-3.5 w-3.5" />
              Über
            </TabsTrigger>
          </TabsList>

          {/* UNTERNEHMEN */}
          <TabsContent value="company" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  Unternehmensprofil
                </CardTitle>
                <CardDescription className="text-xs">Grundlegende Informationen zu deinem Unternehmen</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 border-2 border-dashed border-primary/25 shrink-0">
                    <Zap className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Firmenlogo</p>
                    <p className="text-xs text-muted-foreground mt-0.5">PNG, JPG oder SVG, max. 2 MB</p>
                    <Button variant="outline" size="sm" className="gap-2 mt-2 h-7 text-xs">
                      <Upload className="h-3 w-3" />
                      Hochladen
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: "companyName", label: "Firmenname", icon: Building2, value: companyName, set: setCompanyName },
                    { id: "taxId", label: "USt-IdNr.", icon: FileText, value: taxId, set: setTaxId },
                    { id: "companyEmail", label: "E-Mail", icon: Mail, value: companyEmail, set: setCompanyEmail, type: "email" },
                    { id: "companyPhone", label: "Telefon", icon: Phone, value: companyPhone, set: setCompanyPhone },
                    { id: "companyWebsite", label: "Website", icon: Globe, value: companyWebsite, set: setCompanyWebsite },
                  ].map((field) => (
                    <div key={field.id} className="space-y-1.5">
                      <Label htmlFor={field.id} className="text-xs font-medium flex items-center gap-1.5">
                        <field.icon className="h-3 w-3 text-muted-foreground" />
                        {field.label}
                      </Label>
                      <Input
                        id={field.id}
                        type={(field as any).type}
                        value={field.value}
                        onChange={(e) => field.set(e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                  <div className="space-y-1.5 col-span-2">
                    <Label htmlFor="companyAddress" className="text-xs font-medium flex items-center gap-1.5">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      Adresse
                    </Label>
                    <Input id="companyAddress" value={companyAddress} onChange={(e) => setCompanyAddress(e.target.value)} className="h-8 text-sm" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="companyDescription" className="text-xs font-medium">Beschreibung</Label>
                  <Textarea id="companyDescription" value={companyDescription} onChange={(e) => setCompanyDescription(e.target.value)} rows={2} className="text-sm resize-none" />
                </div>

                <div className="flex justify-end">
                  <Button size="sm" onClick={() => handleSave("Unternehmensprofil")} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    Speichern
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Geschäftszeiten
                </CardTitle>
                <CardDescription className="text-xs">Reguläre Arbeitszeiten</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"].map((day, i) => (
                  <div key={day} className="flex items-center justify-between gap-3">
                    <span className="text-sm w-24 shrink-0">{day}</span>
                    <div className="flex items-center gap-2 flex-1">
                      <Input type="time" defaultValue={i < 5 ? "07:00" : "08:00"} className="h-7 text-xs w-24" />
                      <span className="text-muted-foreground text-xs">–</span>
                      <Input type="time" defaultValue={i < 5 ? "17:00" : "12:00"} className="h-7 text-xs w-24" />
                    </div>
                    <Switch defaultChecked={i < 6} />
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <Button size="sm" onClick={() => handleSave("Geschäftszeiten")} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    Speichern
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* BENACHRICHTIGUNGEN */}
          <TabsContent value="notifications" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Bell className="h-4 w-4 text-muted-foreground" />
                  Kanäle
                </CardTitle>
                <CardDescription className="text-xs">Wie möchtest du benachrichtigt werden?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { icon: Mail, label: "E-Mail", desc: "Benachrichtigungen per E-Mail", checked: emailNotifications, set: setEmailNotifications },
                  { icon: Bell, label: "Push", desc: "Browser-Benachrichtigungen", checked: pushNotifications, set: setPushNotifications },
                  { icon: Phone, label: "SMS", desc: "Wichtige Alerts per SMS", checked: smsNotifications, set: setSmsNotifications },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <item.icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                    <Switch checked={item.checked} onCheckedChange={item.set} />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                  Ereignisse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {[
                  { label: "Neuer Auftrag", desc: "Bei neuem Auftragseingang", s: newOrderAlert, set: setNewOrderAlert },
                  { label: "Statusänderung", desc: "Wenn ein Status geändert wird", s: statusChangeAlert, set: setStatusChangeAlert },
                  { label: "Dringende Aufträge", desc: 'Priorität "Hoch"', s: urgentOrderAlert, set: setUrgentOrderAlert },
                  { label: "Tagesbericht", desc: "Tägliche Zusammenfassung", s: dailyReport, set: setDailyReport },
                  { label: "Wochenbericht", desc: "Wöchentlicher Überblick", s: weeklyReport, set: setWeeklyReport },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b last:border-0">
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch checked={item.s} onCheckedChange={item.set} />
                  </div>
                ))}
                <div className="flex justify-end pt-3">
                  <Button size="sm" onClick={() => handleSave("Benachrichtigungen")} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    Speichern
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DARSTELLUNG */}
          <TabsContent value="appearance" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4 text-muted-foreground" />
                  Design & Darstellung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Farbmodus</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "light", label: "Hell", icon: Sun },
                      { value: "dark", label: "Dunkel", icon: Moon },
                      { value: "system", label: "System", icon: Monitor },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => applyTheme(opt.value)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-sm ${
                          theme === opt.value
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:border-border/80 text-muted-foreground"
                        }`}
                      >
                        <opt.icon className="h-5 w-5" />
                        <span className="text-xs font-medium">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Globe className="h-3 w-3 text-muted-foreground" />Sprache
                    </Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />Zeitzone
                    </Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                        <SelectItem value="Europe/Vienna">Europe/Vienna</SelectItem>
                        <SelectItem value="Europe/Zurich">Europe/Zurich</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Datumsformat</Label>
                    <Select value={dateFormat} onValueChange={setDateFormat}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd.MM.yyyy">DD.MM.YYYY</SelectItem>
                        <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                        <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  {[
                    { label: "Kompaktmodus", desc: "Weniger Abstände", v: compactMode, set: setCompactMode },
                    { label: "Animationen", desc: "Übergänge und Animationen", v: animationsEnabled, set: setAnimationsEnabled },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                      <Switch checked={item.v} onCheckedChange={item.set} />
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <Button size="sm" onClick={() => handleSave("Darstellung")} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" />Speichern
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SICHERHEIT */}
          <TabsContent value="security" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  Sicherheit
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Key className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Zwei-Faktor-Authentifizierung</p>
                      <p className="text-xs text-muted-foreground">Zusätzliche Sicherheit beim Login</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {twoFactorEnabled && (
                      <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Aktiv</Badge>
                    )}
                    <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-muted-foreground" />Passwort ändern
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input type="password" placeholder="Aktuelles Passwort" className="h-8 text-sm" />
                    <Input type="password" placeholder="Neues Passwort" className="h-8 text-sm" />
                  </div>
                  <Input type="password" placeholder="Passwort bestätigen" className="h-8 text-sm max-w-[50%]" />
                  <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs mt-1">
                    <Lock className="h-3 w-3" />Passwort ändern
                  </Button>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Session-Timeout</Label>
                    <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 Minuten</SelectItem>
                        <SelectItem value="30">30 Minuten</SelectItem>
                        <SelectItem value="60">1 Stunde</SelectItem>
                        <SelectItem value="120">2 Stunden</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Automatischer Logout</p>
                    <p className="text-xs text-muted-foreground">Bei Inaktivität abmelden</p>
                  </div>
                  <Switch checked={autoLogout} onCheckedChange={setAutoLogout} />
                </div>

                <div className="flex justify-end">
                  <Button size="sm" onClick={() => handleSave("Sicherheit")} className="gap-1.5">
                    <Save className="h-3.5 w-3.5" />Speichern
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/20 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Aktive Sitzungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Monitor className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Aktuelle Sitzung</p>
                      <p className="text-xs text-muted-foreground">Chrome · München · Jetzt aktiv</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">Aktiv</Badge>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs text-destructive hover:text-destructive border-destructive/20 hover:bg-destructive/5">
                  <Trash2 className="h-3 w-3" />Alle anderen Sitzungen beenden
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* DATEN */}
          <TabsContent value="data" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Database className="h-4 w-4 text-muted-foreground" />
                  Datenverwaltung
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-lg border space-y-2">
                    <div className="flex items-center gap-2">
                      <Download className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">Exportieren</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">Daten als CSV oder JSON exportieren</p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleExportCSV}>
                        CSV
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleExportJSON}>
                        JSON
                      </Button>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg border space-y-2">
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold">Importieren</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">Daten aus CSV importieren</p>
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
                      <Upload className="h-3 w-3" />Datei auswählen
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <h3 className="text-sm font-semibold text-destructive">Gefahrenzone</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">Diese Aktionen können nicht rückgängig gemacht werden.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-xs h-7 text-destructive border-destructive/25 hover:bg-destructive/10">
                      Alle Aufträge löschen
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs h-7 text-destructive border-destructive/25 hover:bg-destructive/10">
                      Account zurücksetzen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Automatische Backups
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Tägliches Backup</p>
                    <p className="text-xs text-muted-foreground">Automatisch um 03:00 Uhr</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Aufbewahrung</p>
                    <p className="text-xs text-muted-foreground">Wie lange Backups gespeichert werden</p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-28 h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 Tage</SelectItem>
                      <SelectItem value="14">14 Tage</SelectItem>
                      <SelectItem value="30">30 Tage</SelectItem>
                      <SelectItem value="90">90 Tage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Letztes Backup: Heute, 03:00 Uhr — Erfolgreich
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ÜBER */}
          <TabsContent value="about" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Zap className="h-4 w-4 text-primary" />
                  ElektroDisp
                </CardTitle>
                <CardDescription className="text-xs">Informationen zur Anwendung</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-y-2.5 text-sm">
                  {[
                    { label: "Version", value: "1.0.0" },
                    { label: "Build", value: "2026.03.25-stable" },
                    { label: "Lizenz", value: "Business" },
                    { label: "Support", value: "support@elektrodisp.de" },
                  ].map((row) => (
                    <>
                      <span key={row.label + "l"} className="text-muted-foreground text-xs">{row.label}</span>
                      <span key={row.label + "v"} className="font-medium text-xs font-mono">{row.value}</span>
                    </>
                  ))}
                  <span className="text-muted-foreground text-xs">Datenbank</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs">Supabase</span>
                    <Badge variant="outline" className="text-[10px] h-4 bg-emerald-50 text-emerald-700 border-emerald-200">Verbunden</Badge>
                  </div>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold">Changelog</h4>
                  <div className="flex gap-3 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[10px] shrink-0 h-4">v1.0.0</Badge>
                    <span>Initiale Version mit Auftrags- und Mitarbeiterverwaltung, Echtzeit-Synchronisation und Kategorie-Filter</span>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  Alle Systeme betriebsbereit
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  Rechtliches
                </CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                {["Datenschutzerklärung", "Nutzungsbedingungen", "Impressum"].map((link) => (
                  <Button key={link} variant="link" className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">
                    {link}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Einstellungen;
