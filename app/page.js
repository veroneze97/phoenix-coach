'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { animationConfig } from '@/lib/animation-config'
import TrainingEditor from '@/components/TrainingEditor'
import DietPlanner from '@/components/DietPlanner'
import SleepTracker from '@/components/SleepTracker'
import CoachTab from '@/components/CoachTab'
import {
  Home as HomeIcon,
  Dumbbell,
  Utensils,
  Moon,
  Sparkles,
  User,
  LogOut,
  Droplets,
  Footprints,
  Clock,
  Flame,
  Target,
  Calendar,
} from 'lucide-react'

export default function App() {
  const {
    user,
    profile,
    loading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signOut,
    updateProfile,
  } = useAuth()

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Profile setup
  const [name, setName] = useState('')
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(70)
  const [goals, setGoals] = useState({
    weight_loss: false,
    muscle_gain: false,
    endurance: false,
  })

  // Daily check data
  const [water, setWater] = useState(0)
  const [steps, setSteps] = useState(0)
  const [sleep, setSleep] = useState(0)
  const [trainingDone, setTrainingDone] = useState(false)
  const [dietAdherence, setDietAdherence] = useState(0)

  // Stats
  const [weekStats, setWeekStats] = useState([])
  const [phoenixScore, setPhoenixScore] = useState(0)

  // Active tab
  const [activeTab, setActiveTab] = useState('home')

  // Se quiser ligar depois: criar tabela 'checks' e view de semana e acionar carregamento.
  // useEffect(() => {
  //   if (user && profile) {
  //     loadWeekStats()
  //   }
  // }, [user, profile])

  useEffect(() => {
    calculatePhoenixScore()
  }, [water, steps, sleep, trainingDone, dietAdherence])

  const loadWeekStats = async () => {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data, error } = await supabase
        .from('checks')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: true })

      if (!error && data) setWeekStats(data)
    } catch {
      toast.error('Não foi possível carregar a semana.')
    }
  }

  const calculatePhoenixScore = () => {
    let score = 0
    score += Math.min((water / 2500) * 25, 25)
    score += Math.min((steps / 10000) * 25, 25)
    score += Math.min((sleep / 480) * 25, 25)
    score += trainingDone ? 15 : 0
    score += dietAdherence
    setPhoenixScore(Math.round(score))
  }

  const saveTodayCheck = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const checkData = {
        user_id: user.id,
        date: today,
        water_ml: water,
        steps: steps,
        sleep_min: sleep,
        training_completed: trainingDone,
        diet_adherence: dietAdherence,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('checks')
        .upsert(checkData, { onConflict: 'user_id,date' })
        .select()
        .single()

      if (error) throw error

      toast.success('Progresso salvo! 🔥')
      loadWeekStats()
    } catch {
      toast.error('Erro ao salvar progresso')
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    setAuthLoading(true)

    try {
      let result
      if (isSignUp) {
        result = await signUpWithEmail(email, password)
        if (result.error) throw result.error
        toast.success('Conta criada! Verifique seu email.')
      } else {
        result = await signInWithEmail(email, password)
        if (result.error) throw result.error
        toast.success('Bem-vindo de volta! 🔥')
      }
    } catch (error) {
      toast.error(error?.message || 'Erro na autenticação')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setAuthLoading(true)
    try {
      const { error } = await signInWithGoogle()
      if (error) throw error
    } catch (error) {
      toast.error(error?.message || 'Erro ao entrar com Google')
      setAuthLoading(false)
    }
  }

  const handleProfileSetup = async () => {
    try {
      setAuthLoading(true)
      const result = await updateProfile({
        name,
        height_cm: height,
        weight_kg: weight,
        goals_json: goals,
        email: user.email,
      })

      if (result.error) {
        toast.error(`Erro ao salvar perfil: ${result.error.message || 'Verifique sua conexão'}`)
        setAuthLoading(false)
      } else {
        toast.success('Perfil configurado! 🎉')
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    } catch (error) {
      toast.error(`Erro ao salvar perfil: ${error?.message || 'Erro desconhecido'}`)
      setAuthLoading(false)
    }
  }

  const getCoachingMessage = () => {
    if (phoenixScore >= 90) {
      return {
        title: '🔥 Lendário!',
        message: 'Você está no seu auge! Continue assim, campeão.',
        color: 'text-phoenix-600',
      }
    } else if (phoenixScore >= 70) {
      return {
        title: '⭐ Excelente!',
        message: 'Ótimo trabalho! Você está no caminho certo.',
        color: 'text-green-600',
      }
    } else if (phoenixScore >= 50) {
      return {
        title: '💪 Bom trabalho!',
        message: 'Continue assim. Pequenos passos levam a grandes resultados.',
        color: 'text-blue-600',
      }
    } else if (phoenixScore >= 30) {
      return {
        title: '🌱 Começando!',
        message: 'Toda grande jornada começa com um passo. Você consegue!',
        color: 'text-yellow-600',
      }
    } else {
      return {
        title: '🌅 Hora de renascer!',
        message: 'Como a Fênix, você pode se erguer. Comece agora!',
        color: 'text-orange-600',
      }
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Flame className="mx-auto mb-4 h-16 w-16 animate-pulse text-phoenix-500" />
          <p className="text-lg text-muted-foreground">Carregando...</p>
        </motion.div>
      </div>
    )
  }

  // Auth screen
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="rounded-3xl border border-white/20 bg-white/60 shadow-2xl backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-800/60">
            <CardHeader className="text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
                <Flame className="mx-auto mb-4 h-16 w-16 text-phoenix-500" />
              </motion.div>
              <CardTitle className="bg-gradient-to-r from-phoenix-500 to-phoenix-600 bg-clip-text text-3xl font-bold text-transparent">
                Phoenix Coach
              </CardTitle>
              <CardDescription>Renasça mais forte a cada dia</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="•••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="rounded-lg"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-phoenix-500 to-phoenix-600"
                  disabled={authLoading}
                >
                  {authLoading ? 'Aguarde...' : isSignUp ? 'Criar Conta' : 'Entrar'}
                </Button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full rounded-lg"
                onClick={handleGoogleSignIn}
                disabled={authLoading}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar com Google
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsSignUp(!isSignUp)}
              >
                {isSignUp ? 'Já tem conta? Entre' : 'Não tem conta? Crie uma'}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  // Profile setup screen
  if (user && (!profile || !profile.name || !profile.height_cm)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-100 p-4 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="rounded-3xl border border-white/20 bg-white/60 shadow-2xl backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-800/60">
            <CardHeader className="text-center">
              <Flame className="mx-auto mb-2 h-12 w-12 text-phoenix-500" />
              <CardTitle>Complete seu Perfil</CardTitle>
              <CardDescription>Vamos conhecer você melhor</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="rounded-lg"
                />
              </div>

              <div className="space-y-2">
                <Label>Altura: {height} cm</Label>
                <Slider
                  value={[height]}
                  onValueChange={(v) => setHeight(v[0])}
                  min={140}
                  max={220}
                  step={1}
                  className="py-4"
                />
              </div>

              <div className="space-y-2">
                <Label>Peso: {weight} kg</Label>
                <Slider
                  value={[weight]}
                  onValueChange={(v) => setWeight(v[0])}
                  min={40}
                  max={150}
                  step={0.5}
                  className="py-4"
                />
              </div>

              <div className="space-y-3">
                <Label>Objetivos</Label>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Perder peso</span>
                  <Switch
                    checked={goals.weight_loss}
                    onCheckedChange={(checked) => setGoals({ ...goals, weight_loss: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Ganhar massa</span>
                  <Switch
                    checked={goals.muscle_gain}
                    onCheckedChange={(checked) => setGoals({ ...goals, muscle_gain: checked })}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Melhorar condicionamento</span>
                  <Switch
                    checked={goals.endurance}
                    onCheckedChange={(checked) => setGoals({ ...goals, endurance: checked })}
                  />
                </div>
              </div>

              <Button
                onClick={handleProfileSetup}
                className="w-full rounded-lg bg-gradient-to-r from-phoenix-500 to-phoenix-600"
              >
                Começar Jornada
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  const coachMessage = getCoachingMessage()

  // Main app
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Fundo premium consistente */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-zinc-900 dark:via-zinc-800 dark:to-zinc-900" />

      <div className="pointer-events-auto relative z-20 w-full px-6 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-screen-2xl">
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12 text-center sm:text-left"
          >
            <h1 className="mb-2 text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Dashboard
            </h1>
            <p className="text-lg font-light text-muted-foreground sm:text-xl">
              Bem-vindo de volta, {profile?.name || 'Atleta'}!
            </p>
          </motion.header>

          <main className="w-full">
            <AnimatePresence mode="wait">
              {activeTab === 'home' && (
                <motion.div
                  key="home"
                  {...animationConfig.tabTransition}
                  className="space-y-8 lg:space-y-12"
                >
                  {/* Phoenix Score Card */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-3xl border border-white/20 bg-white/60 p-8 shadow-2xl backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-800/60 lg:p-12"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">Score Phoenix</CardTitle>
                        <CardDescription>Seu desempenho hoje</CardDescription>
                      </div>
                      <motion.div
                        animate={{
                          rotate: phoenixScore > 70 ? [0, 10, -10, 0] : 0,
                        }}
                        transition={{ duration: 0.5 }}
                      >
                        <Flame
                          className={`h-12 w-12 ${phoenixScore > 70 ? 'text-phoenix-500' : 'text-muted-foreground'}`}
                        />
                      </motion.div>
                    </div>
                    <CardContent className="mt-6 space-y-6">
                      <div className="text-center">
                        <motion.div
                          key={phoenixScore}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="bg-gradient-to-r from-phoenix-500 to-phoenix-600 bg-clip-text text-6xl font-bold text-transparent"
                        >
                          {phoenixScore}
                        </motion.div>
                        <p className="text-sm text-muted-foreground">de 100 pontos</p>
                      </div>
                      <Progress value={phoenixScore} className="h-3" />
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`mt-4 max-w-md text-center font-medium text-foreground ${coachMessage.color}`}
                      >
                        {coachMessage.message}
                      </motion.p>
                    </CardContent>
                  </motion.div>

                  {/* Daily Metrics */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-3xl border border-white/20 bg-white/60 p-8 shadow-2xl backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-800/60 lg:p-12"
                  >
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-2xl">
                        <Target className="h-6 w-6 text-phoenix-500" />
                        Métricas do Dia
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      {/* Water */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Droplets className="h-4 w-4 text-blue-500" />
                          Água: {water} ml
                        </Label>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Meta: 2500ml</span>
                          <span className="text-sm font-bold text-blue-600">
                            {Math.round((water / 2500) * 100)}%
                          </span>
                        </div>
                        <Slider
                          value={[water]}
                          onValueChange={(v) => setWater(v[0])}
                          max={4000}
                          step={100}
                        />
                      </div>

                      {/* Steps */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Footprints className="h-4 w-4 text-green-500" />
                          Passos: {steps.toLocaleString()}
                        </Label>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Meta: 10.000</span>
                          <span className="text-sm font-bold text-green-600">
                            {Math.round((steps / 10000) * 100)}%
                          </span>
                        </div>
                        <Slider
                          value={[steps]}
                          onValueChange={(v) => setSteps(v[0])}
                          max={20000}
                          step={100}
                        />
                      </div>

                      {/* Sleep */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-purple-500" />
                          Sono: {Math.floor(sleep / 60)}h {sleep % 60}min
                        </Label>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Meta: 8h</span>
                          <span className="text-sm font-bold text-purple-600">
                            {Math.round((sleep / 480) * 100)}%
                          </span>
                        </div>
                        <Slider
                          value={[sleep]}
                          onValueChange={(v) => setSleep(v[0])}
                          max={720}
                          step={15}
                        />
                      </div>

                      {/* Training */}
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Dumbbell className="h-4 w-4 text-phoenix-500" />
                          Treino completo
                        </Label>
                        <Switch checked={trainingDone} onCheckedChange={setTrainingDone} />
                      </div>

                      {/* Diet */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <Utensils className="h-4 w-4 text-orange-500" />
                          Aderência à dieta: {dietAdherence}/10
                        </Label>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Meta: 10</span>
                          <span className="text-sm font-bold text-orange-600">
                            {dietAdherence * 10}%
                          </span>
                        </div>
                        <Slider
                          value={[dietAdherence]}
                          onValueChange={(v) => setDietAdherence(v[0])}
                          max={10}
                          step={1}
                        />
                      </div>

                      <Button
                        onClick={saveTodayCheck}
                        className="w-full rounded-2xl bg-gradient-to-r from-phoenix-500 to-phoenix-600 text-white shadow-xl transition-all hover:shadow-2xl"
                      >
                        Salvar Progresso
                      </Button>
                    </CardContent>
                  </motion.div>

                  {/* Week Summary */}
                  {weekStats.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-3xl border border-white/20 bg-white/60 p-8 shadow-2xl backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-800/60 lg:p-12"
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-2xl">
                          <Calendar className="h-6 w-6 text-phoenix-500" />
                          Última Semana
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {weekStats.slice(-7).map((check, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-xl bg-secondary/50 p-3"
                            >
                              <span className="text-sm font-medium">
                                {new Date(check.date).toLocaleDateString('pt-BR', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </span>
                              <div className="flex gap-1">
                                {check.water_ml >= 2000 && (
                                  <Droplets className="h-4 w-4 text-blue-500" />
                                )}
                                {check.steps >= 8000 && (
                                  <Footprints className="h-4 w-4 text-green-500" />
                                )}
                                {check.training_completed && (
                                  <Dumbbell className="h-4 w-4 text-phoenix-500" />
                                )}
                                {check.sleep_min >= 420 && (
                                  <Moon className="h-4 w-4 text-purple-500" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {activeTab === 'treino' && (
                <motion.div
                  key="treino"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="safe-bottom"
                >
                  <TrainingEditor selectedDate={new Date()} />
                </motion.div>
              )}

              {activeTab === 'dieta' && (
                <motion.div
                  key="dieta"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="safe-bottom"
                >
                  <DietPlanner />
                </motion.div>
              )}

              {activeTab === 'sono' && (
                <motion.div
                  key="sono"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="safe-bottom container mx-auto max-w-2xl space-y-6 px-4 py-6"
                >
                  {/* Sleep Score Card */}
                  <Card className="rounded-3xl border border-white/20 bg-white/60 p-8 shadow-2xl backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-800/60 lg:p-12">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl">Sleep Score</CardTitle>
                          <CardDescription>Sua qualidade de sono</CardDescription>
                        </div>
                        <motion.div
                          animate={{
                            rotate: sleep >= 420 ? [0, 10, -10, 0] : 0,
                          }}
                          transition={{ duration: 0.5 }}
                        >
                          <Moon
                            className={`h-12 w-12 ${sleep >= 420 ? 'text-phoenix-amber' : 'text-muted-foreground'}`}
                          />
                        </motion.div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center">
                        <motion.div
                          key={sleep}
                          initial={{ scale: 0.8 }}
                          animate={{ scale: 1 }}
                          className="bg-gradient-to-r from-purple-500 to-phoenix-amber bg-clip-text text-6xl font-bold text-transparent"
                        >
                          {Math.round((sleep / 480) * 100)}
                        </motion.div>
                        <p className="text-sm text-muted-foreground">de 100 pontos</p>
                      </div>
                      <Progress value={(sleep / 480) * 100} className="h-3" />

                      {/* Sleep Tip */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className={`rounded-lg border-2 p-4 ${
                          sleep >= 420
                            ? 'border-phoenix-amber/30 bg-phoenix-amber/10'
                            : 'border-orange-500/30 bg-orange-500/10'
                        }`}
                      >
                        <p
                          className={`font-semibold ${sleep >= 420 ? 'text-phoenix-amber' : 'text-orange-600'}`}
                        >
                          {sleep >= 420 ? '✨ Meta atingida!' : '⏰ Durma mais cedo'}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {sleep >= 420
                            ? 'Você está dormindo o suficiente para recuperação ideal.'
                            : `Faltam ${Math.ceil((480 - sleep) / 60)}h para atingir as 8h recomendadas.`}
                        </p>
                      </motion.div>
                    </CardContent>
                  </Card>

                  <SleepTracker />
                </motion.div>
              )}

              {activeTab === 'coach' && (
                <motion.div
                  key="coach"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="safe-bottom container mx-auto max-w-2xl px-4 py-6"
                >
                  <CoachTab />
                </motion.div>
              )}

              {activeTab === 'perfil' && (
                <motion.div
                  key="perfil"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="safe-bottom container mx-auto max-w-2xl space-y-6 px-4 py-6"
                >
                  <Card className="rounded-3xl border border-white/20 bg-white/60 shadow-2xl backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-800/60">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-6 w-6" />
                        Perfil
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="text-center">
                        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-phoenix-500 to-phoenix-600">
                          <span className="text-3xl font-bold text-white">
                            {profile?.name?.charAt(0).toUpperCase() || 'A'}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold">{profile?.name || 'Atleta'}</h3>
                        <p className="text-sm text-muted-foreground">{user?.email}</p>
                      </div>

                      <div className="space-y-3 border-t pt-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Altura</span>
                          <span className="font-medium">{profile?.height_cm} cm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Peso</span>
                          <span className="font-medium">{profile?.weight_kg} kg</span>
                        </div>
                        {profile?.goals_json && Object.keys(profile.goals_json).length > 0 && (
                          <div className="pt-2">
                            <span className="mb-2 block text-sm text-muted-foreground">
                              Objetivos
                            </span>
                            <div className="flex flex-wrap gap-2">
                              {profile.goals_json.weight_loss && (
                                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-600 dark:text-blue-400">
                                  Perder peso
                                </span>
                              )}
                              {profile.goals_json.muscle_gain && (
                                <span className="rounded-full bg-phoenix-500/10 px-3 py-1 text-xs text-phoenix-gold">
                                  Ganhar massa
                                </span>
                              )}
                              {profile.goals_json.endurance && (
                                <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs text-green-600 dark:text-green-400">
                                  Condicionamento
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        className="w-full rounded-lg"
                        onClick={() => {
                          signOut()
                          toast.success('Até logo! 👋')
                        }}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sair
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border border-white/20 bg-white/60 shadow-2xl backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-800/60">
                    <CardHeader>
                      <CardTitle className="text-sm">Sobre o App</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs text-muted-foreground">
                      <p>
                        <strong>Phoenix Coach</strong> — Seu companheiro de jornada para uma vida
                        mais saudável.
                      </p>
                      <p>Versão 1.0.0 MVP</p>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </main>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border border-white/20 bg-white/70 shadow-xl backdrop-blur-xl dark:border-zinc-700/50 dark:bg-zinc-800/70">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="flex items-center justify-around py-2">
            <button
              onClick={() => setActiveTab('home')}
              className={`flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-colors ${
                activeTab === 'home' ? 'text-phoenix-500' : 'text-muted-foreground'
              }`}
            >
              <HomeIcon className="h-5 w-5" />
              <span className="text-xs">Home</span>
            </button>

            <button
              onClick={() => setActiveTab('treino')}
              className={`flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-colors ${
                activeTab === 'treino' ? 'text-phoenix-500' : 'text-muted-foreground'
              }`}
            >
              <Dumbbell className="h-5 w-5" />
              <span className="text-xs">Treino</span>
            </button>

            <button
              onClick={() => setActiveTab('dieta')}
              className={`flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-colors ${
                activeTab === 'dieta' ? 'text-phoenix-500' : 'text-muted-foreground'
              }`}
            >
              <Utensils className="h-5 w-5" />
              <span className="text-xs">Dieta</span>
            </button>

            <button
              onClick={() => setActiveTab('sono')}
              className={`flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-colors ${
                activeTab === 'sono' ? 'text-phoenix-500' : 'text-muted-foreground'
              }`}
            >
              <Moon className="h-5 w-5" />
              <span className="text-xs">Sono</span>
            </button>

            <button
              onClick={() => setActiveTab('coach')}
              className={`flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-colors ${
                activeTab === 'coach' ? 'text-phoenix-500' : 'text-muted-foreground'
              }`}
            >
              <Sparkles className="h-5 w-5" />
              <span className="text-xs">Coach</span>
            </button>

            <button
              onClick={() => setActiveTab('perfil')}
              className={`flex flex-col items-center gap-1 rounded-lg px-4 py-2 transition-colors ${
                activeTab === 'perfil' ? 'text-phoenix-500' : 'text-muted-foreground'
              }`}
            >
              <User className="h-5 w-5" />
              <span className="text-xs">Perfil</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
