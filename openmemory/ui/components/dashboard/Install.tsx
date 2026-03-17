"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/LanguageContext";
import { Check, Copy } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

const clientTabs = [
  { key: "claude", label: "Claude", icon: "/images/claude.webp" },
  { key: "cursor", label: "Cursor", icon: "/images/cursor.png" },
  { key: "cline", label: "Cline", icon: "/images/cline.png" },
  { key: "roocline", label: "Roo Cline", icon: "/images/roocline.png" },
  { key: "windsurf", label: "Windsurf", icon: "/images/windsurf.png" },
  { key: "witsy", label: "Witsy", icon: "/images/witsy.png" },
  { key: "enconvo", label: "Enconvo", icon: "/images/enconvo.png" },
  { key: "augment", label: "Augment", icon: "/images/augment.png" },
];

const colorGradientMap: { [key: string]: string } = {
  claude:
    "data-[state=active]:bg-[linear-gradient(to_top,_rgba(239,108,60,0.3),_rgba(239,108,60,0))] data-[state=active]:border-[#EF6C3C]",
  cline:
    "data-[state=active]:bg-[linear-gradient(to_top,_rgba(112,128,144,0.3),_rgba(112,128,144,0))] data-[state=active]:border-[#708090]",
  cursor:
    "data-[state=active]:bg-[linear-gradient(to_top,_rgba(255,255,255,0.08),_rgba(255,255,255,0))] data-[state=active]:border-[#708090]",
  roocline:
    "data-[state=active]:bg-[linear-gradient(to_top,_rgba(45,32,92,0.8),_rgba(45,32,92,0))] data-[state=active]:border-[#7E3FF2]",
  windsurf:
    "data-[state=active]:bg-[linear-gradient(to_top,_rgba(0,176,137,0.3),_rgba(0,176,137,0))] data-[state=active]:border-[#00B089]",
  witsy:
    "data-[state=active]:bg-[linear-gradient(to_top,_rgba(33,135,255,0.3),_rgba(33,135,255,0))] data-[state=active]:border-[#2187FF]",
  enconvo:
    "data-[state=active]:bg-[linear-gradient(to_top,_rgba(126,63,242,0.3),_rgba(126,63,242,0))] data-[state=active]:border-[#7E3FF2]",
};

const getColorGradient = (color: string) => {
  if (colorGradientMap[color]) {
    return colorGradientMap[color];
  }
  return "data-[state=active]:bg-[linear-gradient(to_top,_rgba(126,63,242,0.3),_rgba(126,63,242,0))] data-[state=active]:border-[#7E3FF2]";
};

const allTabs = [{ key: "mcp", label: "MCP Link", icon: "🔗" }, ...clientTabs];

