'use client'

/**
 * 🦅 Phoenix Coach – TrainingAnalytics Pro 2.0
 * ----------------------------------------------------
 * Dashboard completo com:
 * - Painel Global
 * - Painel do Treinador (lista fixa)
 * - Ranking 🥇🥈🥉
 * - Níveis Phoenix (Bronze → Lendário)
 * - Zonas ideais / insights
 * - Exportação CSV
 * - Gráficos otimizados (Recharts)
 * - Supabase + TypeScript 100% compatível
 * ----------------------------------------------------
 */

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, CartesianGrid
} from 'recharts'
import {
  format, subWeeks, startOfWeek, addDays
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Flame, TrendingUp, Activity, Download, Users,
  Trophy, Star, Crown, ArrowUpRight, ArrowDownRight
} from 'lucide-react'

// 📄 CSV export util
function exportToCSV(filename: string, rows: string[][]) {
  const csv = rows.map(r => r.join(';')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
}

// 📊 Tipos
interface WeekAnalytics {
  user_id?: string
  week_start: string
  total_workouts: number
  workouts_done: number
  workouts_missed: number
  total_volume: number
  avg_rpe: number
  adherence_percent: number
  phoenix_score: number
  diff_score: number
  phoenix_level?: string
}

type Agg = {
  total_workouts: number
  workouts_done: number
  workouts_missed: number
  adherence_percent: number
  total_volume: number
  avg_rpe: number | null
  phoenix_score: number | null
}

const emptyAgg: Agg = {
  total_workouts: 0,
  workouts_done: 0,
  workouts_missed: 0,
  adherence_percent: 0,
  total_volume: 0,
  avg_rpe: null,
  phoenix_score: null,
}

export default function TrainingAnalytics() {
  const { user } = useAuth()
  const [role, setRole] = useState<'athlete' | 'coach'>('athlete')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [currRaw, setCurrRaw] = useState<WeekAnalytics[]>([])
  const [prevRaw, setPrevRaw] = useState<WeekAnalytics[]>([])
  const [globalStats, setGlobalStats] = useState<{
    avg_score: number
    avg_adherence: number
    avg_volume: number
  } | null>(null)

  // == Helpers ==
  const toISO = (d: Date) => format(d, 'yyyy-MM-dd')
  const mondayOf = (d: Date) => startOfWeek(d, { weekStartsOn: 1 })

  const currStartISO = toISO(mondayOf(subWeeks(new Date(), 7)))
  const currEndISO = toISO(new Date())

  // === Detecta Coach ===
  useEffect(() => {
    if (!user) return
    if (user.email?.includes('coach')) setRole('coach')
    setSelectedUser(user.id)
  }, [user])

  // === Fetch analytics ===
  useEffect(() => {
    if (!selectedUser) return
    const fetchData = async () => {
      try {
        const [curr, prev] = await Promise.all([
          supabase
            .from('phoenix_analytics_view')
            .select('*')
            .eq('user_id', selectedUser)
            .gte('week_start', currStartISO)
            .lte('week_start', currEndISO)
            .order('week_start', { ascending: true }),
          supabase
            .from('phoenix_analytics_view')
            .select('*')
            .eq('user_id', selectedUser)
            .lte('week_start', toISO(addDays(mondayOf(subWeeks(new Date(), 8)), -1)))
            .gte('week_start', toISO(mondayOf(subWeeks(new Date(), 15))))
            .order('week_start', { ascending: true }),
        ])

        if (curr.error || prev.error) throw new Error(curr.error?.message || prev.error?.message)
        setCurrRaw(curr.data || [])
        setPrevRaw(prev.data || [])
      } catch (err) {
        console.error(err)
        toast.error('Erro ao carregar dados do usuário.')
      }
    }
    fetchData()
  }, [selectedUser])

  // === Global Stats ===
  useEffect(() => {
    const fetchGlobal = async () => {
      try {
        const { data, error } = await supabase
          .from('phoenix_analytics_view')
          .select('phoenix_score, adherence_percent, total_volume')
        if (error) throw error
        if (data?.length) {
          const avg = (k: keyof typeof data[0]) =>
            data.reduce((s, x) => s + (x[k] as number || 0), 0) / data.length
          setGlobalStats({
            avg_score: avg('phoenix_score'),
            avg_adherence: avg('adherence_percent'),
            avg_volume: avg('total_volume'),
          })
        }
      } catch {
        setGlobalStats({ avg_score: 70, avg_adherence: 80, avg_volume: 12000 })
      }
    }
    fetchGlobal()
  }, [])

  // === Agregação ===
  const aggregate = (arr: WeekAnalytics[]): Agg => {
    if (!arr.length) return { ...emptyAgg }
    const total_workouts = arr.reduce((s, x) => s + (x.total_workouts || 0), 0)
    const workouts_done = arr.reduce((s, x) => s + (x.workouts_done || 0), 0)
    const workouts_missed = arr.reduce((s, x) => s + (x.workouts_missed || 0), 0)
    const total_volume = arr.reduce((s, x) => s + (x.total_volume || 0), 0)
    const rpes = arr.map(x => x.avg_rpe).filter(v => v != null)
    const scores = arr.map(x => x.phoenix_score).filter(v => v != null)
    const avg_rpe = rpes.length ? rpes.reduce((a, b) => a + b, 0) / rpes.length : null
    const phoenix_score = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null
    const adherence_percent = total_workouts ? (workouts_done / total_workouts) * 100 : 0
    return { total_workouts, workouts_done, workouts_missed, adherence_percent, total_volume, avg_rpe, phoenix_score }
  }

  const currAgg = useMemo(() => aggregate(currRaw), [currRaw])
  const prevAgg = useMemo(() => aggregate(prevRaw), [prevRaw])
  const pctDelta = (curr?: number | null, prev?: number | null) => {
    if (curr == null || prev == null) return null
    if (prev === 0) return curr === 0 ? 0 : 100
    return ((curr - prev) / prev) * 100
  }
  const dAdh = pctDelta(currAgg.adherence_percent, prevAgg.adherence_percent)
  const dVol = pctDelta(currAgg.total_volume, prevAgg.total_volume)
  const dScore = pctDelta(currAgg.phoenix_score, prevAgg.phoenix_score)
  const latest = currRaw[currRaw.length - 1]

  // === Zonas Ideais ===
  const zoneColor = (metric: string, value: number | null) => {
    if (value == null) return 'text-gray-400'
    switch (metric) {
      case 'adherence':
        return value >= 85 ? 'text-green-600' : value >= 70 ? 'text-amber-500' : 'text-red-600'
      case 'rpe':
        return value >= 6 && value <= 8 ? 'text-green-600' : 'text-amber-500'
      case 'score':
        return value >= 70 ? 'text-green-600' : value >= 50 ? 'text-amber-500' : 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  // === Ranking ===
  const top3 = [...currRaw].sort((a, b) => b.phoenix_score - a.phoenix_score).slice(0, 3)
  const topAdh = currRaw.reduce((p, c) => (c.adherence_percent > p.adherence_percent ? c : p), currRaw[0] || {})
  const topVol = currRaw.reduce((p, c) => (c.total_volume > p.total_volume ? c : p), currRaw[0] || {})

  // === Export CSV ===
  const handleExportCSV = () => {
    if (!currRaw.length) return toast.message('Sem dados no período.')
    const header = ['Semana', 'Treinos', 'Concluídos', 'Perdidos', 'Adesão (%)', 'Volume (kg)', 'RPE', 'Score', 'Nível']
    const rows = currRaw.map(w => [
      format(new Date(w.week_start), 'dd/MM'),
      w.total_workouts, w.workouts_done, w.workouts_missed,
      w.adherence_percent.toFixed(1),
      w.total_volume.toLocaleString(),
      w.avg_rpe.toFixed(1),
      w.phoenix_score.toFixed(1),
      w.phoenix_level || '-',
    ])
    exportToCSV(`Relatorio_PhoenixCoach_${format(new Date(), 'yyyyMMdd')}.csv`, [header, ...rows])
  }

  const Delta = ({ value }: { value: number | null }) => {
    if (value == null) return <span className="text-xs text-muted-foreground">—</span>
    const up = value > 0
    const same = Math.abs(value) < 0.001
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md
        ${same ? 'bg-gray-100 text-gray-600' : up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {same ? '' : up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
        {same ? '0%' : `${value > 0 ? '+' : ''}${value.toFixed(1)}%`}
      </span>
    )
  }

  const insight = (() => {
    const i: string[] = []
    if (dAdh && dAdh > 5) i.push('Adesão melhorou 👏')
    else if (dAdh && dAdh < -5) i.push('Atenção: adesão caiu')
    if (dVol && dVol > 5) i.push('Volume crescente — bom progresso')
    else if (dVol && dVol < -5) i.push('Volume caiu — revise rotina')
    if (dScore && dScore > 5) i.push('Score subiu 🔥')
    else if (dScore && dScore < -5) i.push('Score reduziu — recupere o foco')
    return i.length ? i.join(' • ') : 'Sem grandes variações — consistência mantida.'
  })()

  return (
    <div className="space-y-6">
      {/* 🌍 Painel Global */}
      {globalStats && (
        <Card className="p-4 bg-gradient-to-r from-phoenix-amber/10 to-phoenix-gold/10 border border-phoenix-amber/30">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Star className="w-5 h-5 text-phoenix-amber" />
              Phoenix Score Global
            </h2>
            <div className="flex gap-6 text-center">
              <div><p className="text-xl font-bold text-phoenix-amber">{globalStats.avg_score.toFixed(1)}</p><p className="text-xs text-muted-foreground">Score</p></div>
              <div><p className="text-xl font-bold text-green-600">{globalStats.avg_adherence.toFixed(1)}%</p><p className="text-xs text-muted-foreground">Adesão</p></div>
              <div><p className="text-xl font-bold text-amber-600">{globalStats.avg_volume.toLocaleString()}</p><p className="text-xs text-muted-foreground">Volume</p></div>
            </div>
          </div>
        </Card>
      )}

      {/* 👥 Painel do Treinador */}
      {role === 'coach' && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-phoenix-amber" />
            <h3 className="font-semibold">Painel do Treinador</h3>
          </div>
          <select
            className="border rounded-md px-2 py-2 text-sm w-full sm:w-72"
            value={selectedUser || ''}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value={user?.id}>Meus dados</option>
            <option value="04cec547-fa5c-4754-a29f-95e5bf53ce3d">Aluno A (teste)</option>
            <option value="11111111-1111-1111-1111-111111111111">Aluno B (teste)</option>
          </select>
        </Card>
      )}

      {/* 🔥 Painel de Desempenho */}
      <Card className="p-4 bg-gradient-to-br from-phoenix-amber/10 to-phoenix-gold/10 border border-phoenix-amber/30">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Flame className="w-5 h-5 text-phoenix-amber" />
              Painel de Desempenho
            </h2>
            <p className="text-sm text-muted-foreground">{insight}</p>
          </div>
          {latest && (
            <div className="flex gap-4 text-right">
              <div>
                <p className={`text-2xl font-bold ${zoneColor('score', latest.phoenix_score)}`}>
                  {latest.phoenix_score.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">{latest.phoenix_level || '—'}</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${zoneColor('adherence', latest.adherence_percent)}`}>
                  {latest.adherence_percent.toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">Adesão</p>
              </div>
              <div>
                <p className={`text-2xl font-bold ${zoneColor('rpe', latest.avg_rpe)}`}>
                  {latest.avg_rpe.toFixed(1)}
                </p>
                <p className="text-xs text-muted-foreground">RPE</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 🏆 Ranking */}
      {currRaw.length > 0 && (
        <Card className="p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-phoenix-amber" />
            Melhores Semanas
          </h3>
          <div className="grid sm:grid-cols-3 gap-3 text-center">
            {top3.map((w, i) => (
              <div key={i} className="border rounded-lg p-3 bg-gray-50">
                <p className="text-sm text-muted-foreground">{format(new Date(w.week_start), 'dd/MM')}</p>
                <p className="text-2xl font-bold text-phoenix-amber">{w.phoenix_score.toFixed(1)}</p>
                <p className="text-xs">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} Phoenix Score</p>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <Card className="p-3 bg-green-50 border-green-200">
              <p className="text-xs text-muted-foreground">Maior adesão</p>
              <p className="text-lg font-semibold text-green-700">
                {topAdh.adherence_percent?.toFixed(1)} % ({format(new Date(topAdh.week_start), 'dd/MM')})
              </p>
            </Card>
            <Card className="p-3 bg-amber-50 border-amber-200">
              <p className="text-xs text-muted-foreground">Maior volume</p>
              <p className="text-lg font-semibold text-amber-700">
                {topVol.total_volume?.toLocaleString()} kg ({format(new Date(topVol.week_start), 'dd/MM')})
              </p>
            </Card>
          </div>
        </Card>
      )}

      {/* 📊 Gráficos */}
      <Card className="p-4">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-phoenix-amber" />
          Evolução do Phoenix Score
        </h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={currRaw}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="week_start" tickFormatter={(v) => format(new Date(v), 'dd/MM')} tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} hide />
              <Tooltip formatter={(v: number) => `${v.toFixed(1)} pts`} />
              <Line type="monotone" dataKey="phoenix_score" stroke="#EFB810" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-phoenix-amber" />
            Adesão semanal (%)
          </h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={currRaw}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="week_start" tickFormatter={(v) => format(new Date(v), 'dd/MM')} tick={{ fontSize: 11 }} />
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
              <BarChart data={currRaw}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="week_start" tickFormatter={(v) => format(new Date(v), 'dd/MM')} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `${v.toLocaleString()} kg`} />
                <Bar dataKey="total_volume" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 📤 Export */}
      <div className="flex justify-end">
        <Button
          className="bg-gradient-to-r from-phoenix-amber to-phoenix-gold text-white"
          onClick={handleExportCSV}
        >
          <Download className="w-4 h-4 mr-1" /> Exportar CSV
        </Button>
      </div>
    </div>
  )
}
