import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import { ChartDataPoint } from '@/types';

interface SalesChartProps {
  data: ChartDataPoint[];
  activeIndex?: number;
}

export function SalesChart({ data, activeIndex }: SalesChartProps) {
  return (
    <div className="bg-card rounded-xl p-4 border shadow-card">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        Ventas de la Semana
      </h3>
      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    index === activeIndex
                      ? 'hsl(var(--primary))'
                      : 'hsl(var(--primary) / 0.3)'
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
