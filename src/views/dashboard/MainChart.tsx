import React, { useEffect, useRef } from 'react'
import { CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'
import type { Chart as ChartJS } from 'chart.js'

// Helper to generate random data
const random = () => Math.round(Math.random() * 100)

const MainChart: React.FC = () => {
  const chartRef = useRef<ChartJS>(null)

  useEffect(() => {
    const handleColorSchemeChange = () => {
      const chart = chartRef.current
      if (!chart) return

      setTimeout(() => {
        const xGrid = chart.options.scales?.x?.grid
        const yGrid = chart.options.scales?.y?.grid
        const xTicks = chart.options.scales?.x?.ticks
        const yTicks = chart.options.scales?.y?.ticks

        if (xGrid && yGrid && xTicks && yTicks) {
          xGrid.color = getStyle('--cui-border-color-translucent')
          xTicks.color = getStyle('--cui-body-color')

          yGrid.color = getStyle('--cui-border-color-translucent')
          yTicks.color = getStyle('--cui-body-color')
        }

        chart.update()
      })
    }

    document.documentElement.addEventListener('ColorSchemeChange', handleColorSchemeChange)
    return () =>
      document.documentElement.removeEventListener('ColorSchemeChange', handleColorSchemeChange)
  }, [])

  return (
    <CChartLine
      ref={chartRef}
      style={{ height: '300px', marginTop: '40px' }}
      data={{
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
        datasets: [
          {
            label: 'My First dataset',
            backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
            borderColor: getStyle('--cui-info'),
            pointHoverBackgroundColor: getStyle('--cui-info'),
            borderWidth: 2,
            data: Array.from({ length: 7 }, random),
            fill: true,
          },
          {
            label: 'My Second dataset',
            backgroundColor: 'transparent',
            borderColor: getStyle('--cui-success'),
            pointHoverBackgroundColor: getStyle('--cui-success'),
            borderWidth: 2,
            data: Array.from({ length: 7 }, random),
          },
          {
            label: 'My Third dataset',
            backgroundColor: 'transparent',
            borderColor: getStyle('--cui-danger'),
            pointHoverBackgroundColor: getStyle('--cui-danger'),
            borderWidth: 1,
            borderDash: [8, 5],
            data: Array(7).fill(65),
          },
        ],
      }}
      options={{
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            grid: {
              color: getStyle('--cui-border-color-translucent'),
              drawOnChartArea: false,
            },
            ticks: {
              color: getStyle('--cui-body-color'),
            },
          },
          y: {
            beginAtZero: true,
            border: {
              color: getStyle('--cui-border-color-translucent'),
            },
            grid: {
              color: getStyle('--cui-border-color-translucent'),
            },
            max: 250,
            ticks: {
              color: getStyle('--cui-body-color'),
              maxTicksLimit: 5,
              stepSize: Math.ceil(250 / 5),
            },
          },
        },
        elements: {
          line: { tension: 0.4 },
          point: { radius: 0, hitRadius: 10, hoverRadius: 4, hoverBorderWidth: 3 },
        },
      }}
    />
  )
}

export default React.memo(MainChart)
