/* eslint react/no-unescaped-entities: "off" */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  Footprints,
  Save,
  TrendingUp,
  Target,
  Smartphone,
  ExternalLink,
  Zap,
  Calendar,
} from 'lucide-react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts'
import { supabase } from '@/lib/supabase'

const STEPS_GOAL = 8000

export default function StepsTracker() {
  const [todaySteps, setTodaySteps] = useState(0)
  const [inputSteps, setInputSteps] = useState('')
  const [showInstructions, setShowInstructions] = useState(false)
  const [weeklyData, setWeeklyData] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load today's steps and weekly data on mount
  useEffect(() => {
    loadStepsData()
  }, [])

  const loadStepsData = async () => {
    try {
      setLoading(true)

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('User not authenticated:', userError)
        setLoading(false)
        return
      }

      // Get today's date
      const today = new Date().toISOString().split('T')[0]

      // Fetch today's steps
      const { data: todayData, error: todayError } = await supabase
        .from('steps_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle()

      if (todayError && todayError.code !== 'PGRST116') {
        console.error('Error loading today steps:', todayError)
      } else if (todayData) {
        setTodaySteps(todayData.steps)
      }

      // Fetch last 7 days for chart
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]

      const { data: weekData, error: weekError } = await supabase
        .from('steps_logs')
        .select('date, steps, goal')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgoStr)
        .lte('date', today)
        .order('date', { ascending: true })

      if (weekError) {
        console.error('Error loading weekly steps:', weekError)
      } else {
        // Format data for chart (fill missing days with 0)
        const chartData = []
        for (let i = 6; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateStr = date.toISOString().split('T')[0]
          const dayData = weekData?.find((d) => d.date === dateStr)

          chartData.push({
            date: dateStr,
            day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
            steps: dayData?.steps || 0,
            goal: dayData?.goal || STEPS_GOAL,
          })
        }
        setWeeklyData(chartData)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error in loadStepsData:', error)
      setLoading(false)
    }
  }

  const handleSaveSteps = async () => {
    const steps = parseInt(inputSteps)
    if (isNaN(steps) || steps < 0) {
      toast.error('Digite um número válido de passos')
      return
    }

    try {
      setSaving(true)

      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error('Você precisa estar autenticado')
        setSaving(false)
        return
      }

      const today = new Date().toISOString().split('T')[0]

      // Upsert (insert or update if exists)
      const { data, error } = await supabase
        .from('steps_logs')
        .upsert(
          {
            user_id: user.id,
            date: today,
            steps: steps,
            goal: STEPS_GOAL,
            source: 'manual',
          },
          {
            onConflict: 'user_id,date',
          },
        )
        .select()
        .single()

      if (error) {
        console.error('Error saving steps:', error)
        toast.error('Erro ao salvar passos')
      } else {
        setTodaySteps(steps)
        setInputSteps('')
        toast.success(`${steps.toLocaleString()} passos salvos! 👟`)

        // Reload weekly data to update chart
        await loadStepsData()
      }

      setSaving(false)
    } catch (error) {
      console.error('Error in handleSaveSteps:', error)
      toast.error('Erro ao salvar passos')
      setSaving(false)
    }
  }

  const progressPercent = Math.min((todaySteps / STEPS_GOAL) * 100, 100)
  const isGoalReached = todaySteps >= STEPS_GOAL
  const chartData = [
    { name: 'Completo', value: progressPercent },
    { name: 'Restante', value: 100 - progressPercent },
  ]

  const getMotivationMessage = () => {
    if (todaySteps >= STEPS_GOAL) {
      return {
        icon: '🔥',
        title: 'Meta alcançada!',
        message: 'Parabéns! Você bateu sua meta de passos hoje.',
        color: 'text-phoenix-amber',
        bgColor: 'bg-phoenix-amber/10',
        borderColor: 'border-phoenix-amber/30',
      }
    } else if (todaySteps >= STEPS_GOAL * 0.75) {
      return {
        icon: '💪',
        title: 'Quase lá!',
        message: `Faltam apenas ${(STEPS_GOAL - todaySteps).toLocaleString()} passos.`,
        color: 'text-green-600',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30',
      }
    } else if (todaySteps >= STEPS_GOAL * 0.5) {
      return {
        icon: '👍',
        title: 'Continue assim!',
        message: `Você já fez ${progressPercent.toFixed(0)}% da sua meta.`,
        color: 'text-blue-600',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30',
      }
    } else if (todaySteps > 0) {
      return {
        icon: '🚶',
        title: 'Bom começo!',
        message: 'Cada passo conta. Continue se movimentando!',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
      }
    }
    return {
      icon: '🎯',
      title: 'Vamos começar!',
      message: 'Registre seus passos ou integre com Apple Health.',
      color: 'text-muted-foreground',
      bgColor: 'bg-secondary/50',
      borderColor: 'border-border',
    }
  }

  const motivation = getMotivationMessage()

  return (
    <div className="space-y-6">
      {/* Main Steps Card */}
      <Card className="glass-card border-phoenix-amber/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Footprints className="h-6 w-6 text-phoenix-amber" />
            Passos de Hoje
          </CardTitle>
          <CardDescription>Meta diária: {STEPS_GOAL.toLocaleString()} passos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && (
            <div className="py-8 text-center text-muted-foreground">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                <Footprints className="h-8 w-8 text-phoenix-amber" />
              </motion.div>
              <p className="mt-2">Carregando seus passos...</p>
            </div>
          )}

          {!loading && (
            <>
              {/* Progress Ring */}
              <div className="flex items-center gap-6">
                <div className="relative h-40 w-40 flex-shrink-0">
                  {/* Gold Glow Effect when goal reached */}
                  {isGoalReached && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      animate={{
                        boxShadow: [
                          '0 0 20px rgba(255, 179, 0, 0.3)',
                          '0 0 40px rgba(255, 179, 0, 0.6)',
                          '0 0 20px rgba(255, 179, 0, 0.3)',
                        ],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}

                  {/* Animated Ring */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          startAngle={90}
                          endAngle={-270}
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={800}
                          animationEasing="ease-out"
                        >
                          <Cell fill={isGoalReached ? '#FFB300' : '#FFB300'} />
                          <Cell fill="rgba(255, 179, 0, 0.1)" />
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </motion.div>

                  {/* Center Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.span
                      key={todaySteps}
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{
                        scale: isGoalReached ? [1, 1.1, 1] : 1,
                        opacity: 1,
                      }}
                      transition={{
                        scale: {
                          duration: 0.6,
                          repeat: isGoalReached ? Infinity : 0,
                          repeatDelay: 2,
                        },
                        opacity: { duration: 0.3 },
                      }}
                      className={`text-4xl font-bold ${isGoalReached ? 'text-phoenix-amber' : 'text-phoenix-amber'}`}
                    >
                      {todaySteps.toLocaleString()}
                    </motion.span>
                    <span className="text-xs text-muted-foreground">passos</span>

                    {/* Goal Reached Badge */}
                    {isGoalReached && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="absolute -bottom-2 rounded-full bg-gradient-to-r from-phoenix-amber to-phoenix-gold px-3 py-1 text-[10px] font-bold text-white shadow-lg"
                      >
                        META ATINGIDA! 🎯
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Progresso</span>
                      <span className="text-sm text-muted-foreground">
                        {progressPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-secondary">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-phoenix-amber to-phoenix-gold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.div
                      className="rounded-lg bg-secondary/50 p-3 text-center"
                      animate={
                        isGoalReached
                          ? {
                              backgroundColor: [
                                'rgba(255, 179, 0, 0.1)',
                                'rgba(255, 179, 0, 0.2)',
                                'rgba(255, 179, 0, 0.1)',
                              ],
                            }
                          : {}
                      }
                      transition={{
                        duration: 2,
                        repeat: isGoalReached ? Infinity : 0,
                        ease: 'easeInOut',
                      }}
                    >
                      <div className="text-2xl font-bold text-phoenix-amber">
                        {Math.max(0, STEPS_GOAL - todaySteps).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">Restantes</div>
                    </motion.div>
                    <motion.div
                      className="rounded-lg bg-secondary/50 p-3 text-center"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="text-2xl font-bold text-green-500">
                        {((todaySteps * 0.045) / 1000).toFixed(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">km aprox.</div>
                    </motion.div>
                  </div>
                </div>
              </div>

              {/* Motivation Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`rounded-lg border-2 p-4 ${motivation.bgColor} ${motivation.borderColor} ${isGoalReached ? 'relative overflow-hidden' : ''}`}
              >
                {/* Celebratory background effect */}
                {isGoalReached && (
                  <>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-phoenix-amber/20 via-phoenix-gold/20 to-phoenix-amber/20"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                    {/* Sparkle particles */}
                    {[...Array(8)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute h-1 w-1 rounded-full bg-phoenix-amber"
                        initial={{
                          x: '50%',
                          y: '50%',
                          scale: 0,
                          opacity: 0,
                        }}
                        animate={{
                          x: `${50 + Math.cos((i * Math.PI * 2) / 8) * 100}%`,
                          y: `${50 + Math.sin((i * Math.PI * 2) / 8) * 100}%`,
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          delay: i * 0.2,
                          ease: 'easeOut',
                        }}
                      />
                    ))}
                  </>
                )}

                <div className="relative z-10 flex items-start gap-3">
                  <motion.div
                    className="text-3xl"
                    animate={
                      isGoalReached
                        ? {
                            rotate: [0, -10, 10, -10, 10, 0],
                            scale: [1, 1.2, 1.2, 1.2, 1.2, 1],
                          }
                        : {}
                    }
                    transition={{
                      duration: 1,
                      repeat: isGoalReached ? Infinity : 0,
                      repeatDelay: 3,
                    }}
                  >
                    {motivation.icon}
                  </motion.div>
                  <div className="flex-1">
                    <motion.h3
                      className={`text-lg font-bold ${motivation.color} mb-1`}
                      animate={
                        isGoalReached
                          ? {
                              scale: [1, 1.05, 1],
                            }
                          : {}
                      }
                      transition={{
                        duration: 2,
                        repeat: isGoalReached ? Infinity : 0,
                        ease: 'easeInOut',
                      }}
                    >
                      {motivation.title}
                    </motion.h3>
                    <p className="text-sm text-foreground/80">{motivation.message}</p>
                  </div>
                </div>
              </motion.div>

              {/* Manual Input */}
              <div className="space-y-3">
                <Label htmlFor="steps-input" className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Registrar Passos Manualmente
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="steps-input"
                    type="number"
                    placeholder="Ex: 5000"
                    value={inputSteps}
                    onChange={(e) => setInputSteps(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSaveSteps()
                    }}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSaveSteps}
                    className="bg-gradient-to-r from-phoenix-amber to-phoenix-gold"
                    disabled={!inputSteps || saving}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {saving ? 'Salvando...' : 'Salvar'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Weekly Chart */}
      {!loading && weeklyData.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-phoenix-amber" />
              Últimos 7 Dias
            </CardTitle>
            <CardDescription>Progresso semanal de passos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem',
                    }}
                    formatter={(value) => [`${value.toLocaleString()} passos`, 'Passos']}
                  />
                  <ReferenceLine
                    y={STEPS_GOAL}
                    stroke="#10b981"
                    strokeDasharray="5 5"
                    label={{
                      value: 'Meta',
                      position: 'right',
                      fill: '#10b981',
                      fontSize: 12,
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="steps"
                    stroke="#FFB300"
                    strokeWidth={3}
                    dot={{ fill: '#FFB300', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Weekly Stats */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <div className="text-xl font-bold text-phoenix-amber">
                  {Math.round(
                    weeklyData.reduce((sum, day) => sum + day.steps, 0) / weeklyData.length,
                  ).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Média Diária</div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <div className="text-xl font-bold text-green-500">
                  {weeklyData.filter((day) => day.steps >= day.goal).length}
                </div>
                <div className="text-xs text-muted-foreground">Metas Batidas</div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3 text-center">
                <div className="text-xl font-bold text-blue-500">
                  {weeklyData.reduce((sum, day) => sum + day.steps, 0).toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Total Semana</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* iOS Shortcut Integration */}
      <Card className="glass-card border-blue-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-5 w-5 text-blue-500" />
            Integração com Apple Health
          </CardTitle>
          <CardDescription>Sincronize automaticamente seus passos do iPhone</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
            <Zap className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
            <div className="flex-1 text-sm">
              <p className="mb-1 font-medium">Sincronização Automática</p>
              <p className="text-muted-foreground">
                Configure um atalho do iOS para enviar seus passos diários automaticamente do Apple
                Health.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowInstructions(!showInstructions)}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            {showInstructions ? 'Ocultar Instruções' : 'Ver Instruções de Integração'}
          </Button>

          {/* Instructions */}
          {showInstructions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 rounded-lg border border-dashed bg-secondary/30 p-4"
            >
              <h4 className="flex items-center gap-2 font-semibold">
                📱 Como Configurar o Atalho do iOS
              </h4>

              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-phoenix-amber text-xs font-bold text-white">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Abra o app Atalhos</p>
                    <p className="text-muted-foreground">
                      No seu iPhone, abra o app "Atalhos" (Shortcuts)
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-phoenix-amber text-xs font-bold text-white">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Criar Novo Atalho</p>
                    <p className="text-muted-foreground">
                      Toque no botão "+" e adicione as seguintes ações:
                    </p>
                    <ul className="ml-4 mt-2 list-inside list-disc space-y-1 text-muted-foreground">
                      <li>Buscar "Localizar Amostras de Saúde"</li>
                      <li>Selecionar "Contagem de Passos"</li>
                      <li>Período: "Hoje"</li>
                      <li>Adicionar "Obter do Dicionário" → "Contagem"</li>
                      <li>Adicionar "Obter Conteúdos de URL"</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-phoenix-amber text-xs font-bold text-white">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Configurar URL</p>
                    <p className="mb-2 text-muted-foreground">Na ação "Obter Conteúdos de URL":</p>
                    <ul className="ml-4 list-inside list-disc space-y-1 text-muted-foreground">
                      <li>URL: Use a URL abaixo</li>
                      <li>Método: POST</li>
                      <li>Corpo: JSON</li>
                    </ul>
                    <code className="mt-2 block break-all rounded bg-black/20 p-2 text-xs dark:bg-white/10">
                      {typeof window !== 'undefined'
                        ? window.location.origin
                        : 'https://seu-dominio.com'}
                      /api/steps
                    </code>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-phoenix-amber text-xs font-bold text-white">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Corpo JSON</p>
                    <p className="mb-2 text-muted-foreground">Configure o corpo da requisição:</p>
                    <code className="block rounded bg-black/20 p-2 text-xs dark:bg-white/10">
                      {`{
  "steps": [Contagem],
  "date": "[Data Atual]" (formato YYYY-MM-DD)
}`}
                    </code>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-phoenix-amber text-xs font-bold text-white">
                    5
                  </div>
                  <div>
                    <p className="font-medium">Automatizar</p>
                    <p className="text-muted-foreground">
                      Na aba "Automação", crie uma nova automação para executar este atalho
                      automaticamente às 23h todos os dias.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-green-500/20 bg-green-500/10 p-3">
                <p className="text-xs text-green-600 dark:text-green-400">
                  ✅ <strong>Pronto!</strong> A API /api/steps está configurada para receber os
                  dados do seu iPhone automaticamente.
                </p>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      {/* Benefits Card */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Benefícios de Caminhar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="flex items-start gap-3 rounded-lg bg-secondary/30 p-3">
              <div className="text-2xl">❤️</div>
              <div className="text-sm">
                <p className="mb-1 font-medium">Saúde Cardiovascular</p>
                <p className="text-muted-foreground">Reduz risco de doenças cardíacas</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-secondary/30 p-3">
              <div className="text-2xl">🧠</div>
              <div className="text-sm">
                <p className="mb-1 font-medium">Saúde Mental</p>
                <p className="text-muted-foreground">Reduz estresse e ansiedade</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-secondary/30 p-3">
              <div className="text-2xl">⚡</div>
              <div className="text-sm">
                <p className="mb-1 font-medium">Mais Energia</p>
                <p className="text-muted-foreground">Aumenta disposição durante o dia</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg bg-secondary/30 p-3">
              <div className="text-2xl">💪</div>
              <div className="text-sm">
                <p className="mb-1 font-medium">Controle de Peso</p>
                <p className="text-muted-foreground">Ajuda a manter peso saudável</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
