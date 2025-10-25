'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { toast } from 'sonner'
import {
  Moon,
  Sun,
  Clock,
  Sparkles,
  TrendingUp,
  Calendar,
  Zap,
  Star,
  AlertCircle,
  BedDouble,
  Loader2,
  Save,
  Activity,
  Coffee,
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const SLEEP_CYCLE_MINUTES = 90
const FALL_ASLEEP_DEFAULT = 15

export default function SleepTracker() {
  const { user } = useAuth()
  
  // Sleep Calculator state
  const [wakeUpTime, setWakeUpTime] = useState('07:00')
  const [fallAsleepTime, setFallAsleepTime] = useState(FALL_ASLEEP_DEFAULT)

  // Manual log state
  const [bedTime, setBedTime] = useState('')
  const [wakeTime, setWakeTime] = useState('')
  const [sleepQuality, setSleepQuality] = useState(3)
  const [latency, setLatency] = useState(15)

  // Data state
  const [weeklyData, setWeeklyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      loadWeeklyData()
    }
  }, [user])

  const loadWeeklyData = async () => {
    setLoading(true)
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (error) throw error

      setWeeklyData(data || [])
    } catch (error) {
      console.error('Error loading weekly data:', error)
      toast.error('Erro ao carregar dados de sono')
    } finally {
      setLoading(false)
    }
  }

  const saveSleepLog = async () => {
    if (!bedTime || !wakeTime) {
      toast.error('Preencha horário de dormir e acordar')
      return
    }

    setSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]

      const { error } = await supabase
        .from('sleep_logs')
        .upsert({
          user_id: user.id,
          date: today,
          bed_time: bedTime,
          wake_time: wakeTime,
          latency_min: latency,
          quality: sleepQuality,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,date'
        })

      if (error) throw error

      toast.success('Sono registrado com sucesso! 🌙')
      await loadWeeklyData()
      
      // Reset form
      setBedTime('')
      setWakeTime('')
      setSleepQuality(3)
    } catch (error) {
      console.error('Error saving sleep log:', error)
      toast.error('Erro ao salvar registro de sono')
    } finally {
      setSaving(false)
    }
  }

  // Calculate recommended bedtimes
  const calculateBedtimes = () => {
    if (!wakeUpTime) return []

    const [hours, minutes] = wakeUpTime.split(':').map(Number)
    const wakeUpDate = new Date()
    wakeUpDate.setHours(hours, minutes, 0, 0)

    const recommendations = []

    // 6 cycles (optimal), 5 cycles (good), 4 cycles (minimum)
    const cycles = [
      { count: 6, label: 'Ideal', description: '9h de sono', emoji: '🌟' },
      { count: 5, label: 'Bom', description: '7h30 de sono', emoji: '💪' },
      { count: 4, label: 'Mínimo', description: '6h de sono', emoji: '⚡' },
    ]

    cycles.forEach(({ count, label, description, emoji }) => {
      const totalMinutes = (count * SLEEP_CYCLE_MINUTES) + fallAsleepTime
      const bedtimeDate = new Date(wakeUpDate.getTime() - totalMinutes * 60000)
      
      const bedtimeHours = bedtimeDate.getHours().toString().padStart(2, '0')
      const bedtimeMinutes = bedtimeDate.getMinutes().toString().padStart(2, '0')
      const bedtime = `${bedtimeHours}:${bedtimeMinutes}`

      recommendations.push({
        cycles: count,
        label,
        description,
        emoji,
        bedtime,
        totalHours: Math.floor(totalMinutes / 60),
        totalMinutes: totalMinutes % 60,
      })
    })

    return recommendations
  }

  // Calculate activity cutoffs based on bedtime
  const calculateCutoffs = (bedtimeStr) => {
    if (!bedtimeStr) return null

    const [hours, minutes] = bedtimeStr.split(':').map(Number)
    const bedtime = new Date()
    bedtime.setHours(hours, minutes, 0, 0)

    const cutoffs = [
      {
        name: 'HIIT / Treino Intenso',
        icon: Activity,
        color: 'text-red-500',
        hoursBefore: 4,
        description: 'Exercícios intensos elevam cortisol e temperatura'
      },
      {
        name: 'Cafeína',
        icon: Coffee,
        color: 'text-orange-500',
        hoursBefore: 6,
        description: 'Meia-vida da cafeína é 5-6 horas'
      },
      {
        name: 'Refeição Pesada',
        icon: Sparkles,
        color: 'text-yellow-500',
        hoursBefore: 3,
        description: 'Digestão pode atrapalhar o sono'
      },
      {
        name: 'Telas (Luz Azul)',
        icon: Sun,
        color: 'text-blue-500',
        hoursBefore: 1,
        description: 'Suprime produção de melatonina'
      },
    ]

    return cutoffs.map(cutoff => {
      const cutoffTime = new Date(bedtime.getTime() - cutoff.hoursBefore * 60 * 60000)
      const cutoffHours = cutoffTime.getHours().toString().padStart(2, '0')
      const cutoffMinutes = cutoffTime.getMinutes().toString().padStart(2, '0')
      
      return {
        ...cutoff,
        time: `${cutoffHours}:${cutoffMinutes}`
      }
    })
  }

  const recommendations = calculateBedtimes()
  const cutoffs = recommendations.length > 0 ? calculateCutoffs(recommendations[0].bedtime) : null

  // Quality stars
  const qualityLabels = ['Péssimo', 'Ruim', 'Regular', 'Bom', 'Excelente']
  const qualityColors = [
    'text-red-500',
    'text-orange-500',
    'text-yellow-500',
    'text-green-500',
    'text-phoenix-amber',
  ]

  // Prepare chart data from weeklyData
  const chartData = weeklyData.map((log, index) => {
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const date = new Date(log.date)
    const dayName = dayNames[date.getDay()]
    
    return {
      day: dayName,
      hours: log.duration_min ? log.duration_min / 60 : 0,
      quality: log.quality || 0
    }
  })

  // Calculate weekly stats
  const calculateWeeklyStats = () => {
    if (weeklyData.length === 0) {
      return {
        avgHours: 0,
        avgQuality: 0,
        consistency: 0
      }
    }

    const totalMinutes = weeklyData.reduce((sum, log) => sum + (log.duration_min || 0), 0)
    const totalQuality = weeklyData.reduce((sum, log) => sum + (log.quality || 0), 0)
    
    const avgHours = totalMinutes / weeklyData.length / 60
    const avgQuality = totalQuality / weeklyData.length
    const consistency = (weeklyData.length / 7) * 100

    return {
      avgHours: avgHours.toFixed(1),
      avgQuality: Math.round(avgQuality),
      consistency: Math.round(consistency)
    }
  }

  const weeklyStats = calculateWeeklyStats()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Sleep Calculator */}
      <Card className="glass-card border-purple-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="w-6 h-6 text-purple-500" />
            Calculadora de Sono
          </CardTitle>
          <CardDescription>
            Baseado em ciclos de sono de 90 minutos para acordar no momento ideal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wake Up Time */}
            <div className="space-y-2">
              <Label htmlFor="wake-time" className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-orange-500" />
                Horário de Acordar
              </Label>
              <Input
                id="wake-time"
                type="time"
                value={wakeUpTime}
                onChange={(e) => setWakeUpTime(e.target.value)}
                className="text-lg font-mono"
              />
            </div>

            {/* Fall Asleep Latency */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Tempo para Adormecer
                </span>
                <span className="text-sm font-bold">{fallAsleepTime} min</span>
              </Label>
              <Slider
                value={[fallAsleepTime]}
                onValueChange={(v) => setFallAsleepTime(v[0])}
                min={5}
                max={45}
                step={5}
                className="py-4"
              />
              <p className="text-xs text-muted-foreground">
                Tempo médio que você leva para pegar no sono
              </p>
            </div>
          </div>

          {/* Recommendations */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-phoenix-amber" />
              Horários Recomendados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recommendations.map((rec, index) => (
                <div
                  key={rec.cycles}
                  className={`
                    p-4 rounded-lg border-2 backdrop-blur-md transition-all hover:scale-105
                    ${index === 0 
                      ? 'bg-phoenix-amber/10 border-phoenix-amber/30 shadow-lg shadow-phoenix-amber/10' 
                      : index === 1
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-blue-500/10 border-blue-500/30'
                    }
                  `}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{rec.emoji}</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg">{rec.label}</h4>
                      <p className="text-xs text-muted-foreground">{rec.description}</p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 rounded-lg bg-black/10 dark:bg-white/5">
                    <div className="text-center">
                      <div className="text-3xl font-bold font-mono">
                        {rec.bedtime}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {rec.cycles} ciclos de sono
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Como funciona?</p>
              <p className="text-muted-foreground">
                Um ciclo de sono completo dura 90 minutos. Acordar entre ciclos (não no meio) ajuda você a se sentir mais descansado. 
                Recomendamos 5-6 ciclos (7h30-9h) para adultos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual Log Form */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BedDouble className="w-6 h-6 text-purple-500" />
            Registrar Sono Manualmente
          </CardTitle>
          <CardDescription>
            Registre suas horas de sono e qualidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="bed-time" className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-purple-500" />
                Hora que Dormiu
              </Label>
              <Input
                id="bed-time"
                type="time"
                value={bedTime}
                onChange={(e) => setBedTime(e.target.value)}
                className="text-lg font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="wake-time-log" className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-orange-500" />
                Hora que Acordou
              </Label>
              <Input
                id="wake-time-log"
                type="time"
                value={wakeTime}
                onChange={(e) => setWakeTime(e.target.value)}
                className="text-lg font-mono"
              />
            </div>
          </div>

          {/* Sleep Duration Display */}
          {bedTime && wakeTime && (
            <div className="p-4 rounded-lg bg-secondary/50 text-center">
              <div className="text-sm text-muted-foreground mb-1">Duração do Sono</div>
              <div className="text-3xl font-bold text-purple-500">
                {(() => {
                  const [bedH, bedM] = bedTime.split(':').map(Number)
                  const [wakeH, wakeM] = wakeTime.split(':').map(Number)
                  
                  let bedMinutes = bedH * 60 + bedM
                  let wakeMinutes = wakeH * 60 + wakeM
                  
                  // Handle overnight sleep
                  if (wakeMinutes <= bedMinutes) {
                    wakeMinutes += 24 * 60
                  }
                  
                  const diff = wakeMinutes - bedMinutes
                  const hours = Math.floor(diff / 60)
                  const minutes = diff % 60
                  
                  return `${hours}h ${minutes}min`
                })()}
              </div>
            </div>
          )}

          {/* Quality Slider */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Star className={`w-4 h-4 ${qualityColors[sleepQuality - 1]}`} />
              Qualidade do Sono
            </Label>
            
            {/* Quality value display */}
            <div className="text-center p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <Star
                    key={value}
                    className={`w-6 h-6 ${
                      value <= sleepQuality
                        ? qualityColors[sleepQuality - 1]
                        : 'text-muted-foreground/30'
                    }`}
                    fill={value <= sleepQuality ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <p className={`font-semibold ${qualityColors[sleepQuality - 1]}`}>
                {qualityLabels[sleepQuality - 1]}
              </p>
            </div>

            {/* Quality slider */}
            <Slider
              value={[sleepQuality]}
              onValueChange={(v) => setSleepQuality(v[0])}
              min={1}
              max={5}
              step={1}
              className="py-4"
            />
            
            {/* Quality descriptions */}
            <div className="grid grid-cols-5 gap-1 text-xs text-center text-muted-foreground">
              <div>Péssimo</div>
              <div>Ruim</div>
              <div>Regular</div>
              <div>Bom</div>
              <div>Excelente</div>
            </div>
          </div>

          {/* Save Button */}
          <Button 
            className="w-full rounded-lg bg-gradient-to-r from-purple-500 to-purple-700"
            disabled={!bedTime || !wakeTime}
          >
            <Moon className="w-4 h-4 mr-2" />
            Salvar Registro
          </Button>
        </CardContent>
      </Card>

      {/* Weekly Chart Placeholder */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-phoenix-amber" />
            Seu Sono na Última Semana
          </CardTitle>
          <CardDescription>
            Visualize seu padrão de sono e qualidade
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Chart */}
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis 
                  dataKey="day" 
                  stroke="currentColor"
                  className="text-xs text-muted-foreground"
                />
                <YAxis 
                  stroke="currentColor"
                  className="text-xs text-muted-foreground"
                  domain={[0, 10]}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-card p-3 border border-purple-500/20">
                          <p className="text-sm font-semibold">{payload[0].payload.day}</p>
                          <p className="text-sm">
                            <span className="text-purple-500 font-bold">{payload[0].payload.hours.toFixed(1)}h</span> de sono
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`w-3 h-3 ${
                                  star <= payload[0].payload.quality
                                    ? 'text-phoenix-amber'
                                    : 'text-muted-foreground/30'
                                }`}
                                fill={star <= payload[0].payload.quality ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="hours" 
                  stroke="#A855F7" 
                  strokeWidth={3}
                  dot={{ fill: '#A855F7', r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <div className="text-2xl font-bold text-purple-500">{weeklyStats.avgHours}h</div>
              <div className="text-xs text-muted-foreground mt-1">Média por Noite</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center justify-center gap-1 mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= weeklyStats.avgQuality ? 'text-phoenix-amber' : 'text-muted-foreground/30'
                    }`}
                    fill={star <= weeklyStats.avgQuality ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
              <div className="text-xs text-muted-foreground">Qualidade Média</div>
            </div>
            
            <div className="text-center p-4 rounded-lg bg-secondary/50">
              <div className="text-2xl font-bold text-green-500">{weeklyStats.consistency}%</div>
              <div className="text-xs text-muted-foreground mt-1">Consistência</div>
            </div>
          </div>

          {/* Data Status */}
          {weeklyData.length === 0 ? (
            <div className="p-4 rounded-lg bg-muted/50 border border-dashed text-center">
              <Calendar className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                <strong>Nenhum registro ainda.</strong> Comece a registrar seu sono para ver estatísticas.
              </p>
            </div>
          ) : (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
              <p className="text-sm text-green-600 dark:text-green-400">
                ✅ Dados reais dos últimos 7 dias
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sleep Tips */}
      <Card className="glass-card border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="w-5 h-5 text-blue-500" />
            Dicas para Melhor Sono
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <Moon className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Ambiente Escuro</p>
                <p className="text-muted-foreground">Use cortinas blackout ou máscara de dormir</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <Clock className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Rotina Consistente</p>
                <p className="text-muted-foreground">Durma e acorde no mesmo horário</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <Zap className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Evite Cafeína</p>
                <p className="text-muted-foreground">Não tome café 6h antes de dormir</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <Sun className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Luz Natural</p>
                <p className="text-muted-foreground">Exponha-se ao sol pela manhã</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