export const Install = () => {
  const [copiedTab, setCopiedTab] = useState<string | null>(null);
  const { t } = useLanguage();
  const user = process.env.NEXT_PUBLIC_USER_ID || "user";

  const URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8765";

  const handleCopy = async (tab: string, isMcp: boolean = false) => {
    const text = isMcp
      ? `${URL}/mcp/openmemory/sse/${user}`
      : `npx @openmemory/install local ${URL}/mcp/${tab}/sse/${user} --client ${tab}`;

    try {
      // Try using the Clipboard API first
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback: Create a temporary textarea element
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      // Update UI to show success
      setCopiedTab(tab);
      setTimeout(() => setCopiedTab(null), 1500); // Reset after 1.5s
    } catch (error) {
      console.error("Failed to copy text:", error);
      // You might want to add a toast notification here to show the error
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">{t("install.title")}</h2>

      <div className="hidden">
        <div className="data-[state=active]:bg-[linear-gradient(to_top,_rgba(239,108,60,0.3),_rgba(239,108,60,0))] data-[state=active]:border-[#EF6C3C]"></div>
        <div className="data-[state=active]:bg-[linear-gradient(to_top,_rgba(112,128,144,0.3),_rgba(112,128,144,0))] data-[state=active]:border-[#708090]"></div>
        <div className="data-[state=active]:bg-[linear-gradient(to_top,_rgba(45,32,92,0.3),_rgba(45,32,92,0))] data-[state=active]:border-[#2D205C]"></div>
        <div className="data-[state=active]:bg-[linear-gradient(to_top,_rgba(0,176,137,0.3),_rgba(0,176,137,0))] data-[state=active]:border-[#00B089]"></div>
        <div className="data-[state=active]:bg-[linear-gradient(to_top,_rgba(33,135,255,0.3),_rgba(33,135,255,0))] data-[state=active]:border-[#2187FF]"></div>
        <div className="data-[state=active]:bg-[linear-gradient(to_top,_rgba(126,63,242,0.3),_rgba(126,63,242,0))] data-[state=active]:border-[#7E3FF2]"></div>
        <div className="data-[state=active]:bg-[linear-gradient(to_top,_rgba(239,108,60,0.3),_rgba(239,108,60,0))] data-[state=active]:border-[#EF6C3C]"></div>
        <div className="data-[state=active]:bg-[linear-gradient(to_top,_rgba(107,33,168,0.3),_rgba(107,33,168,0))] data-[state=active]:border-primary"></div>
        <div className="data-[state=active]:bg-[linear-gradient(to_top,_rgba(255,255,255,0.08),_rgba(255,255,255,0))] data-[state=active]:border-[#708090]"></div>
      </div>

      <Tabs defaultValue="claude" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 p-0 grid grid-cols-9">
          {allTabs.map(({ key, label, icon }) => (
            <TabsTrigger
              key={key}
              value={key}
              className={`flex-1 px-0 pb-2 rounded-none ${getColorGradient(
                key
              )} data-[state=active]:border-b-2 data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground flex items-center justify-center gap-2 text-sm`}
            >
              {icon.startsWith("/") ? (
                <div>
                  <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    <Image src={icon} alt={label} width={40} height={40} />
                  </div>
                </div>
              ) : (
                <div className="h-6">
                  <span className="relative top-1">{icon}</span>
                </div>
              )}
              <span>{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* MCP Tab Content */}
        <TabsContent value="mcp" className="mt-6">
          <Card className="bg-card border-border">
            <CardHeader className="py-4">
              <CardTitle className="text-card-foreground text-xl">MCP Link</CardTitle>
            </CardHeader>
            <hr className="border-border" />
            <CardContent className="py-4">
              <div className="relative">
                <pre className="bg-secondary px-4 py-3 rounded-md overflow-x-auto text-sm">
                  <code className="text-gray-300">
                    {URL}/mcp/openmemory/sse/{user}
                  </code>
                </pre>
                <div>
                  <button
                    className="absolute top-0 right-0 py-3 px-4 rounded-md hover:bg-accent bg-muted"
                    aria-label="Copy to clipboard"
                    onClick={() => handleCopy("mcp", true)}
                  >
                    {copiedTab === "mcp" ? (
                      <Check className="h-5 w-5 text-green-400" />
                    ) : (
                      <Copy className="h-5 w-5 text-muted-foreground" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Client Tabs Content */}
        {clientTabs.map(({ key }) => (
          <TabsContent key={key} value={key} className="mt-6">
            <Card className="bg-card border-border">
              <CardHeader className="py-4">
                <CardTitle className="text-card-foreground text-xl">
                  {key.charAt(0).toUpperCase() + key.slice(1)} {t("install.command")}
                </CardTitle>
              </CardHeader>
              <hr className="border-border" />
              <CardContent className="py-4">
                <div className="relative">
                  <pre className="bg-secondary px-4 py-3 rounded-md overflow-x-auto text-sm">
                    <code className="text-gray-300">
                      {`npx @openmemory/install local ${URL}/mcp/${key}/sse/${user} --client ${key}`}
                    </code>
                  </pre>
                  <div>
                    <button
                    className="absolute top-0 right-0 py-3 px-4 rounded-md hover:bg-accent bg-muted"
                      aria-label="Copy to clipboard"
                      onClick={() => handleCopy(key)}
                    >
                      {copiedTab === key ? (
                        <Check className="h-5 w-5 text-green-400" />
                      ) : (
                        <Copy className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default Install;
