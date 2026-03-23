import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import { LineChart, BarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import type { EChartsCoreOption } from "echarts/core";

echarts.use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  CanvasRenderer,
]);

interface EChartProps {
  option: EChartsCoreOption;
  className?: string;
  style?: React.CSSProperties;
}

export function EChart({ option, className, style }: EChartProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const isDark = document.documentElement.classList.contains("dark");
    chartRef.current = echarts.init(
      containerRef.current,
      isDark ? "dark" : undefined,
    );
    chartRef.current.setOption({ backgroundColor: "transparent", ...option });

    const observer = new ResizeObserver(() => {
      chartRef.current?.resize();
    });
    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.setOption(
        { backgroundColor: "transparent", ...option },
        true,
      );
    }
  }, [option]);

  // Watch for theme changes on <html> class attribute
  useEffect(() => {
    const observer = new MutationObserver(() => {
      if (!containerRef.current || !chartRef.current) return;
      const isDark = document.documentElement.classList.contains("dark");
      chartRef.current.dispose();
      chartRef.current = echarts.init(
        containerRef.current,
        isDark ? "dark" : undefined,
      );
      chartRef.current.setOption(
        { backgroundColor: "transparent", ...option },
        true,
      );
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [option]);

  return <div ref={containerRef} className={className} style={style} />;
}
