import { constants } from "@/components/shared/source-app";
import { useStats } from "@/hooks/useStats";
import { useLanguage } from "@/lib/LanguageContext";
import { RootState } from "@/store/store";
import Image from "next/image";
import { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";

/**
 * 数字计数动画 Hook
 */
function useCountUp(target: number, duration: number = 600) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const start = prevTarget.current;
    prevTarget.current = target;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  return count;
}

const Stats = () => {
  const { t } = useLanguage();
  const totalMemories = useSelector(
    (state: RootState) => state.profile.totalMemories
  );
  const totalApps = useSelector((state: RootState) => state.profile.totalApps);
  const apps = useSelector((state: RootState) => state.profile.apps).slice(
    0,
    4
  );
  const { fetchStats } = useStats();

  const animatedMemories = useCountUp(totalMemories);
  const animatedApps = useCountUp(totalApps);

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="bg-secondary border-b border-border rounded-t-lg p-4">
        <div className="text-card-foreground text-xl font-semibold">{t("stats.title")}</div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <p className="text-muted-foreground">{t("stats.totalMemories")}</p>
          <h3 className="text-lg font-bold text-card-foreground animate-count-up">
            {animatedMemories} {t("stats.memories")}
          </h3>
        </div>
        <div>
          <p className="text-muted-foreground">{t("stats.totalApps")}</p>
          <div className="flex flex-col items-start gap-1 mt-2">
            <div className="flex -space-x-2">
              {apps.map((app) => (
                <div
                  key={app.id}
                  className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs"
                >
                  <div>
                    <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      <Image
                        src={
                          constants[app.name as keyof typeof constants]
                            ?.iconImage || ""
                        }
                        alt={
                          constants[app.name as keyof typeof constants]?.name
                        }
                        width={32}
                        height={32}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <h3 className="text-lg font-bold text-card-foreground animate-count-up">{animatedApps} {t("stats.apps")}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
