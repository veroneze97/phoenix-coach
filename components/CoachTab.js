'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Dumbbell,
  Utensils,
  Moon,
  Footprints,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Flame,
  RefreshCw,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export default function CoachTab() {
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [phoenixScore, setPhoenixScore] = useState(0)
  const [metrics, setMetrics] = useState({
    training: { percentage: 0, trend: 'neutral' },
    diet: { percentage: 0, trend: 'neutral' },
    sleep: { percentage: 0, trend: 'neutral' },
    steps: { percentage: 0, trend: 'neutral' },
  })
  const [latestMessage, setLatestMessage] = useState(null)
  const [prevScore, setPrevScore] = useState(0)
  const isEliteScore = phoenixScore >= 90

  useEffect(() => {
    loadCoachData()
  }, [])

  useEffect(() => {
    // Track previous score for smooth transitions
    if (phoenixScore !== prevScore) {
      setPrevScore(phoenixScore)
    }
  }, [phoenixScore])

  const loadCoachData = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        console.error('User not authenticated:', userError)
        setLoading(false)
        return
      }

      // Calculate metrics from last 7 days
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0]
      const today = new Date().toISOString().split('T')[0]

      // Fetch workout data (training consistency)
      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('date')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgoStr)
        .lte('date', today)

      const trainingConsistency = workouts ? (workouts.length / 7) * 100 : 0

      // Fetch meal logs (diet adherence)
      const { data: mealLogs, error: mealError } = await supabase
        .from('meal_logs')
        .select('date, adherence_bool')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgoStr)
        .lte('date', today)

      let dietAdherence = 0
      if (mealLogs && mealLogs.length > 0) {
        const adherentMeals = mealLogs.filter(log => log.adherence_bool).length
        dietAdherence = (adherentMeals / mealLogs.length) * 100
      }

      // Fetch sleep logs (sleep quality)
      const { data: sleepLogs, error: sleepError } = await supabase
        .from('sleep_logs')
        .select('quality, duration_min')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgoStr)
        .lte('date', today)

      let sleepQuality = 0
      if (sleepLogs && sleepLogs.length > 0) {
        const avgQuality = sleepLogs.reduce((sum, log) => sum + (log.quality || 0), 0) / sleepLogs.length
        sleepQuality = (avgQuality / 5) * 100 // Convert 1-5 scale to percentage
      }

      // Fetch steps logs (steps completion)
      const { data: stepsLogs, error: stepsError } = await supabase
        .from('steps_logs')
        .select('steps, goal')
        .eq('user_id', user.id)
        .gte('date', sevenDaysAgoStr)
        .lte('date', today)

      let stepsCompletion = 0
      if (stepsLogs && stepsLogs.length > 0) {
        const completionRates = stepsLogs.map(log => Math.min((log.steps / log.goal) * 100, 100))
        stepsCompletion = completionRates.reduce((sum, rate) => sum + rate, 0) / completionRates.length
      }

      // Calculate Phoenix Score: 0.4·CT + 0.3·AD + 0.2·Sleep + 0.1·Steps
      const calculatedScore = Math.round(
        0.4 * trainingConsistency +
        0.3 * dietAdherence +
        0.2 * sleepQuality +
        0.1 * stepsCompletion
      )

      setPhoenixScore(calculatedScore)
      setMetrics({
        training: { 
          percentage: Math.round(trainingConsistency), 
          trend: trainingConsistency >= 70 ? 'up' : trainingConsistency >= 40 ? 'neutral' : 'down' 
        },
        diet: { 
          percentage: Math.round(dietAdherence), 
          trend: dietAdherence >= 70 ? 'up' : dietAdherence >= 40 ? 'neutral' : 'down' 
        },
        sleep: { 
          percentage: Math.round(sleepQuality), 
          trend: sleepQuality >= 70 ? 'up' : sleepQuality >= 40 ? 'neutral' : 'down' 
        },
        steps: { 
          percentage: Math.round(stepsCompletion), 
          trend: stepsCompletion >= 70 ? 'up' : stepsCompletion >= 40 ? 'neutral' : 'down' 
        },
      })

      // Fetch latest coach message
      const { data: message, error: messageError } = await supabase
        .from('coach_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (message) {
        setLatestMessage(message)
      }

      setLoading(false)
    } catch (error) {
      console.error('Error loading coach data:', error)
      setLoading(false)
    }
  }

  const generateWeeklyMessage = async () => {
    try {
      setGenerating(true)

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        toast.error('Você precisa estar autenticado')
        setGenerating(false)
        return
      }

      // Get current week reference (YYYY-WW format)
      const now = new Date()
      const weekNumber = getWeekNumber(now)
      const weekRef = `${now.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`

      // Determine tone and message based on Phoenix Score
      let tone, message
      
      if (phoenixScore >= 80) {
        tone = 'excellent'
        message = `Incrível! Seu Score Phoenix está em ${phoenixScore}. Você está mantendo uma consistência excepcional em todos os aspectos. Continue assim e os resultados virão! 🔥💪`
      } else if (phoenixScore >= 60) {
        tone = 'good'
        message = `Bom trabalho! Score Phoenix em ${phoenixScore}. Você está no caminho certo. Foque em melhorar os pontos fracos para alcançar a excelência. Vamos juntos! 💪✨`
      } else {
        tone = 'low'
        message = `Score Phoenix em ${phoenixScore}. Não desanime! Pequenas melhorias diárias fazem grande diferença. Vamos reorganizar sua rotina e voltar ao topo! 💡🎯`
      }

      // Upsert message
      const { data, error } = await supabase
        .from('coach_messages')
        .upsert({
          user_id: user.id,
          week_ref: weekRef,
          tone: tone,
          message: message,
          score: phoenixScore,
        }, {
          onConflict: 'user_id,week_ref'
        })
        .select()
        .single()

      if (error) {
        console.error('Error generating message:', error)
        toast.error('Erro ao gerar mensagem')
      } else {
        setLatestMessage(data)
        toast.success('Mensagem semanal gerada! 🎉')
      }

      setGenerating(false)
    } catch (error) {
      console.error('Error in generateWeeklyMessage:', error)
      toast.error('Erro ao gerar mensagem')
      setGenerating(false)
    }
  }

  // Helper function to get week number
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
  }

  // Calculate chart data for Phoenix Score ring
  const scoreChartData = [
    { name: 'Score', value: phoenixScore },
    { name: 'Remaining', value: 100 - phoenixScore },
  ]

  // Get score message based on value
  const getScoreMessage = (score) => {
    if (score >= 80) {
      return {
        title: 'Excelente! 🔥',
        message: 'Você está no caminho certo. Continue assim!',
        color: 'text-phoenix-amber',
      }
    } else if (score >= 60) {
      return {
        title: 'Bom trabalho! 💪',
        message: 'Bom progresso. Vamos melhorar ainda mais!',
        color: 'text-green-500',
      }
    } else if (score >= 40) {
      return {
        title: 'Continue tentando! 👍',
        message: 'Você pode melhorar. Foco nos objetivos!',
        color: 'text-yellow-500',
      }
    } else {
      return {
        title: 'Vamos lá! 🎯',
        message: 'Hora de retomar o foco. Você consegue!',
        color: 'text-orange-500',
      }
    }
  }

  const scoreMessage = getScoreMessage(phoenixScore)

  // Get trend icon
  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-5 h-5 text-green-500" />
      case 'down':
        return <TrendingDown className="w-5 h-5 text-red-500" />
      default:
        return <Minus className="w-5 h-5 text-muted-foreground" />
    }
  }

  const metricsConfig = {
    training: {
      label: 'Consistência de Treino',
      icon: Dumbbell,
      color: 'text-phoenix-amber',
      bgColor: 'bg-phoenix-amber/10',
      borderColor: 'border-phoenix-amber/20',
      progressColor: 'from-phoenix-amber to-phoenix-gold',
    },
    diet: {
      label: 'Aderência à Dieta',
      icon: Utensils,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      progressColor: 'bg-green-500',
    },
    sleep: {
      label: 'Qualidade do Sono',
      icon: Moon,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      progressColor: 'bg-purple-500',
    },
    steps: {
      label: 'Meta de Passos',
      icon: Footprints,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      progressColor: 'bg-blue-500',
    },
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="glass-card">
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <Sparkles className="w-8 h-8 text-phoenix-amber" />
              </motion.div>
              <p className="mt-2">Carregando seus dados...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Banner with Phoenix Score */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="glass-card border-phoenix-amber/30 overflow-hidden relative">
          {/* Background gradient effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-phoenix-amber/5 via-transparent to-phoenix-gold/5" />
          
          {/* Elite Score Enhanced Background */}
          {isEliteScore && (
            <>
              {/* Animated gradient sweep */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-phoenix-amber/10 to-transparent"
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear"
                }}
              />
              
              {/* Floating particles */}
              {[...Array(20)].map((_, i) => (
                <motion.div
                  key={`bg-particle-${i}`}
                  className="absolute w-1 h-1 rounded-full bg-phoenix-gold/40"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                  }}
                  animate={{
                    y: [-20, -60],
                    opacity: [0, 1, 0],
                    scale: [0, 1.5, 0],
                  }}
                  transition={{
                    duration: 2 + Math.random() * 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                    ease: "easeOut"
                  }}
                />
              ))}
              
              {/* Pulsing border glow */}
              <motion.div
                className="absolute inset-0 border-2 border-phoenix-amber/0 rounded-[20px]"
                animate={{
                  borderColor: [
                    'rgba(255, 179, 0, 0)',
                    'rgba(255, 179, 0, 0.3)',
                    'rgba(255, 179, 0, 0)',
                  ],
                  boxShadow: [
                    '0 0 0px rgba(255, 179, 0, 0)',
                    '0 0 30px rgba(255, 179, 0, 0.4)',
                    '0 0 0px rgba(255, 179, 0, 0)',
                  ],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
            </>
          )}
          
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-between gap-6">
              {/* Left: Phoenix Logo + Title */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  {/* Elite Score Fire Particles */}
                  {isEliteScore && (
                    <>
                      {[...Array(12)].map((_, i) => (
                        <motion.div
                          key={`particle-${i}`}
                          className="absolute w-1.5 h-1.5 rounded-full bg-gradient-to-t from-phoenix-amber to-phoenix-gold"
                          style={{
                            left: '50%',
                            top: '50%',
                          }}
                          animate={{
                            x: [0, Math.cos((i * Math.PI * 2) / 12) * 40],
                            y: [0, Math.sin((i * Math.PI * 2) / 12) * 40],
                            scale: [0, 1.5, 0],
                            opacity: [0, 1, 0],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeOut"
                          }}
                        />
                      ))}
                    </>
                  )}
                  
                  {/* Phoenix Logo */}
                  <motion.div
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-phoenix-amber to-phoenix-gold flex items-center justify-center shadow-lg relative z-10"
                    animate={isEliteScore ? {
                      boxShadow: [
                        '0 0 30px rgba(255, 179, 0, 0.6)',
                        '0 0 50px rgba(255, 179, 0, 0.9)',
                        '0 0 30px rgba(255, 179, 0, 0.6)',
                      ],
                      scale: [1, 1.05, 1],
                    } : {
                      boxShadow: [
                        '0 0 20px rgba(255, 179, 0, 0.3)',
                        '0 0 30px rgba(255, 179, 0, 0.5)',
                        '0 0 20px rgba(255, 179, 0, 0.3)',
                      ],
                    }}
                    transition={{
                      duration: isEliteScore ? 2 : 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    {/* Wing Glow Effect for Elite Score */}
                    {isEliteScore && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full bg-gradient-to-br from-phoenix-amber/40 to-phoenix-gold/40 blur-xl"
                          animate={{
                            scale: [1, 1.4, 1],
                            opacity: [0.3, 0.6, 0.3],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                          }}
                        />
                        {/* Rotating ring */}
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-phoenix-gold/50"
                          animate={{
                            rotate: 360,
                            scale: [1, 1.2, 1],
                          }}
                          transition={{
                            rotate: {
                              duration: 4,
                              repeat: Infinity,
                              ease: "linear"
                            },
                            scale: {
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }
                          }}
                        />
                      </>
                    )}
                    
                    <motion.div
                      animate={isEliteScore ? {
                        rotate: [-5, 5, -5],
                        scale: [1, 1.1, 1],
                      } : {}}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Flame className="w-8 h-8 text-white relative z-10" />
                    </motion.div>
                  </motion.div>
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <motion.div
                      animate={isEliteScore ? {
                        rotate: [0, 360],
                        scale: [1, 1.2, 1],
                      } : {}}
                      transition={{
                        rotate: {
                          duration: 3,
                          repeat: Infinity,
                          ease: "linear"
                        },
                        scale: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }
                      }}
                    >
                      <Sparkles className="w-6 h-6 text-phoenix-amber" />
                    </motion.div>
                    Coach Phoenix
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Análise do seu progresso
                  </p>
                  {isEliteScore && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-xs font-bold text-phoenix-amber mt-1"
                    >
                      ⭐ Performance Elite!
                    </motion.p>
                  )}
                </div>
              </div>

              {/* Right: Phoenix Score Ring */}
              <div className="relative w-32 h-32 flex-shrink-0">
                {/* Elite Score Outer Glow Ring */}
                {isEliteScore && (
                  <>
                    <motion.div
                      className="absolute inset-0 rounded-full border-4 border-phoenix-amber/30"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.7, 0.3],
                        rotate: 360,
                      }}
                      transition={{
                        scale: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        },
                        opacity: {
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        },
                        rotate: {
                          duration: 8,
                          repeat: Infinity,
                          ease: "linear"
                        }
                      }}
                    />
                    <motion.div
                      className="absolute inset-0 rounded-full bg-phoenix-amber/20 blur-2xl"
                      animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.5, 0.2],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    />
                  </>
                )}
                
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={scoreChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={60}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    >
                      <Cell fill="#FFB300" />
                      <Cell fill="rgba(255, 179, 0, 0.1)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <motion.span
                    key={phoenixScore}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ 
                      scale: isEliteScore ? [1, 1.15, 1] : 1,
                      opacity: 1 
                    }}
                    transition={{ 
                      scale: {
                        duration: 1,
                        repeat: isEliteScore ? Infinity : 0,
                        repeatDelay: 1.5,
                        ease: "easeInOut"
                      },
                      opacity: { duration: 0.5 }
                    }}
                    className={`text-3xl font-bold ${isEliteScore ? 'text-phoenix-amber' : 'text-phoenix-amber'}`}
                  >
                    {phoenixScore}
                  </motion.span>
                  <span className="text-xs text-muted-foreground">Score</span>
                  
                  {/* Elite Badge */}
                  {isEliteScore && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-2 bg-gradient-to-r from-phoenix-amber to-phoenix-gold text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg"
                    >
                      ELITE
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Score Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className={`mt-6 p-4 rounded-lg border relative overflow-hidden ${
                isEliteScore 
                  ? 'bg-gradient-to-r from-phoenix-amber/20 to-phoenix-gold/20 border-phoenix-amber/40' 
                  : 'bg-gradient-to-r from-phoenix-amber/10 to-phoenix-gold/10 border-phoenix-amber/20'
              }`}
            >
              {/* Elite Score Background Animation */}
              {isEliteScore && (
                <>
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-phoenix-gold/20 via-transparent to-phoenix-amber/20"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear"
                    }}
                  />
                  {/* Sparkles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={`sparkle-${i}`}
                      className="absolute w-1 h-1 rounded-full bg-phoenix-gold"
                      style={{
                        left: `${15 + i * 15}%`,
                        top: `${20 + (i % 2) * 60}%`,
                      }}
                      animate={{
                        scale: [0, 1.5, 0],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut"
                      }}
                    />
                  ))}
                </>
              )}
              
              <h3 className={`text-lg font-bold mb-1 relative z-10 ${scoreMessage.color}`}>
                {scoreMessage.title}
              </h3>
              <p className="text-sm text-foreground/80 relative z-10">
                {scoreMessage.message}
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Latest Coach Message Card */}
      {latestMessage && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="glass-card border-phoenix-amber/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="w-5 h-5 text-phoenix-amber" />
                Mensagem da Semana
              </CardTitle>
              <CardDescription>
                Gerada em {new Date(latestMessage.created_at).toLocaleDateString('pt-BR')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${
                latestMessage.tone === 'excellent' ? 'bg-phoenix-amber/10 border-phoenix-amber/30' :
                latestMessage.tone === 'good' ? 'bg-green-500/10 border-green-500/30' :
                'bg-orange-500/10 border-orange-500/30'
              } border-2`}>
                <p className="text-sm leading-relaxed">
                  {latestMessage.message}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Generate Message Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          onClick={generateWeeklyMessage}
          disabled={generating}
          className="w-full bg-gradient-to-r from-phoenix-amber to-phoenix-gold hover:opacity-90 transition-opacity"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} />
          {generating ? 'Gerando...' : 'Gerar Nova Mensagem Semanal'}
        </Button>
      </motion.div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(metrics).map(([key, data], index) => {
          const config = metricsConfig[key]
          const Icon = config.icon
          
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Card className={`glass-card ${config.borderColor} border-2 hover:shadow-lg transition-shadow`}>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${config.color}`} />
                      <span className="text-base">{config.label}</span>
                    </div>
                    {getTrendIcon(data.trend)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`p-4 rounded-lg ${config.bgColor}`}>
                    <div className="flex items-baseline gap-2">
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.4 + index * 0.1, type: "spring" }}
                        className={`text-4xl font-bold ${config.color}`}
                      >
                        {data.percentage}
                      </motion.span>
                      <span className="text-lg text-muted-foreground">%</span>
                    </div>
                    <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${data.percentage}%` }}
                        transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                        className={`h-full bg-gradient-to-r ${config.progressColor}`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {data.trend === 'up' && '↗ Melhorando'}
                      {data.trend === 'down' && '↘ Precisa atenção'}
                      {data.trend === 'neutral' && '→ Estável'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>

      {/* Insights Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="glass-card border-phoenix-amber/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-5 h-5 text-phoenix-amber" />
              Recomendações Personalizadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {metrics.sleep.percentage < 70 && (
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <p className="text-sm">
                  <span className="font-semibold">😴 Sono:</span> Sua qualidade de sono está abaixo do ideal. Tente dormir mais cedo e evite telas 1h antes de dormir.
                </p>
              </div>
            )}
            
            {metrics.training.percentage > 80 && (
              <div className="p-3 rounded-lg bg-phoenix-amber/10 border border-phoenix-amber/20">
                <p className="text-sm">
                  <span className="font-semibold">💪 Treino:</span> Excelente consistência! Continue assim e varie os exercícios para melhores resultados.
                </p>
              </div>
            )}
            
            {metrics.diet.percentage < 75 && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm">
                  <span className="font-semibold">🥗 Dieta:</span> Planeje suas refeições com antecedência para melhorar a aderência à sua dieta.
                </p>
              </div>
            )}

            {metrics.steps.percentage > 90 && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <p className="text-sm">
                  <span className="font-semibold">🚶 Passos:</span> Você está batendo suas metas de atividade diária! Continue se movimentando!
                </p>
              </div>
            )}

            {/* General tip */}
            <div className="p-3 rounded-lg bg-phoenix-amber/10 border border-phoenix-amber/20">
              <p className="text-sm">
                <span className="font-semibold">💡 Dica:</span> Consistência é a chave! Pequenas melhorias diárias levam a grandes resultados.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Formula Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <Card className="glass-card border-dashed">
          <CardContent className="pt-6">
            <p className="text-xs text-center text-muted-foreground">
              <strong>Score Phoenix:</strong> 40% Treino + 30% Dieta + 20% Sono + 10% Passos
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}