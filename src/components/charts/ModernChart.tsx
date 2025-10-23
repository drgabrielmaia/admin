'use client'

import { Line, Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
  ChartOptions,
  TooltipItem,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ArcElement
)

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    tension?: number
    fill?: boolean
  }[]
}

interface ModernChartProps {
  type: 'line' | 'bar' | 'doughnut'
  data: ChartData
  title?: string
  height?: number
  className?: string
}

export function ModernChart({ type, data, title, height = 300, className }: ModernChartProps) {
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
            weight: '500'
          },
          color: '#94A3B8',
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#F1F5F9',
        bodyColor: '#CBD5E1',
        borderColor: '#334155',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12,
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 13,
          weight: '600'
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 12,
          weight: '400'
        },
        callbacks: {
          label: function(context: TooltipItem<'line' | 'bar' | 'doughnut'>) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: type !== 'doughnut' ? {
      x: {
        border: {
          display: false
        },
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11,
            weight: '500'
          },
          color: '#64748B'
        }
      },
      y: {
        border: {
          display: false
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.3)',
          drawTicks: false
        },
        ticks: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 11,
            weight: '500'
          },
          color: '#64748B',
          padding: 10,
          callback: function(value: string | number) {
            return new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              notation: 'compact',
              maximumFractionDigits: 1
            }).format(Number(value));
          }
        }
      }
    } : undefined
  }

  const enhancedData = {
    ...data,
    datasets: data.datasets.map((dataset, index) => ({
      ...dataset,
      borderColor: dataset.borderColor || `hsl(${210 + index * 60}, 70%, 60%)`,
      backgroundColor: dataset.backgroundColor || 
        (type === 'doughnut' 
          ? [`hsl(${210 + index * 30}, 70%, 60%)`, `hsl(${240 + index * 30}, 70%, 60%)`, `hsl(${270 + index * 30}, 70%, 60%)`]
          : `hsla(${210 + index * 60}, 70%, 60%, 0.1)`),
      tension: dataset.tension || 0.4,
      fill: dataset.fill !== undefined ? dataset.fill : type === 'line',
      borderWidth: type === 'line' ? 2 : 1,
      pointBackgroundColor: dataset.borderColor || `hsl(${210 + index * 60}, 70%, 60%)`,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: dataset.borderColor || `hsl(${210 + index * 60}, 70%, 60%)`,
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 2,
    }))
  }

  const renderChart = () => {
    const options = commonOptions as ChartOptions<'line' | 'bar' | 'doughnut'>;
    switch (type) {
      case 'line':
        return <Line data={enhancedData} options={options as any} />
      case 'bar':
        return <Bar data={enhancedData} options={options as any} />
      case 'doughnut':
        return <Doughnut data={enhancedData} options={options as any} />
      default:
        return <Line data={enhancedData} options={options as any} />
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-foreground mb-4 px-1">
          {title}
        </h3>
      )}
      <div style={{ height: `${height}px` }}>
        {renderChart()}
      </div>
    </div>
  )
}