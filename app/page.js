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
import StepsTracker from '@/components/StepsTracker'
import CoachTab from '@/components/CoachTab'
import ProfileTab from '@/components/ProfileTab'
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
  Award,
} from 'lucide-react'

export default function App() {
  const { user, profile, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut, updateProfile } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  
  // Profile setup
  const [name, setName] = useState('')
  const [height, setHeight] = useState(170)
  const [weight, setWeight] = useState(70)
  const [goals, setGoals] = useState({ weight_loss: false, muscle_gain: false, endurance: false })

  // Daily check data
  const [todayCheck, setTodayCheck] = useState(null)
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

  useEffect(() => {
    if (user && profile) {
      loadTodayCheck()
      loadWeekStats()
    }
  }, [user, profile])

  useEffect(() => {
    calculatePhoenixScore()
  }, [water, steps, sleep, trainingDone, dietAdherence])

  const loadTodayCheck = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('checks')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .single()

      if (data) {
        setTodayCheck(data)
        setWater(data.water_ml || 0)
        setSteps(data.steps || 0)
        setSleep(data.sleep_min || 0)
        setTrainingDone(data.training_completed || false)
        setDietAdherence(data.diet_adherence || 0)
      }
    } catch (error) {
      console.log('No check for today yet')
    }
  }

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

      if (data) {
        setWeekStats(data)
      }
    } catch (error) {
      console.error('Error loading week stats:', error)
    }
  }

  const calculatePhoenixScore = () => {
    let score = 0
    
    // Water (0-25 points)
    score += Math.min((water / 2500) * 25, 25)
    
    // Steps (0-25 points)
    score += Math.min((steps / 10000) * 25, 25)
    
    // Sleep (0-25 points)
    score += Math.min((sleep / 480) * 25, 25)
    
    // Training (0-15 points)
    score += trainingDone ? 15 : 0
    
    // Diet (0-10 points)
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
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('checks')
        .upsert(checkData, { onConflict: 'user_id,date' })
        .select()
        .single()

      if (error) throw error

      setTodayCheck(data)
      toast.success('Progresso salvo! 🔥')
      loadWeekStats()
    } catch (error) {
      console.error('Error saving check:', error)
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
      toast.error(error.message || 'Erro na autenticação')
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
      toast.error(error.message || 'Erro ao entrar com Google')
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
        email: user.email
      })
      
      if (result.error) {
        console.error('Profile setup error:', result.error)
        toast.error(`Erro ao salvar perfil: ${result.error.message || 'Verifique sua conexão'}`)
        setAuthLoading(false)
      } else {
        toast.success('Perfil configurado! 🎉')
        // Wait a bit for Supabase to sync, then reload
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }
    } catch (error) {
      console.error('Profile setup exception:', error)
      toast.error(`Erro ao salvar perfil: ${error.message || 'Erro desconhecido'}`)
      setAuthLoading(false)
    }
  }

  const getCoachingMessage = () => {
    if (phoenixScore >= 90) {
      return {
        title: '🔥 Lendário!',
        message: 'Você está no seu auge! Continue assim, campeão.',
        color: 'text-phoenix-amber'
      }
    } else if (phoenixScore >= 70) {
      return {
        title: '⭐ Excelente!',
        message: 'Ótimo trabalho! Você está no caminho certo.',
        color: 'text-green-500'
      }
    } else if (phoenixScore >= 50) {
      return {
        title: '💪 Bom trabalho!',
        message: 'Continue assim. Pequenos passos levam a grandes resultados.',
        color: 'text-blue-500'
      }
    } else if (phoenixScore >= 30) {
      return {
        title: '🌱 Começando!',
        message: 'Todo grande jornada começa com um passo. Você consegue!',
        color: 'text-yellow-500'
      }
    } else {
      return {
        title: '🌅 Hora de renascer!',
        message: 'Como a Fênix, você pode se erguer. Comece agora!',
        color: 'text-orange-500'
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <Flame className="w-16 h-16 text-phoenix-amber mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-muted-foreground">Carregando...</p>
        </motion.div>
      </div>
    )
  }

  // Auth screen
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="glass-card border-phoenix-amber/20">
            <CardHeader className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Flame className="w-16 h-16 text-phoenix-amber mx-auto mb-4" />
              </motion.div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-phoenix-amber to-phoenix-gold bg-clip-text text-transparent">
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
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="rounded-lg"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-r from-phoenix-amber to-phoenix-gold"
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
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <Card className="glass-card">
            <CardHeader className="text-center">
              <Flame className="w-12 h-12 text-phoenix-amber mx-auto mb-2" />
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
                className="w-full rounded-lg bg-gradient-to-r from-phoenix-amber to-phoenix-gold"
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
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/30 to-background">
      {/* Header - Sem mudanças, ele é bom */}
      <header className="glass sticky top-0 z-50 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-6 h-6 text-phoenix-amber" />
            <h1 className="font-bold text-lg">Phoenix Coach</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Olá, {profile?.name || 'Atleta'}!</span>
          </div>
        </div>
      </header>

      {/* Content - A MUDANÇA CRUCIAL ACONTECE AQUI */}
      <main className="w-full">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            // A Home continua com um layout de dashboard centralizado
            <motion.div
              key="home"
              {...animationConfig.tabTransition}
              className="container mx-auto px-4 py-6 max-w-2xl safe-bottom"
            >
              {/* ... todo o conteúdo da aba 'home' (Phoenix Score, Daily Metrics, etc.) ... */}
            </motion.div>
          )}

          {/* As outras abas agora podem usar a largura total! */}
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
              className="container mx-auto px-4 py-6 max-w-2xl safe-bottom" // Sono pode se beneficiar de um layout mais centralizado também
            >
              {/* ... todo o conteúdo da aba 'sono' ... */}
            </motion.div>
          )}

          {activeTab === 'coach' && (
            <motion.div
              key="coach"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="container mx-auto px-4 py-6 max-w-2xl safe-bottom" // Coach também
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
              className="container mx-auto px-4 py-6 max-w-2xl safe-bottom" // Perfil também
            >
              {/* ... todo o conteúdo da aba 'perfil' ... */}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation - Sem mudanças, ele é bom */}
      <nav className="glass fixed bottom-0 left-0 right-0 border-t">
        {/* ... conteúdo do nav ... */}
      </nav>
    </div>
  )
}
