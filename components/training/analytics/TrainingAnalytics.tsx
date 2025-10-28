'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid } from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Flame, TrendingUp, Activity, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

// 🧾 libs p/ exportação
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface WeekAnalytics {
  week_start: string
  total_workouts: number
  workouts_done: number
  workouts_missed: number
  total_volume: number
  avg_rpe: number
  adherence_percent: number
  phoenix_score: number
  diff_score: number
}

export default function TrainingAnalytics() {
  const { user } = useAuth()
  const [data, setData] = useState<WeekAnalytics[]>([])

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('phoenix_analytics_view')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: true })
      if (error) console.error(error)
      else setData(data.slice(-8))
    }
    fetchData()
  }, [user])

  const latest = data[data.length - 1]
  const diff = latest?.diff_score ?? 0

  // 📄 Exportar PDF
  const exportPDF = () => {
    const doc = new jsPDF()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('Relatório Phoenix Coach', 14, 20)
    doc.setFontSize(11)
    doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 14, 28)

    const tableData = data.map((w) => [
      format(new Date(w.week_start), 'dd/MM'),
      w.total_workouts,
      w.workouts_done,
      w.adherence_percent.toFixed(1) + '%',
      w.total_volume.toLocaleString(),
      w.avg_rpe.toFixed(1),
      w.phoenix_score.toFixed(1),
    ])

    autoTable(doc, {
      startY: 35,
      head: [['Semana', 'Treinos', 'Concluídos', 'Adesão %', 'Volume (kg)', 'RPE médio', 'Score']],
      body: tableData,
      styles: { fontSize: 10, halign: 'center' },
      headStyles: { fillColor: [239, 184, 16] },
    })

    doc.save(`Relatorio_PhoenixCoach_${format(new Date(), 'yyyyMMdd')}.pdf`)
  }

  // 📊 Exportar CSV
  const exportCSV = () => {
    const header = [
      'Semana',
      'Treinos',
      'Concluídos',
      'Perdidos',
      'Adesão (%)',
      'Volume (kg)',
      'RPE médio',
      'Score',
    ]
    const rows = data.map((w) => [
      format(new Date(w.week_start), 'dd/MM'),
      w.total_workouts,
      w.workouts_done,
      w.workouts_missed,
      w.adherence_percent.toFixed(1),
      w.total_volume.toLocaleString(),
      w.avg_rpe.toFixed(1),
      w.phoenix_score.toFixed(1),
    ])
    const csvContent =
      [header, ...rows].map((e) => e.join(';')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Relatorio_PhoenixCoach_${format(new Date(), 'yyyyMMdd')}.csv`
    link.click()
  }

  return (
    <div className="space-y-6">
      {/* 📤 Exportações */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={exportCSV}>
          <Download className="w-4 h-4 mr-1" /> CSV
        </Button>
        <Button
          className="bg-gradient-to-r from-phoenix-amber to-phoenix-gold text-white"
          onClick={exportPDF}
        >
          <Download className="w-4 h-4 mr-1" /> PDF
        </Button>
      </div>

      {/* 🧠 Cabeçalho */}
      <Card className="p-4 bg-gradient-to-br from-phoenix-amber/10 to-phoenix-gold/10 border border-phoenix-amber/30 rounded-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Flame className="w-5 h-5 text-phoenix-amber" />
              Painel de Desempenho
            </h2>
            {latest && (
              <p className="text-sm text-muted-foreground">
                Semana de {format(new Date(latest.week_start), "dd 'de' MMMM", { locale: ptBR })}
              </p>
            )}
          </div>

          {latest && (
            <div className="flex flex-col text-right">
              <span className="text-4xl font-bold text-phoenix-amber">{latest.phoenix_score}</span>
              <span
                className={`text-sm ${
                  diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-muted-foreground'
                }`}
              >
                {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : 'sem variação'}
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* 📈 Phoenix Score */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-phoenix-amber" />
          Evolução do Phoenix Score
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis
                dataKey="week_start"
                tickFormatter={(v) => format(new Date(v), 'dd/MM')}
                tick={{ fontSize: 11 }}
              />
              <YAxis domain={[0, 100]} hide />
              <Tooltip
                formatter={(v: number) => `${v.toFixed(1)} pts`}
                labelFormatter={(v: string) =>
                  `Semana de ${format(new Date(v), "dd/MM", { locale: ptBR })}`
                }
              />
              <Line
                type="monotone"
                dataKey="phoenix_score"
                stroke="#EFB810"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 💪 Adesão e Volume */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-phoenix-amber" />
            Adesão semanal (%)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="week_start"
                  tickFormatter={(v) => format(new Date(v), 'dd/MM')}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="adherence_percent" fill="#EFB810" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-phoenix-amber" />
            Volume total (kg)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis
                  dataKey="week_start"
                  tickFormatter={(v) => format(new Date(v), 'dd/MM')}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(v: number) => `${v.toLocaleString()} kg`} />
                <Bar dataKey="total_volume" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  )
}
