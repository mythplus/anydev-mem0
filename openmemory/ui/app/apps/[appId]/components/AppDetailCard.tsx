import { constants } from "@/components/shared/source-app";
import { Button } from "@/components/ui/button";
import { useAppsApi } from "@/hooks/useAppsApi";
import { useLanguage } from "@/lib/LanguageContext";
import { setAppDetails } from "@/store/appsSlice";
import { RootState } from "@/store/store";
import { Loader2, PauseIcon, PlayIcon } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { BiEdit } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";

const capitalize = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const AppDetailCard = ({
  appId,
  selectedApp,
}: {
  appId: string;
  selectedApp: any;
}) => {
  const { updateAppDetails } = useAppsApi();
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const apps = useSelector((state: RootState) => state.apps.apps);
  const currentApp = apps.find((app: any) => app.id === appId);
  const appConfig = currentApp
    ? constants[currentApp.name as keyof typeof constants] || constants.default
    : constants.default;

  const handlePauseAccess = async () => {
    setIsLoading(true);
    try {
      await updateAppDetails(appId, {
        is_active: !selectedApp.details.is_active,
      });
      dispatch(
        setAppDetails({ appId, isActive: !selectedApp.details.is_active })
      );
    } catch (error) {
      console.error("Failed to toggle app pause state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const buttonText = selectedApp.details.is_active
    ? t("appDetail.pauseAccess")
    : t("appDetail.unpauseAccess");

  return (
    <div>
      <div className="bg-card border w-[320px] border-border rounded-xl mb-6">
        <div className="flex items-center gap-2 mb-4 bg-secondary rounded-t-xl p-3">
          <div className="w-5 h-5 flex items-center justify-center">
            {appConfig.iconImage ? (
              <div>
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  <Image
                    src={appConfig.iconImage}
                    alt={appConfig.name}
                    width={40}
                    height={40}
                  />
                </div>
              </div>
            ) : (
              <div className="w-5 h-5 flex items-center justify-center bg-muted rounded-full">
                <BiEdit className="w-4 h-4 text-muted-foreground" />
              </div>
            )}
          </div>
          <h2 className="text-md font-semibold">{appConfig.name}</h2>
        </div>

        <div className="space-y-4 p-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("appDetail.accessStatus")}</p>
            <p
              className={`font-medium ${
                selectedApp.details.is_active
                  ? "text-emerald-500"
                  : "text-red-500"
              }`}
            >
              {capitalize(
                selectedApp.details.is_active ? "active" : "inactive"
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">{t("appDetail.totalCreated")}</p>
            <p className="font-medium">
              {selectedApp.details.total_memories_created} {t("stats.memories")}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">{t("appDetail.totalAccessed")}</p>
            <p className="font-medium">
              {selectedApp.details.total_memories_accessed} {t("stats.memories")}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">{t("appDetail.firstAccessed")}</p>
            <p className="font-medium">
              {selectedApp.details.first_accessed
                ? new Date(
                    selectedApp.details.first_accessed
                  ).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })
                : t("appDetail.never")}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground">{t("appDetail.lastAccessed")}</p>
            <p className="font-medium">
              {selectedApp.details.last_accessed
                ? new Date(
                    selectedApp.details.last_accessed
                  ).toLocaleDateString("en-US", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "numeric",
                    minute: "numeric",
                  })
                : t("appDetail.never")}
            </p>
          </div>

          <hr className="border-border" />

          <div className="flex gap-2 justify-end">
            <Button
              onClick={handlePauseAccess}
              className="flex bg-transparent w-[170px] bg-secondary border-border hover:bg-accent text-card-foreground"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : buttonText === "Pause Access" ? (
                <PauseIcon className="h-4 w-4" />
              ) : (
                <PlayIcon className="h-4 w-4" />
              )}
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppDetailCard;
