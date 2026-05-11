import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="rounded-full w-9 h-9 border border-border/50 hover:bg-muted"
    >
      {theme === "light" ? (
        <Moon className="h-[1.2rem] w-[1.2rem] text-muted-foreground transition-all" />
      ) : (
        <Sun className="h-[1.2rem] w-[1.2rem] text-yellow-400 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
